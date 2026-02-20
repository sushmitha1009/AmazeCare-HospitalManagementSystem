import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PatientDashboard.css';

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [bookingData, setBookingData] = useState({ doctorId: "", reason: "", date: "" });

  const navigate = useNavigate();
  const patientId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token || !patientId) {
      navigate("/login");
      return;
    }
    fetchAllData();
  }, [patientId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, rRes, dRes] = await Promise.all([
        axios.get(`http://localhost:9091/patient/${patientId}`, config),
        axios.get(`http://localhost:9091/appointment/patient/${patientId}`, config),
        axios.get(`http://localhost:9091/report/get/patient/${patientId}`, config),
        axios.get(`http://localhost:9091/doctor/all`, config)
      ]);

      setProfile(pRes.data);
      setAppointments(aRes.data);
      setReports(rRes.data);
      setDoctors(dRes.data);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
  e.preventDefault();
  
  const payload = {
    // These keys (patientId, doctorID) must match your Java Entity variables EXACTLY
    patient: { 
        patientId: parseInt(patientId) 
    },
    doctor: { 
        doctorID: parseInt(bookingData.doctorId) 
    },
    appointmentDate: bookingData.date,
    reason: bookingData.reason,
    status: "Scheduled"
  };

  console.log("Final Payload being sent:", payload); // Check this in F12 Console!

  try {
    await axios.post("http://localhost:9091/appointment/book", payload, config);
    alert("Appointment Booked!");
    setBookingData({ doctorId: "", reason: "", date: "" });
    fetchAllData(); 
    setActiveTab('appointments');
  } catch (err) {
    console.error("Booking Error details:", err.response?.data);
    alert("Booking failed. Look at the console for the error message.");
  }
};

  const renderContent = () => {
    if (loading) return <div className="loader">Loading Dashboard...</div>;

    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-content profile-card">
            <div className="profile-header">
              <div className="avatar">👤</div>
              <h2>{profile?.fullName}</h2>
              <span className="id-badge">Patient ID: #{patientId}</span>
            </div>
            <div className="profile-grid">
              <div className="grid-item"><strong>Email:</strong> {profile?.email}</div>
              <div className="grid-item"><strong>Contact:</strong> {profile?.contactNumber}</div>
              <div className="grid-item"><strong>DOB:</strong> {profile?.dateOfBirth}</div>
              <div className="grid-item"><strong>Gender:</strong> {profile?.gender}</div>
              <div className="grid-item full">
                <strong>Medical History:</strong>
                <p className="history-text">{profile?.medicalHistory || "No records provided."}</p>
              </div>
            </div>
          </div>
        );

      case 'book':
        return (
          <div className="tab-content">
            <form className="booking-form" onSubmit={handleBooking}>
              <h3>Book a Consultation</h3>
              <select required value={bookingData.doctorId} onChange={e => setBookingData({...bookingData, doctorId: e.target.value})}>
                <option value="">Select a Doctor</option>
                {doctors.map(doc => (
                  <option key={doc.doctorID} value={doc.doctorID}>{doc.fullName} ({doc.specialty})</option>
                ))}
              </select>
              <textarea placeholder="Describe your symptoms..." required onChange={e => setBookingData({...bookingData, reason: e.target.value})} />
              <input type="datetime-local" required onChange={e => setBookingData({...bookingData, date: e.target.value})} />
              <button type="submit" className="btn-submit">Confirm Appointment</button>
            </form>
          </div>
        );

      case 'appointments':
        return (
          <div className="tab-content table-container">
            <h3>My Appointment History</h3>
            <table className="hms-table">
              <thead>
                <tr><th>Date</th><th>Doctor</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {appointments.map(app => (
                  <tr key={app.id}>
                    <td>{new Date(app.appointmentDate).toLocaleString()}</td>
                    <td>
                    {app.doctor && app.doctor.fullName ? `Dr. ${app.doctor.fullName}` : "Doctor Assigned"}
                    </td>
                    <td><span className={`status ${app.status?.toLowerCase()}`}>{app.status}</span></td>
                    <td>
                      {app.status === 'Completed' ? 
                        <button className="btn-small" onClick={() => setActiveTab('reports')}>View Report</button> 
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'reports':
        return (
          <div className="tab-content table-container">
            <h3>Medical Reports & Prescriptions</h3>
            <table className="hms-table">
              <thead>
                <tr><th>Date</th><th>Report Type</th><th>Doctor's Diagnosis</th></tr>
              </thead>
              <tbody>
                {reports.length > 0 ? reports.map(rep => (
                  <tr key={rep.id}>
                    <td>{rep.date}</td>
                    <td><span className="type-badge">{rep.reportType}</span></td>
                    <td className="diagnosis-cell">{rep.description}</td>
                  </tr>
                )) : <tr><td colSpan="3">No reports available yet.</td></tr>}
              </tbody>
            </table>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="patient-dash">
      <nav className="side-nav">
        <div className="logo">AmazeCare</div>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>My Profile</button>
        <button className={activeTab === 'book' ? 'active' : ''} onClick={() => setActiveTab('book')}>Book Appointment</button>
        <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}>My Appointments</button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>Reports</button>
        <button className="logout" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
      </nav>
      <main className="content-area">
        <header className="top-bar">Welcome, {profile?.fullName?.split(' ')[0]}</header>
        {renderContent()}
      </main>
    </div>
  );
}