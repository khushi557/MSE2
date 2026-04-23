const dns = require('dns').promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ================= DB =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

// ================= MODELS =================

// 🔹 User (Auth)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// 🔹 Item (Lost & Found)
const itemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ["Lost", "Found"], required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    contactInfo: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);

// ================= AUTH MIDDLEWARE =================
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ================= AUTH ROUTES =================

// 🔹 Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist)
      return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    res
      .status(201)
      .json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= ITEM ROUTES (Protected) =================

// 🔹 Add Item
app.post("/api/items", authMiddleware, async (req, res) => {
  try {
    const item = await Item.create({ ...req.body, postedBy: req.user.id });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Get All Items
app.get("/api/items", authMiddleware, async (req, res) => {
  try {
    const items = await Item.find().populate("postedBy", "name email");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Search Items by name
app.get("/api/items/search", authMiddleware, async (req, res) => {
  try {
    const { name } = req.query;
    const items = await Item.find({
      itemName: { $regex: name, $options: "i" },
    }).populate("postedBy", "name email");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Get Item by ID
app.get("/api/items/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "postedBy",
      "name email"
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Update Item (only owner)
app.put("/api/items/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.postedBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Delete Item (only owner)
app.delete("/api/items/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.postedBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= PROTECTED DASHBOARD ROUTE =================
app.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Welcome to dashboard", user: req.user });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});

