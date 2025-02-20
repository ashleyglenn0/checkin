import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/reportstyles.css";

const RENDER_SHEET_ID = import.meta.env.REACT_APP_RENDER_SHEET_ID; // Render Spreadsheet ID
const ATL_SHEET_ID = import.meta.env.REACT_APP_ATL_SHEET_ID;// ATL Tech Week Spreadsheet ID

const Reports = () => {
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );

  useEffect(() => {
    localStorage.setItem("isAtlTechWeek", JSON.stringify(isAtlTechWeek));
  }, [isAtlTechWeek]);

  const handleExport = async (reportType) => {
    let data, sheetName;
  
    // Use correct data & sheet names
    if (reportType === "check-ins") {
      data = checkIns;
      sheetName = isAtlTechWeek ? "ATL Check-Ins" : "Check-Ins";
    } else if (reportType === "check-outs") {
      data = checkOuts;
      sheetName = isAtlTechWeek ? "ATL Check-Outs" : "Check-Outs";
    } else if (reportType === "no-shows") {
      data = noShows;
      sheetName = isAtlTechWeek ? "ATL No-Shows" : "No-Shows";
    }
  
    // Pick the correct Google Sheet ID based on event type
    const SHEET_ID = isAtlTechWeek ? ATL_SHEET_ID : RENDER_SHEET_ID;
  
    console.log("📤 Sending Export Request:", {
      data,
      sheetId: SHEET_ID,
      sheetName,
    });
  
    // 🛠 Make the API request to the backend
    try {
      const response = await fetch("http://localhost:5001/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data, sheetId: SHEET_ID, sheetName }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Export failed.");
      }
  
      console.log("✅ Export successful:", result.sheetUrl);
      alert(`✅ ${reportType} exported! View it here: ${result.sheetUrl}`);
      window.open(result.sheetUrl, "_blank");
    } catch (error) {
      console.error("❌ Export failed:", error);
      alert(`❌ Export failed. ${error.message}`);
    }
  };

  // Dummy Data for Render
  const renderCheckIns = [
    {
      first_name: "Ashley",
      last_name: "Glenn",
      timestamp: "2025-02-12T09:30:00Z",
    },
    {
      first_name: "Mikal",
      last_name: "Johnson",
      timestamp: "2025-02-12T10:15:00Z",
    },
  ];

  const renderCheckOuts = [
    {
      first_name: "Ashley",
      last_name: "Glenn",
      timestamp: "2025-02-12T17:00:00Z",
    },
  ];

  const renderNoShows = [{ first_name: "Reba", last_name: "Smith" }];

  const renderVolunteers = [
    { first_name: "Ashley", last_name: "Glenn", role: "Team Lead" },
    { first_name: "Mikal", last_name: "Johnson", role: "Check-In Lead" },
    { first_name: "Reba", last_name: "Smith", role: "Volunteer" },
  ];

  // Dummy Data for ATL Tech Week
  const atlCheckIns = [
    {
      first_name: "Jordan",
      last_name: "Smith",
      timestamp: "2025-02-12T10:00:00Z",
    },
    {
      first_name: "Taylor",
      last_name: "Johnson",
      timestamp: "2025-02-12T11:30:00Z",
    },
  ];

  const atlCheckOuts = [
    {
      first_name: "Jordan",
      last_name: "Smith",
      timestamp: "2025-02-12T18:00:00Z",
    },
  ];

  const atlNoShows = [{ first_name: "Morgan", last_name: "Lee" }];

  const atlVolunteers = [
    { first_name: "Jordan", last_name: "Smith", role: "Volunteer" },
    { first_name: "Taylor", last_name: "Johnson", role: "Check-In Lead" },
    { first_name: "Morgan", last_name: "Lee", role: "Volunteer" },
  ];

  // Switch between Render & ATL Tech Week data
  const checkIns = isAtlTechWeek ? atlCheckIns : renderCheckIns;
  const checkOuts = isAtlTechWeek ? atlCheckOuts : renderCheckOuts;
  const noShows = isAtlTechWeek ? atlNoShows : renderNoShows;
  const allVolunteers = isAtlTechWeek ? atlVolunteers : renderVolunteers;

  const navigate = useNavigate();

  return (
    <div
      className={`reports-container ${
        isAtlTechWeek ? "atl-tech-week" : "render"
      }`}
    >
      <h1>{isAtlTechWeek ? "ATL Tech Week Reports" : "Render Reports"}</h1>

      {/* ✅ Toggle Button */}
      <button
        className="toggle-button"
        onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}
      >
        Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
      </button>

      {/* ✅ Reports Sections */}
      <div className="reports-section">
        <h2>✅ Checked-In Volunteers</h2>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {checkIns.length > 0 ? (
              checkIns.map((volunteer, index) => (
                <tr key={index}>
                  <td>
                    {volunteer.first_name} {volunteer.last_name}
                  </td>
                  <td>{new Date(volunteer.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No check-ins yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="reports-section">
        <h2>📤 Checked-Out Volunteers</h2>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {checkOuts.length > 0 ? (
              checkOuts.map((volunteer, index) => (
                <tr key={index}>
                  <td>
                    {volunteer.first_name} {volunteer.last_name}
                  </td>
                  <td>{new Date(volunteer.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No check-outs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="reports-section">
        <h2>❌ No Shows</h2>
        <ul>
          {noShows.length > 0 ? (
            noShows.map((volunteer, index) => (
              <li key={index}>
                {volunteer.first_name} {volunteer.last_name}
              </li>
            ))
          ) : (
            <p>No no-shows detected.</p>
          )}
        </ul>
      </div>

      <div className="reports-section">
        <h2>📋 All Volunteers</h2>
        <ul>
          {allVolunteers.length > 0 ? (
            allVolunteers.map((volunteer, index) => (
              <li key={index}>
                {volunteer.first_name} {volunteer.last_name} - {volunteer.role}
              </li>
            ))
          ) : (
            <p>No volunteers available.</p>
          )}
        </ul>
      </div>

      {/* ✅ Navigation Buttons */}
      <div className="reports-buttons">
        <button onClick={() => navigate("/admin/dashboard")}>
          ⬅ Back to Dashboard
        </button>
        <button
          className="export-button"
          onClick={() => handleExport("check-ins")}
        >
          📤 Export Check-Ins
        </button>

        <button
          className="export-button"
          onClick={() => handleExport("check-outs")}
        >
          📤 Export Check-Outs
        </button>

        <button
          className="export-button"
          onClick={() => handleExport("no-shows")}
        >
          📤 Export No-Shows
        </button>
      </div>
    </div>
  );
};

export default Reports;
