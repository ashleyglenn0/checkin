import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboardstyles.css";

const Dashboard = () => {
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const navigate = useNavigate();

  return (
    <div className={`dashboard-container ${isAtlTechWeek ? 'atl-theme' : 'render-theme'}`}>
      {/* 🔝 Header Section with Centered Title & Buttons */}
      <div className="dashboard-header">
        <h1 className="event-title">
          {isAtlTechWeek ? "ATL Tech Week Dashboard" : "Render Dashboard"}
        </h1>

        <div className="dashboard-nav-buttons">
          <button onClick={() => navigate("/admin/checkin")}>⬅️ Back to Check-In</button>
          <button onClick={() => navigate("/admin/schedule")}>📅 View Schedule</button>
          <button onClick={() => navigate("/admin/reports")}>📊 View Reports</button>
          <button
            className="theme-toggle-button"
            onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}
          >
            Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
          </button>
        </div>
      </div>

      {/* 📦 Main Content */}
      <div className="dashboard-cards">
        {/* 🔔 Alerts */}
        <div className="dashboard-card">
          <h2>🔔 Important Alerts</h2>
          <div className="alert-item alert-urgent">🚨 High Priority: Venue changes for morning shifts!</div>
          <div className="alert-item alert-info">ℹ️ Reminder: Volunteer meeting at 5 PM.</div>
          <div className="alert-item alert-success">✅ Good news: All shifts are currently covered.</div>
        </div>

        {/* 🕒 Shift Coverage */}
        <div className="dashboard-card">
          <h2>📅 Shift Coverage vs Need</h2>
          <p>AM Shift: <strong>12/15 volunteers</strong></p>
          <p>PM Shift: <strong>14/15 volunteers</strong></p>
        </div>

        {/* 📊 Stats */}
        <div className="dashboard-card">
          <h2>📊 Stats</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <h3>✅ Check-Ins</h3>
              <p>34</p>
            </div>
            <div className="stat-item">
              <h3>📤 Check-Outs</h3>
              <p>30</p>
            </div>
            <div className="stat-item">
              <h3>❌ No-Shows</h3>
              <p>4</p>
            </div>
            <div className="stat-item">
              <h3>📝 Tasks Completed</h3>
              <p>85%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
