import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorDashboard.css';
import BASE_URL from "./config";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [reportData, setReportData] = useState({ type: "", description: "" });

  const navigate = useNavigate();
  const doctorId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || !doctorId) {
      navigate("/login");
      return;
    }
    fetchDoctorProfile();
    fetchAppointments();
    fetchMedicalRecords();
  }, [doctorId, token]);

  const fetchDoctorProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/doctor/${doctorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProfileData(res.data);
    } catch (err) { console.error("Profile Fetch Error:", err); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/appointment/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(res.data);
    } catch (err) { console.error("Appointments Error:", err); }
    finally { setLoading(false); }
  };

  const fetchMedicalRecords = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/report/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicalRecords(res.data);
    } catch (err) { console.error("Records Fetch Error:", err); }
  };

  const handleUploadClick = (appt) => {
    setSelectedAppt(appt);
    setShowModal(true);
  };

  const submitReport = async (e) => {
  e.preventDefault();
  
  // ✅ FIX 1: Get the ID from the nested object
  const pId = selectedAppt.patient?.patientId; 
  console.log("Submitting report for Patient ID:", pId);

  if (!pId) {
    alert("Error: Patient data missing.");
    return;
  }

  try {
    const payload = {
      // ✅ FIX 2: Match the nested structure for your @ManyToOne fields
      patient: { patientId: pId }, 
      doctor: { doctorID: parseInt(doctorId) }, 
      reportType: reportData.type,
      description: reportData.description,
      date: new Date().toISOString().split('T')[0]
    };

    // Post to the endpoint
    await axios.post("${BASE_URL}/report/upload", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Update status
    await axios.put(`${BASE_URL}/appointment/update-status/${selectedAppt.id}`, 
      { status: "Completed" }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Consultation finalized!");
    setShowModal(false);
    setReportData({ type: "", description: "" });
    fetchAppointments();
    fetchMedicalRecords();
  } catch (err) {
    console.error("Submission error details:", err.response?.data);
    alert("Error completing consultation. Status: " + err.response?.status);
  }
};

  const renderContent = () => {
    if (loading && activeTab !== 'profile') return <div className="loader">Loading...</div>;

    switch (activeTab) {
      case 'profile':
        return (
          <div className="doc-header">
            <h1>My Professional Profile</h1>
            <div className="appointment-table-wrapper profile-container">
              <div className="profile-left">
                <div className="profile-img-placeholder">👨‍⚕️</div>
                <h3>{profileData?.fullName || "Doctor"}</h3>
                <p className="designation-text">{profileData?.designation}</p>
                <p className="profile-id-tag">ID: #{profileData?.doctorID}</p>
              </div>
              <div className="profile-right">
                <div className="fee-badge">CONSULTATION FEE: ₹500</div>
                <div className="info-row" style={{ marginTop: '40px' }}>
                  <div className="info-item"><strong>SPECIALTY</strong><span className="specialty-badge">{profileData?.specialty}</span></div>
                  <div className="info-item"><strong>EXPERIENCE</strong><p>{profileData?.experienceYears} Years +</p></div>
                </div>
                <div className="info-row">
                  <div className="info-item"><strong>CONTACT</strong><p>{profileData?.contactNumber}</p></div>
                  <div className="info-item"><strong>EMAIL</strong><p>{profileData?.email}</p></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appointments':
        // Filter out completed visits
        const activeAppts = appointments.filter(app => app.status !== 'Completed');
        return (
          <>
            <div className="doc-header">
              <h1>Active Appointments</h1>
              <p>You have {activeAppts.length} pending patients.</p>
            </div>
            <div className="appointment-table-wrapper">
              <table className="doc-table">
                <thead><tr><th>Patient ID</th><th>Date</th><th>Symptoms</th><th>Action</th></tr></thead>
                <tbody>
                  {activeAppts.length > 0 ? activeAppts.map((app) => (
                    <tr key={app.id}>
                      <td>#{app.patient ? app.patient.patientId : 'N/A'}</td>
                      <td>{new Date(app.appointmentDate).toLocaleString()}</td>
                      <td>{app.reason}</td>
                      <td><button className="report-action-btn" onClick={() => handleUploadClick(app)}>Upload Report</button></td>
                    </tr>
                  )) : <tr><td colSpan="4" style={{textAlign:'center', padding: '2rem'}}>No pending appointments.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'records':
        return (
          <div className="doc-header">
            <h1>Patient Medical Records</h1>
            <div className="appointment-table-wrapper">
              <table className="doc-table">
                <thead><tr><th>Patient Name</th><th>Report Type</th><th>Diagnosis</th><th>Date</th></tr></thead>
                <tbody>
                  {medicalRecords.length > 0 ? medicalRecords.map((report) => (
                    <tr key={report.id}>
                      <td>{report.patient?.fullName || `Patient #${report.patient?.id}`}</td>
                      <td><strong>{report.reportType}</strong></td>
                      <td><span className="diagnosis-pill">{report.description}</span></td>
                      <td>{new Date(report.date).toLocaleDateString()}</td>
                    </tr>
                  )) : <tr><td colSpan="4" style={{textAlign:'center', padding: '2rem'}}>No records found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="doc-dash-container">
      <aside className="doc-sidebar">
        <div className="doc-logo">AmazeCare <span>Doctor</span></div>
        <nav>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 My Profile</button>
          <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}>📅 My Appointments</button>
          <button className={activeTab === 'records' ? 'active' : ''} onClick={() => setActiveTab('records')}>📁 Patient Records</button>
          <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>🚪 Logout</button>
        </nav>
      </aside>
      <main className="doc-main">{renderContent()}</main>

      {showModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h2 style={{color: '#001f3f', marginBottom: '0.5rem'}}>Upload Report</h2>
      <p style={{color: '#64748b', marginBottom: '1.5rem'}}>Patient ID: #{selectedAppt?.patientId}</p>
      
      <form onSubmit={submitReport}>
        {/* Wrap each field in a group to ensure vertical stacking */}
        <div className="modal-input-group">
          <label className="label-style">REPORT TYPE</label>
          <input 
            type="text" 
            placeholder="e.g. Consultation, Blood Test" 
            required 
            className="modal-input" 
            onChange={(e) => setReportData({...reportData, type: e.target.value})} 
          />
        </div>

        <div className="modal-input-group">
          <label className="label-style">DIAGNOSIS DESCRIPTION</label>
          <textarea 
            placeholder="Enter diagnosis notes..." 
            required 
            onChange={(e) => setReportData({...reportData, description: e.target.value})} 
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
          <button type="submit" className="report-action-btn">Complete Visit</button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}
