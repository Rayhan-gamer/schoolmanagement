import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useState, useContext } from 'react';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import GuardianDashboard from './components/GuardianDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AuthContext } from './context/AuthContext';
import './App.css';

function Home() {
  return (
    <div className="page-container">
      <h2 className="text-2xl font-bold mb-4">Welcome to the School Management System</h2>
       <img
        src="/homebg.png"
        alt="Home Background"
        style={{
          maxWidth: '1000px',
          width: '100%',
          height: 'auto',
          borderRadius: '10px',
        }}
      />

      <p style={{ marginTop: '1rem' }}> <b>Please login to continue</b></p>
    </div>
  );
}

function Login() {
  const [user_id, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, password, role }),
      });

      const data = await res.json();

      if (data.success) {
        const normalizedRole = data.user.role.toLowerCase();
        setUser({ id: data.user.user_id, role: normalizedRole });
        navigate(`/${normalizedRole}`, { replace: true });
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login.');
    }
  };

  return (
    <div className="page-container">
      <h2 className="text-xl font-bold mb-4">Login</h2>
       <img
        src="/login.png"
        alt="Login Page"
        style={{
          maxWidth: '1000px',
          width: '100%',
          height: 'auto',
          borderRadius: '10px',
        }}
      />
      <input
        placeholder="User ID"
        value={user_id}
        onChange={(e) => setUserId(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="guardian">Guardian</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user } = useContext(AuthContext);
  if (!user || (role && user.role.toLowerCase() !== role.toLowerCase())) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const showLogin = location.pathname === '/';
  const showLogout = location.pathname !== '/' && location.pathname !== '/login';

  return (
    <div className="min-h-screen">
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">School Portal</h1>
        <div className="space-x-4">
          {showLogin && (
            <Link to="/login" className="bg-white text-blue-600 px-3 py-1 rounded font-bold hover:bg-gray-100">
              Login
            </Link>
          )}
          {showLogout && (
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}

function AppContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian"
          element={
            <ProtectedRoute role="guardian">
              <GuardianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

function App() {
  const [user, setUser] = useState(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <AppContent />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
