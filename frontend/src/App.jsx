import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api";

// ─── Axios helper with token ───────────────────────────────────────────────
const authAxios = () =>
  axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH PAGES
// ══════════════════════════════════════════════════════════════════════════════

function Register({ switchToLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/register`, form);
      setMsg("✅ Registered! Please login.");
    } catch (err) {
      setMsg("❌ " + err.response?.data?.message);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-badge lost">L&F</div>
      <h2>Create Account</h2>
      <p className="auth-sub">Join the campus Lost & Found network</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Full Name</label>
          <input
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="college@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        {msg && <p className="msg">{msg}</p>}
        <button type="submit" className="btn-primary">Register</button>
      </form>
      <p className="switch">
        Already have an account?{" "}
        <span onClick={switchToLogin}>Login here</span>
      </p>
    </div>
  );
}

function Login({ onLogin, switchToRegister }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/login`, form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setMsg("❌ " + err.response?.data?.message);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-badge found">L&F</div>
      <h2>Welcome Back</h2>
      <p className="auth-sub">Lost something? Found something? Log in.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="college@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        {msg && <p className="msg">{msg}</p>}
        <button type="submit" className="btn-primary">Login</button>
      </form>
      <p className="switch">
        New here? <span onClick={switchToRegister}>Create account</span>
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

const EMPTY_FORM = {
  itemName: "",
  description: "",
  type: "Lost",
  location: "",
  date: "",
  contactInfo: "",
};

function Dashboard({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState("all"); // all | add
  const [msg, setMsg] = useState("");

  const ax = authAxios();

  const fetchItems = async () => {
    const res = await ax.get("/items");
    setItems(res.data);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSearch = async () => {
    if (!search.trim()) return fetchItems();
    const res = await ax.get(`/items/search?name=${search}`);
    setItems(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await ax.put(`/items/${editId}`, form);
        setMsg("✅ Item updated!");
        setEditId(null);
      } else {
        await ax.post("/items", form);
        setMsg("✅ Item reported!");
      }
      setForm(EMPTY_FORM);
      setTab("all");
      fetchItems();
    } catch (err) {
      setMsg("❌ " + err.response?.data?.message);
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await ax.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  const handleEdit = (item) => {
    setForm({
      itemName: item.itemName,
      description: item.description,
      type: item.type,
      location: item.location,
      date: item.date?.slice(0, 10),
      contactInfo: item.contactInfo,
    });
    setEditId(item._id);
    setTab("add");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
  };

  const filtered = tab === "all" ? items : items;

  return (
    <div className="dashboard">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-icon">🔍</span>
          <span>Lost <span className="accent">&</span> Found</span>
        </div>
        <div className="nav-right">
          <span className="nav-user">👤 {user.name}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* ── Tab Bar ── */}
      <div className="tab-bar">
        <button
          className={`tab ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          📋 All Items
        </button>
        <button
          className={`tab ${tab === "add" ? "active" : ""}`}
          onClick={() => { setTab("add"); setEditId(null); setForm(EMPTY_FORM); }}
        >
          ➕ Report Item
        </button>
      </div>

      <div className="dash-body">
        {msg && <div className="toast">{msg}</div>}

        {/* ══ ADD / EDIT FORM ══ */}
        {tab === "add" && (
          <div className="card form-card">
            <h3>{editId ? "✏️ Update Item" : "📝 Report a Lost / Found Item"}</h3>
            <form onSubmit={handleSubmit} className="item-form">
              <div className="form-row">
                <div className="field">
                  <label>Item Name</label>
                  <input
                    placeholder="e.g. Blue Backpack"
                    value={form.itemName}
                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option>Lost</option>
                    <option>Found</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea
                  placeholder="Describe the item..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Location</label>
                  <input
                    placeholder="e.g. Library, Block A"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>Contact Info</label>
                <input
                  placeholder="Phone or email"
                  value={form.contactInfo}
                  onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editId ? "Update Item" : "Report Item"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setEditId(null); setForm(EMPTY_FORM); setTab("all"); }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ══ ALL ITEMS ══ */}
        {tab === "all" && (
          <>
            {/* Search Bar */}
            <div className="search-bar">
              <input
                placeholder="🔍 Search by item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="btn-primary" onClick={handleSearch}>Search</button>
              <button className="btn-secondary" onClick={() => { setSearch(""); fetchItems(); }}>
                Clear
              </button>
            </div>

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-chip lost-chip">
                🔴 Lost: {items.filter((i) => i.type === "Lost").length}
              </div>
              <div className="stat-chip found-chip">
                🟢 Found: {items.filter((i) => i.type === "Found").length}
              </div>
              <div className="stat-chip total-chip">
                📦 Total: {items.length}
              </div>
            </div>

            {/* Items Grid */}
            {items.length === 0 ? (
              <div className="empty">No items reported yet. Be the first!</div>
            ) : (
              <div className="items-grid">
                {items.map((item) => (
                  <div key={item._id} className={`item-card ${item.type.toLowerCase()}`}>
                    <div className="item-header">
                      <span className={`badge ${item.type.toLowerCase()}`}>
                        {item.type === "Lost" ? "🔴 LOST" : "🟢 FOUND"}
                      </span>
                      <span className="item-date">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="item-name">{item.itemName}</h4>
                    {item.description && (
                      <p className="item-desc">{item.description}</p>
                    )}
                    <div className="item-meta">
                      <span>📍 {item.location}</span>
                      <span>📞 {item.contactInfo}</span>
                      {item.postedBy && (
                        <span>👤 {item.postedBy.name}</span>
                      )}
                    </div>
                    {item.postedBy?._id === user.id && (
                      <div className="item-actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(item)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-del"
                          onClick={() => handleDelete(item._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  APP ROOT
// ══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [page, setPage] = useState("login"); // login | register | dashboard
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  useEffect(() => {
    if (user && localStorage.getItem("token")) setPage("dashboard");
  }, []);

  if (page === "dashboard" && user)
    return <Dashboard user={user} onLogout={() => { setUser(null); setPage("login"); }} />;

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="blob blob1" />
        <div className="blob blob2" />
      </div>
      <div className="auth-container">
        {page === "login" ? (
          <Login
            onLogin={(u) => { setUser(u); setPage("dashboard"); }}
            switchToRegister={() => setPage("register")}
          />
        ) : (
          <Register switchToLogin={() => setPage("login")} />
        )}
      </div>
    </div>
  );
}