import axios from "axios";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Login.css";
import BASE_URL from "../config";

export default function Signup() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(location.state?.selectedRole || "admin");

  // --- REGEX CONSTANTS ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&]).{8,}$/;

  const [formData, setFormData] = useState({
    name: "", // For Admin
    fullName: "",
    dateOfBirth: "", // Missing field
    gender: "Male",
    contactNumber: "",
    email: "",
    password: "", // For Admin
    passwordHash: "", // For Patient/Doctor
    medicalHistory: "", // Missing field
    registrationDate: new Date().toISOString().split("T")[0], // Missing field
    // Doctor specific
    specialty: "GeneralMedicine",
    designation: "",
    qualification: "",
    experienceYears: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (name, value) => {
    let error = "";
    if (name === "email") {
      if (!emailRegex.test(value)) error = "Invalid email format";
    }
    if (name === "password" || name === "passwordHash") {
      if (!passwordRegex.test(value)) error = "Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate on change
    const error = validate(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const isFormValid = emailRegex.test(formData.email) && 
                    (passwordRegex.test(formData.password) || passwordRegex.test(formData.passwordHash));

  const handleSignup = () => {
    if(!isFormValid) {
        alert("Please fix validation errors before submitting.");
        return;
    }

    let url = `${BASE_URL}/${role}/add`;
    let payload = {};

    if (role === "admin") {
      payload = { name: formData.name, email: formData.email, password: formData.password };
    } 
    else if (role === "doctor") {
      payload = { 
        fullName: formData.fullName,
        email: formData.email,
        passwordHash: formData.passwordHash,
        specialty: formData.specialty,
        designation: formData.designation,
        qualification: formData.qualification,
        experienceYears: parseInt(formData.experienceYears) || 0,
        contactNumber: formData.contactNumber
      };
    } 
    else if (role === "patient") {
      // ORDER MATCHES PATIENT MODEL: fullName -> dateOfBirth -> gender -> contactNumber -> email -> passwordHash -> medicalHistory -> registrationDate
      payload = { 
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        email: formData.email,
        passwordHash: formData.passwordHash,
        medicalHistory: formData.medicalHistory,
        registrationDate: formData.registrationDate
      };
    }

    axios.post(url, payload)
      .then((res) => {
        alert("Registration Successful!");
        navigate("/login");
      })
      .catch((err) => {
        alert("Registration failed: " + (err.response?.data?.message || "Check console"));
      });
  };

  return (
    <div className="hms-container">
      <div className="hms-card">
        <div className="hms-left">
          <div className="illustration-area">
            <img src="https://img.freepik.com/free-vector/filling-registration-form-concept-illustration_114360-5541.jpg" alt="Register" />
          </div>
          <button className="nav-link-btn" onClick={() => navigate("/login")}>← Back to Login</button>
        </div>

        <div className="hms-right">
          <div className="login-box">
            <h2>Create {role} Account</h2>
            
            <select value={role} onChange={(e) => setRole(e.target.value)} className="hms-input">
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>

            <div className="input-fields">
              {/* ADMIN NAME */}
              {role === 'admin' && <input name="name" placeholder="Admin Name" onChange={handleChange} className="hms-input" />}

              {/* PATIENT & DOCTOR SHARED: Full Name */}
              {role !== 'admin' && <input name="fullName" placeholder="Full Name" onChange={handleChange} className="hms-input" />}

              {/* PATIENT ORDERED FIELDS */}
              {role === 'patient' && (
                <>
                  <label className="label-style"></label>
                  <input type="date" name="dateOfBirth" onChange={handleChange} className="hms-input" />
                  
                  <select name="gender" onChange={handleChange} className="hms-input">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </>
              )}

              {/* SHARED: Contact Number */}
              {role !== 'admin' && <input name="contactNumber" placeholder="Contact Number" onChange={handleChange} className="hms-input" />}

              {/* EMAIL WITH REGEX VALIDATION */}
              <input 
                name="email" 
                placeholder="Email Address" 
                onChange={handleChange} 
                onBlur={handleBlur}
                className={`hms-input ${touched.email && errors.email ? 'input-error' : ''}`} 
              />
              {touched.email && errors.email && <p className="error-text">{errors.email}</p>}

              {/* PASSWORD WITH REGEX VALIDATION */}
              <input 
                type="password" 
                name={role === 'admin' ? "password" : "passwordHash"} 
                placeholder="Password" 
                onChange={handleChange} 
                onBlur={handleBlur}
                className="hms-input" 
              />
              {(touched.password || touched.passwordHash) && (errors.password || errors.passwordHash) && 
                <p className="error-text">{errors.password || errors.passwordHash}</p>
              }

              {/* PATIENT: Medical History */}
              {role === 'patient' && (
                <textarea name="medicalHistory" placeholder="Medical History (Previous illness, allergies...)" onChange={handleChange} className="hms-input" />
              )}

              {/* DOCTOR SPECIFIC */}
              {role === 'doctor' && (
                <>
                  <select name="specialty" onChange={handleChange} className="hms-input">
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="GeneralMedicine">General Medicine</option>
                    <option value="Anesthesia">Anesthesia</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="ENT">ENT</option>
                    {/* Add others as needed */}
                  </select>
                  <input name="designation" placeholder="Designation" onChange={handleChange} className="hms-input" />
                  <input name="qualification" placeholder="Qualification" onChange={handleChange} className="hms-input" />
                  <input name="experienceYears" type="number" placeholder="Experience (Years)" onChange={handleChange} className="hms-input" />
                </>
              )}
            </div>

            <button className="btn-primary" onClick={handleSignup} disabled={!isFormValid}>Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}
