import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../styles/scheduleStyles.css";

const Schedule = () => {
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const [schedule, setSchedule] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("isAtlTechWeek", JSON.stringify(isAtlTechWeek));
  }, [isAtlTechWeek]);

  useEffect(() => {
    const fetchSchedule = async () => {
      const today = new Date().toISOString().split("T")[0];

      const scheduleQuery = query(
        collection(db, "scheduled_volunteers"),
        where("date", "==", today),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      );

      const scheduleSnapshot = await getDocs(scheduleQuery);
      setSchedule(scheduleSnapshot.docs.map(doc => doc.data()));
    };

    fetchSchedule();
  }, [isAtlTechWeek]);

  return (
    <div className={`schedule-container ${isAtlTechWeek ? "atl-tech-week" : "render"}`}>
      <h1>{isAtlTechWeek ? "ATL Tech Week Schedule" : "Render Schedule"}</h1>

      {/* Toggle Button (Now Available Here Too) */}
      <button className="toggle-button" onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}>
        Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
      </button>

      <table className="schedule-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Shift</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {schedule.length > 0 ? (
            schedule.map((volunteer, index) => (
              <tr key={index}>
                <td>{volunteer.first_name} {volunteer.last_name}</td>
                <td>{volunteer.shift}</td>
                <td>{volunteer.role || "Volunteer"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No volunteers scheduled.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="schedule-buttons">
        <button onClick={() => navigate("/admin/dashboard")}>⬅ Back to Dashboard</button>
        <button className="export-button">📤 Export to Google Sheets</button>
      </div>
    </div>
  );
};

export default Schedule;
