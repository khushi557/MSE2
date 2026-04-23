import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const BASE = "https://mse2-2.onrender.com";

// ─── helpers ────────────────────────────────────────────────────────────────
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ─── tiny icon components ────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const UserIcon    = () => <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />;
const LockIcon    = () => <Icon d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4" />;
const MailIcon    = () => <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />;
const EditIcon    = () => <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />;
const TrashIcon   = () => <Icon d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />;
const PlusIcon    = () => <Icon d="M12 5v14M5 12h14" />;
const GradIcon    = () => <Icon d="M22 10v6M2 10l10-5 10 5-10 5-10-5zM6 12v5c3 3 9 3 12 0v-5" />;
const PhoneIcon   = () => <Icon d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.42z" />;
const SearchIcon  = () => <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const LogoutIcon  = () => <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />;

// ─── Auth Pages ──────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await axios.post(`${BASE}/auth/register`, form);
        setMode("login");
        setForm({ name: "", email: "", password: "" });
      } else {
        const res = await axios.post(`${BASE}/auth/login`, {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userName", res.data.user?.name || "Admin");
        onLogin(res.data.token, res.data.user?.name || "Admin");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon"><GradIcon /></span>
          <h1>EduTrack</h1>
          <p>Student Record Management</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="field">
              <span className="field-icon"><UserIcon /></span>
              <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required autoComplete="off" />
            </div>
          )}
          <div className="field">
            <span className="field-icon"><MailIcon /></span>
            <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <span className="field-icon"><LockIcon /></span>
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : (mode === "login" ? "Sign In" : "Create Account")}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account? " : "Already registered? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Register here" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Student Form Modal ───────────────────────────────────────────────────────
function StudentModal({ student, onClose, onSave, token }) {
  const blank = { name: "", email: "", rollNo: "", department: "", year: "", phone: "", gpa: "" };
  const [form, setForm]   = useState(student || blank);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (student?._id) {
        await axios.put(`${BASE}/students/${student._id}`, form, { headers: authHeader(token) });
      } else {
        await axios.post(`${BASE}/students`, form, { headers: authHeader(token) });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{student?._id ? "Edit Student" : "Add New Student"}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-grid">
            <div className="field">
              <label>Full Name</label>
              <div className="field-wrap">
                <span className="field-icon"><UserIcon /></span>
                <input name="name" placeholder="Student name" value={form.name} onChange={handleChange} required />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <div className="field-wrap">
                <span className="field-icon"><MailIcon /></span>
                <input name="email" type="email" placeholder="student@edu.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="field">
              <label>Roll Number</label>
              <div className="field-wrap">
                <span className="field-icon"><GradIcon /></span>
                <input name="rollNo" placeholder="e.g. CS2024001" value={form.rollNo} onChange={handleChange} required />
              </div>
            </div>
            <div className="field">
              <label>Department</label>
              <div className="field-wrap">
                <span className="field-icon"><GradIcon /></span>
                <select name="department" value={form.department} onChange={handleChange} required>
                  <option value="">Select Department</option>
                  {["Computer Science","Electronics","Mechanical","Civil","Information Technology","Electrical","Mathematics","Physics"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Year</label>
              <div className="field-wrap">
                <span className="field-icon"><GradIcon /></span>
                <select name="year" value={form.year} onChange={handleChange} required>
                  <option value="">Select Year</option>
                  {["1st Year","2nd Year","3rd Year","4th Year"].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Phone</label>
              <div className="field-wrap">
                <span className="field-icon"><PhoneIcon /></span>
                <input name="phone" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="field full">
              <label>GPA / CGPA</label>
              <div className="field-wrap">
                <span className="field-icon"><GradIcon /></span>
                <input name="gpa" type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.75" value={form.gpa} onChange={handleChange} />
              </div>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (student?._id ? "Update Student" : "Add Student")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ token, userName, onLogout }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch]     = useState("");
  const [dept, setDept]         = useState("All");
  const [modal, setModal]       = useState(null); // null | "add" | student obj
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/students`, { headers: authHeader(token) });
      setStudents(res.data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE}/students/${id}`, { headers: authHeader(token) });
      fetchStudents();
    } catch { /* handle */ }
    setDeleteId(null);
  };

  const departments = ["All", ...new Set(students.map(s => s.department).filter(Boolean))];

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.rollNo?.toLowerCase().includes(q);
    const matchDept = dept === "All" || s.department === dept;
    return matchSearch && matchDept;
  });

  const stats = [
    { label: "Total Students", value: students.length, color: "stat-blue" },
    { label: "Departments",    value: departments.length - 1, color: "stat-teal" },
    { label: "Avg GPA",        value: students.length
        ? (students.reduce((a, s) => a + (parseFloat(s.gpa) || 0), 0) / students.length).toFixed(2)
        : "—", color: "stat-amber" },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon sm"><GradIcon /></span>
          <span>EduTrack</span>
        </div>
        <nav className="sidebar-nav">
          <a className="nav-item active"><GradIcon /><span>Students</span></a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{userName?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="user-name">{userName}</p>
              <p className="user-role">Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}><LogoutIcon /></button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="topbar">
          <div>
            <h2>Student Records</h2>
            <p>Manage and track all enrolled students</p>
          </div>
          <button className="btn-primary" onClick={() => setModal("add")}>
            <PlusIcon /> Add Student
          </button>
        </header>

        {/* Stats */}
        <div className="stats-row">
          {stats.map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-wrap">
            <SearchIcon />
            <input
              placeholder="Search by name, email or roll no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="dept-filters">
            {departments.map(d => (
              <button key={d} className={dept === d ? "chip active" : "chip"} onClick={() => setDept(d)}>{d}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><span className="big-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <GradIcon />
              <p>No students found</p>
              <span>{search ? "Try a different search term" : "Add your first student to get started"}</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Phone</th>
                  <th>GPA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar sm">{s.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="student-name">{s.name}</p>
                          <p className="student-email">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge">{s.rollNo || "—"}</span></td>
                    <td>{s.department || "—"}</td>
                    <td>{s.year || "—"}</td>
                    <td>{s.phone || "—"}</td>
                    <td>
                      {s.gpa
                        ? <span className={`gpa ${parseFloat(s.gpa) >= 8 ? "gpa-high" : parseFloat(s.gpa) >= 6 ? "gpa-mid" : "gpa-low"}`}>{s.gpa}</span>
                        : "—"}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn edit" onClick={() => setModal(s)} title="Edit"><EditIcon /></button>
                        <button className="icon-btn del" onClick={() => setDeleteId(s._id)} title="Delete"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="record-count">{filtered.length} of {students.length} records</p>
      </main>

      {/* Student Modal */}
      {modal && (
        <StudentModal
          student={modal === "add" ? null : modal}
          token={token}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchStudents(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon"><TrashIcon /></div>
            <h3>Delete Student?</h3>
            <p>This action cannot be undone. The student record will be permanently removed.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]     = useState(localStorage.getItem("token") || "");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");

  const handleLogin = (tok, name) => {
    setToken(tok);
    setUserName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setToken("");
    setUserName("");
  };

  if (!token) return <AuthPage onLogin={handleLogin} />;
  return <Dashboard token={token} userName={userName} onLogout={handleLogout} />;
}