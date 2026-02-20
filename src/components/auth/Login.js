import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import BASE_URL from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const navigate = useNavigate();

  const handleLogin = () => {
    axios
      .post(`${BASE_URL}/auth/login/${role}`, { email, password })
      .then((res) => {
        const data = res.data;
        
        // 1. Save Token
        localStorage.setItem('token', data.token);
        
        // 2. Normalize Role (Handling "ROLE_DOCTOR", "doctor", or "DOCTOR")
        // We strip "ROLE_" if it exists and convert to lowercase
        const rawRole = data.role || "";
        const userRole = rawRole.replace("ROLE_", "").toLowerCase(); 
        localStorage.setItem('role', userRole);

        // 3. Save ID (Handling different backend keys: doctorID vs patientId)
        const userId = data.doctorID || data.patientId || data.id; 
        localStorage.setItem('userId', userId);

        alert("Login successful!");

        // 4. NAVIGATE TO SPECIFIC ROUTES
        // These MUST match the 'path' props in your App.js Routes
        if (userRole === "admin") {
          navigate("/admin-dashboard");
        } else if (userRole === "doctor") {
          navigate("/doctor-dashboard");
        } else if (userRole === "patient") {
          navigate("/patient-dashboard");
        } else {
          // Fallback if role is unexpected
          navigate("/login");
        }
      })
      .catch((err) => {
        console.error("Login failed:", err);
        alert("Invalid credentials or server error");
      });
  };

  const goToSignup = () => {
    navigate("/signup", { state: { selectedRole: role } });
  };

  return (
    <div className="hms-container">
      <div className="hms-card">
        
        {/* LEFT SIDE */}
        <div className="hms-left">
          <div className="illustration-area">
             <img 
              src="https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg" 
              alt="Hospital Staff" 
            />
          </div>
          <div className="hms-bottom-nav">
            <button className="nav-link-btn" onClick={() => navigate("/")}>
              🏢 Visit Home
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="hms-right">
          <div className="login-box">
            <h2>Hospital System Login</h2>
            
            <div className="role-dropdown">
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="admin">Admin Login</option>
                    <option value="doctor">Doctor Login</option>
                    <option value="patient">Patient Login</option>
                </select>
            </div>

            <div className="input-fields">
              {/* Email Pill */}
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="email"
                  placeholder="Username/Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password Pill */}
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button className="btn-primary" onClick={handleLogin}>
              Login
            </button>

            <div className="signup-footer">
              <p>New user? <span className="link-text" onClick={goToSignup}>Sign up here</span></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
