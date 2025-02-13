import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../styles/dashboardstyles.css";

const Dashboard = () => {
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const [checkIns, setCheckIns] = useState([]);
  const [checkOuts, setCheckOuts] = useState([]);
  const [noShows, setNoShows] = useState([]);
  const [scheduledVolunteers, setScheduledVolunteers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("isAtlTechWeek", JSON.stringify(isAtlTechWeek));
  }, [isAtlTechWeek]);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      // Fetch Check-Ins
      const checkInsQuery = query(
        collection(db, "check_ins"),
        where("timestamp", ">=", today),
        where("status", "==", "Checked In"),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      setCheckIns(checkInsSnapshot.docs.map(doc => doc.data()));

      // Fetch Check-Outs
      const checkOutsQuery = query(
        collection(db, "check_ins"),
        where("timestamp", ">=", today),
        where("status", "==", "Checked Out"),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      );
      const checkOutsSnapshot = await getDocs(checkOutsQuery);
      setCheckOuts(checkOutsSnapshot.docs.map(doc => doc.data()));

      // Fetch Scheduled Volunteers
      const scheduledQuery = query(
        collection(db, "scheduled_volunteers"),
        where("date", "==", today),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      );
      const scheduledSnapshot = await getDocs(scheduledQuery);
      const scheduledList = scheduledSnapshot.docs.map(doc => doc.data());
      setScheduledVolunteers(scheduledList);

      // Find No Shows (Scheduled but NOT Checked In)
      const noShowsList = scheduledList.filter(scheduled =>
        !checkIns.some(checkedIn =>
          checkedIn.first_name === scheduled.first_name &&
          checkedIn.last_name === scheduled.last_name
        )
      );
      setNoShows(noShowsList);
    };

    fetchData();
  }, [isAtlTechWeek]);

  return (
    <div className={`dashboard-container ${isAtlTechWeek ? "atl-tech-week" : "render"}`}>
      <h1>{isAtlTechWeek ? "ATL Tech Week Dashboard" : "Render Dashboard"}</h1>

      {/* Toggle Button */}
      <button className="toggle-button" onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}>
        Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
      </button>

      {/* ✅ Check-Ins Section */}
      <div className="dashboard-section">
        <h2>✅ Checked-In Volunteers</h2>
        <ul>
          {checkIns.length > 0 ? (
            checkIns.map((volunteer, index) => (
              <li key={index}>{volunteer.first_name} {volunteer.last_name}</li>
            ))
          ) : (
            <p>No check-ins yet.</p>
          )}
        </ul>
      </div>

      {/* ✅ Check-Outs Section */}
      <div className="dashboard-section">
        <h2>📤 Checked-Out Volunteers</h2>
        <ul>
          {checkOuts.length > 0 ? (
            checkOuts.map((volunteer, index) => (
              <li key={index}>{volunteer.first_name} {volunteer.last_name}</li>
            ))
          ) : (
            <p>No check-outs yet.</p>
          )}
        </ul>
      </div>

      {/* ✅ No Shows Section */}
      <div className="dashboard-section">
        <h2>❌ No Shows</h2>
        <ul>
          {noShows.length > 0 ? (
            noShows.map((volunteer, index) => (
              <li key={index}>{volunteer.first_name} {volunteer.last_name}</li>
            ))
          ) : (
            <p>No no-shows detected.</p>
          )}
        </ul>
      </div>

      {/* ✅ Scheduled Volunteers Section (Optional) */}
      {scheduledVolunteers.length > 0 && (
        <div className="dashboard-section">
          <h2>📅 Scheduled Volunteers</h2>
          <ul>
            {scheduledVolunteers.map((volunteer, index) => (
              <li key={index}>
                {volunteer.first_name} {volunteer.last_name} - {volunteer.shift}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ Navigation Buttons */}
      <div className="dashboard-buttons">
        <button onClick={() => navigate("/schedule")}>📅 View Schedule</button>
        <button onClick={() => navigate("/reports")}>📊 View Reports</button>
      </div>
    </div>
  );
};

export default Dashboard;
