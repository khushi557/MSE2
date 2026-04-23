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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// ================= MODELS =================

// 🔹 User (Auth)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", userSchema);

// 🔹 Student
const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  rollNo: String,
  department: String,
  year: String,
  phone: String,
  gpa: Number
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);

// ================= AUTH MIDDLEWARE =================
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================= AUTH ROUTES =================

// 🔹 Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "User exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hash });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= STUDENT CRUD =================

// 🔹 CREATE
app.post("/api/students", authMiddleware, async (req, res) => {
  const student = await Student.create(req.body);
  res.json(student);
});

// 🔹 READ ALL
app.get("/api/students", authMiddleware, async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

// 🔹 UPDATE
app.put("/api/students/:id", authMiddleware, async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(student);
});

// 🔹 DELETE
app.delete("/api/students/:id", authMiddleware, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});