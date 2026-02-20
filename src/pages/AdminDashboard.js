import axios from "axios";
import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import BASE_URL from "../config";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("doctors");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    fullName: "", specialty: "GeneralMedicine", experienceYears: "", 
    qualification: "", designation: "", contactNumber: "", email: "", passwordHash: ""
  });

  const [showPatientModal, setShowPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "MALE",
    contactNumber: "",
    email: "",
    passwordHash: "",
    medicalHistory: "",
    registrationDate: new Date().toISOString().split('T')[0] 
  });

  const fetchData = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    let url = "";
    if (activeTab === "doctors") url = "${BASE_URL}/doctor/all";
    if (activeTab === "patients") url = "${BASE_URL}/patient/all";
    if (activeTab === "admins") url = "${BASE_URL}/admin/all";

    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setDataList(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.error("Fetch failed", err);
      });
  };

  useEffect(() => { 
    fetchData(); 
    setSearchTerm(""); 
  }, [activeTab]);

  const filteredData = dataList.filter((item) => {
    const name = (item.fullName || item.name || "").toLowerCase();
    const email = (item.email || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  const handleEditClick = (item) => {
    setIsEditMode(true);
    if (activeTab === "doctors") {
      setEditId(item.doctorID);
      setNewDoctor({ ...item });
      setShowModal(true);
    } else {
      setEditId(item.patientId);
      setNewPatient({ ...item });
      setShowPatientModal(true);
    }
  };

  const closeModals = () => {
    setShowModal(false);
    setShowPatientModal(false);
    setIsEditMode(false);
    setEditId(null);
    setNewDoctor({ fullName: "", specialty: "GeneralMedicine", experienceYears: "", qualification: "", designation: "", contactNumber: "", email: "", passwordHash: "" });
    setNewPatient({ fullName: "", dateOfBirth: "", gender: "MALE", contactNumber: "", email: "", passwordHash: "", medicalHistory: "", registrationDate: new Date().toISOString().split('T')[0] });
  };

  const handleSaveDoctor = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const payload = { ...newDoctor, experienceYears: parseInt(newDoctor.experienceYears) || 0 };
    const url = isEditMode ? `${BASE_URL}/doctor/update/${editId}` : "${BASE_URL}/admin/add-doctor";
    const request = isEditMode ? axios.put(url, payload, { headers: { Authorization: `Bearer ${token}` } }) : axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });

    request.then(() => {
      alert(isEditMode ? "Doctor Updated!" : "Doctor Registered!");
      closeModals();
      fetchData();
    }).catch(() => alert("Error saving doctor"));
  };

  const handleSavePatient = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const url = isEditMode ? `${BASE_URL}/patient/update/${editId}` : "${BASE_URL}/admin/add-patient";
    const request = isEditMode ? axios.put(url, newPatient, { headers: { Authorization: `Bearer ${token}` } }) : axios.post(url, newPatient, { headers: { Authorization: `Bearer ${token}` } });

    request.then(() => {
      alert(isEditMode ? "Patient Updated!" : "Patient Added!");
      closeModals();
      fetchData();
    }).catch(() => alert("Error saving patient"));
  };

  const handleDelete = (id) => {
    if (window.confirm("Confirm delete?")) {
      const token = localStorage.getItem("token");
      let deleteUrl = `${BASE_URL}/${activeTab.slice(0, -1)}/delete/${id}`;
      axios.delete(deleteUrl, { headers: { Authorization: `Bearer ${token}` } }).then(() => fetchData());
    }
  };

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <h2>AmazeCare</h2>
        <nav>
          <button onClick={() => setActiveTab("doctors")} className={activeTab === "doctors" ? "active" : ""}>Manage Doctors</button>
          <button onClick={() => setActiveTab("patients")} className={activeTab === "patients" ? "active" : ""}>Manage Patients</button>
          <button onClick={() => setActiveTab("admins")} className={activeTab === "admins" ? "active" : ""}>Admin Staff</button>
          <button onClick={() => { localStorage.clear(); window.location.href="/login"; }} className="logout-btn">Logout</button>
        </nav>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1>{activeTab.toUpperCase()} List</h1>
          {activeTab !== "admins" && (
            <button className="add-btn" onClick={() => { setIsEditMode(false); activeTab === "doctors" ? setShowModal(true) : setShowPatientModal(true); }}>
              + Add {activeTab === "doctors" ? "Doctor" : "Patient"}
            </button>
          )}
        </header>

        <input type="text" className="search-input" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

        {loading ? <div className="loading-state">Fetching data...</div> : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name / Email</th>
                  <th>{activeTab === "patients" ? "Gender" : "Info"}</th>
                  {activeTab === "patients" && <th>Registered On</th>}
                  <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.doctorID || item.patientId || item.id}>
                    <td>{item.doctorID || item.patientId || item.id}</td>
                    <td><strong>{item.fullName || item.name}</strong><br/><small>{item.email}</small></td>
                    <td>{item.specialty || item.gender || "Admin"}</td>
                    {activeTab === "patients" && <td>{item.registrationDate || "N/A"}</td>}
                    <td style={{textAlign: 'right'}}>
                      <button className="edit-btn" onClick={() => handleEditClick(item)}>Edit</button>
                      <button className="del-btn" onClick={() => handleDelete(item.doctorID || item.patientId || item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOCTOR MODAL (Matches Doctor.java) */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{isEditMode ? "Edit Doctor Details" : "Register New Doctor"}</h3>
              <form onSubmit={handleSaveDoctor} className="hms-form-layout">
                <div className="modal-scroll-area">
                  <input type="text" className="hms-pill-input" placeholder="Full Name" value={newDoctor.fullName} required onChange={(e) => setNewDoctor({...newDoctor, fullName: e.target.value})} />
                  <select className="hms-pill-input" value={newDoctor.specialty} onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})}>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="GeneralMedicine">General Medicine</option>
                    <option value="Anesthesia">Anesthesia</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="ENT">ENT</option>
                  </select>
                  <input type="number" className="hms-pill-input" placeholder="Experience (Years)" value={newDoctor.experienceYears} required onChange={(e) => setNewDoctor({...newDoctor, experienceYears: e.target.value})} />
                  <input type="text" className="hms-pill-input" placeholder="Qualification" value={newDoctor.qualification} required onChange={(e) => setNewDoctor({...newDoctor, qualification: e.target.value})} />
                  <input type="text" className="hms-pill-input" placeholder="Designation" value={newDoctor.designation} required onChange={(e) => setNewDoctor({...newDoctor, designation: e.target.value})} />
                  <input type="text" className="hms-pill-input" placeholder="Contact Number" value={newDoctor.contactNumber} required onChange={(e) => setNewDoctor({...newDoctor, contactNumber: e.target.value})} />
                  <input type="email" className="hms-pill-input" placeholder="Email Address" value={newDoctor.email} required onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})} />
                  {!isEditMode && <input type="password" title="Password" className="hms-pill-input" placeholder="Password" required onChange={(e) => setNewDoctor({...newDoctor, passwordHash: e.target.value})} />}
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-btn">Save Doctor</button>
                  <button type="button" className="cancel-btn" onClick={closeModals}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PATIENT MODAL (Matches Patient.java) */}
        {showPatientModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{isEditMode ? "Edit Patient Details" : "Add New Patient"}</h3>
              <form onSubmit={handleSavePatient} className="hms-form-layout">
                <div className="modal-scroll-area">
                  <input className="hms-pill-input" placeholder="Full Name" value={newPatient.fullName} required onChange={(e) => setNewPatient({...newPatient, fullName: e.target.value})} />
                  <div style={{fontSize: '12px', color: '#64748b', marginLeft: '15px', marginBottom: '-8px'}}>Date of Birth</div>
                  <input className="hms-pill-input" type="date" value={newPatient.dateOfBirth} required onChange={(e) => setNewPatient({...newPatient, dateOfBirth: e.target.value})} />
                  <select className="hms-pill-input" value={newPatient.gender} onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input className="hms-pill-input" placeholder="Contact Number" value={newPatient.contactNumber} required onChange={(e) => setNewPatient({...newPatient, contactNumber: e.target.value})} />
                  <input className="hms-pill-input" placeholder="Email Address" type="email" value={newPatient.email} required onChange={(e) => setNewPatient({...newPatient, email: e.target.value})} />
                  {!isEditMode && <input className="hms-pill-input" type="password" placeholder="Password" required onChange={(e) => setNewPatient({...newPatient, passwordHash: e.target.value})} />}
                  <textarea 
                    className="hms-pill-input" 
                    style={{height: '100px', paddingTop: '12px', borderRadius: '15px', resize: 'none'}} 
                    placeholder="Medical History" 
                    value={newPatient.medicalHistory} 
                    onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})} 
                  />
                  {/* Added Registration Date visibility in modal */}
                  <div style={{fontSize: '12px', color: '#64748b', marginLeft: '15px', marginBottom: '-8px'}}>Registration Date</div>
                  <input className="hms-pill-input" type="date" value={newPatient.registrationDate} onChange={(e) => setNewPatient({...newPatient, registrationDate: e.target.value})} />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-btn">Save Patient</button>
                  <button type="button" className="cancel-btn" onClick={closeModals}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
