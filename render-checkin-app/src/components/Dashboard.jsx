import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Timestamp } from "firebase/firestore"; // ✅ Import Firestore Timestamp
import "../styles/dashboardstyles.css";

const Dashboard = () => {
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [checkIns, setCheckIns] = useState([]);
  const [checkOuts, setCheckOuts] = useState([]);
  const [noShows, setNoShows] = useState([]);
  const [scheduledVolunteers, setScheduledVolunteers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("isAtlTechWeek", JSON.stringify(isAtlTechWeek));
  }, [isAtlTechWeek]);

  useEffect(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`📅 Fetching data for: ${selectedDate.toDateString()}`);

    // ✅ Convert to Firestore Timestamp
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    // ✅ Real-Time Check-Ins Listener
    const checkInsQuery = query(
      collection(db, "check_ins"),
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp),
      where("status", "==", "Checked In"),
      where("isAtlTechWeek", "==", isAtlTechWeek)
    );
    const unsubscribeCheckIns = onSnapshot(checkInsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      console.log("🔥 Updated Check-Ins Data:", data);
      setCheckIns(data);
    });

    // ✅ Real-Time Check-Outs Listener
    const checkOutsQuery = query(
      collection(db, "check_ins"),
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp),
      where("status", "==", "Checked Out"),
      where("isAtlTechWeek", "==", isAtlTechWeek)
    );
    const unsubscribeCheckOuts = onSnapshot(checkOutsQuery, (snapshot) => {
      setCheckOuts(snapshot.docs.map((doc) => doc.data()));
    });

    // ✅ Real-Time Scheduled Volunteers Listener
    const scheduledQuery = query(
      collection(db, "scheduled_volunteers"),
      where("date", "==", selectedDate.toISOString().split("T")[0]), // Keep this as a string since it's not a timestamp
      where("isAtlTechWeek", "==", isAtlTechWeek)
    );
    const unsubscribeScheduled = onSnapshot(scheduledQuery, (snapshot) => {
      const scheduledList = snapshot.docs.map((doc) => doc.data());
      setScheduledVolunteers(scheduledList);

      // ✅ Calculate No-Shows
      const noShowsList = scheduledList.filter((scheduled) =>
        !checkIns.some((checkedIn) =>
          checkedIn.first_name === scheduled.first_name &&
          checkedIn.last_name === scheduled.last_name
        )
      );
      setNoShows(noShowsList);
    });

    return () => {
      unsubscribeCheckIns();
      unsubscribeCheckOuts();
      unsubscribeScheduled();
    };
  }, [selectedDate, isAtlTechWeek]);

  return (
    <div className={`dashboard-container ${isAtlTechWeek ? "atl-tech-week" : "render"}`}>
      <h1>{isAtlTechWeek ? "ATL Tech Week Dashboard" : "Render Dashboard"}</h1>

      {/* ✅ Buttons moved to the top */}
      <div className="dashboard-buttons">
        <button onClick={() => navigate("/")}>🔙 Back to Check-In</button>
        <button className="toggle-button" onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}>
          Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
        </button>
        <button onClick={() => navigate("/schedule")}>📅 View Schedule</button>
        <button onClick={() => navigate("/reports")}>📊 View Reports</button>
      </div>

      {/* 🔹 Date Picker for Viewing Past Check-Ins */}
      <label>Select Date:</label>
      <input
        type="date"
        value={selectedDate.toISOString().split("T")[0]}
        onChange={(e) => setSelectedDate(new Date(e.target.value))}
      />

      {/* ✅ Check-Ins Section */}
      <div className="dashboard-section">
        <h2>✅ Checked-In Volunteers ({selectedDate.toISOString().split("T")[0]})</h2>
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
        <h2>📤 Checked-Out Volunteers ({selectedDate.toISOString().split("T")[0]})</h2>
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
        <h2>❌ No Shows ({selectedDate.toISOString().split("T")[0]})</h2>
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
          <h2>📅 Scheduled Volunteers ({selectedDate.toISOString().split("T")[0]})</h2>
          <ul>
            {scheduledVolunteers.map((volunteer, index) => (
              <li key={index}>
                {volunteer.first_name} {volunteer.last_name} - {volunteer.shift}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
