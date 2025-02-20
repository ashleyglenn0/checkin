import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../config/firebaseConfig";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
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

  // ✅ Generate upcoming 7-day options
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + i); // Ensure UTC dates
    return date;
  });

  useEffect(() => {
    localStorage.setItem("isAtlTechWeek", JSON.stringify(isAtlTechWeek));
  }, [isAtlTechWeek]);

  useEffect(() => {
    const startOfDayUTC = new Date(Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
      0, 0, 0, 0
    ));

    const endOfDayUTC = new Date(Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
      23, 59, 59, 999
    ));

    const startTimestamp = Timestamp.fromDate(startOfDayUTC);
    const endTimestamp = Timestamp.fromDate(endOfDayUTC);

    console.log(`📅 Fetching data for: ${selectedDate.toISOString().split("T")[0]}`);

    const checkInsQuery = query(
      collection(db, "check_ins"),
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp),
      where("status", "==", "Checked In"),
      where("isAtlTechWeek", "==", isAtlTechWeek)
    );

    const unsubscribeCheckIns = onSnapshot(checkInsQuery, (snapshot) => {
      setCheckIns(snapshot.docs.map((doc) => doc.data()));
    });

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

    const scheduledQuery = query(
      collection(db, "scheduled_volunteers"),
      where("date", "==", selectedDate.toISOString().split("T")[0]),
      where("isAtlTechWeek", "==", isAtlTechWeek)
    );

    const unsubscribeScheduled = onSnapshot(scheduledQuery, (snapshot) => {
      const scheduledList = snapshot.docs.map((doc) => doc.data());
      setScheduledVolunteers(scheduledList);

      const noShowsList = scheduledList.filter((scheduled) =>
        !checkIns.some(
          (checkedIn) =>
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
  }, [selectedDate, isAtlTechWeek, checkIns]);

  return (
    <div className={`dashboard-container ${isAtlTechWeek ? "atl-tech-week" : "render"}`}>
      <h1>{isAtlTechWeek ? "ATL Tech Week Dashboard" : "Render Dashboard"}</h1>

      {/* ✅ Navigation Buttons */}
      <div className="dashboard-buttons">
        <button onClick={() => navigate("/")}>🔙 Back to Check-In</button>
        <button className="toggle-button dashboard-buttons" onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}>
          Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
        </button>
        <button onClick={() => navigate("/admin/schedule")}>📅 View Schedule</button>
        <button onClick={() => navigate("/admin/reports")}>📊 View Reports</button>
        <Link to="/admin/task-dashboard">
          <button>View Task Dashboard</button>
        </Link>
      </div>

      {/* 🔹 Dropdown Date Picker */}
      <label>Select Date:</label>
      <select
        value={selectedDate.toISOString().split("T")[0]}
        onChange={(e) => {
          const [year, month, day] = e.target.value.split("-");
          setSelectedDate(new Date(Date.UTC(year, month - 1, day))); // Ensure UTC consistency
        }}
      >
        {upcomingDates.map((date, index) => (
          <option key={index} value={date.toISOString().split("T")[0]}>
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </option>
        ))}
      </select>

      {/* ✅ Checked-In Volunteers */}
      <div className="dashboard-section">
        <h2>✅ Checked-In Volunteers ({selectedDate.toLocaleDateString("en-US", { timeZone: "UTC" })})</h2>
        {checkIns.length > 0 ? (
          <ul>{checkIns.map((v, i) => <li key={i}>{v.first_name} {v.last_name}</li>)}</ul>
        ) : (
          <p>No check-ins yet.</p>
        )}
      </div>

      {/* ✅ Checked-Out Volunteers */}
      <div className="dashboard-section">
        <h2>📤 Checked-Out Volunteers ({selectedDate.toLocaleDateString("en-US", { timeZone: "UTC" })})</h2>
        {checkOuts.length > 0 ? (
          <ul>{checkOuts.map((v, i) => <li key={i}>{v.first_name} {v.last_name}</li>)}</ul>
        ) : (
          <p>No check-outs yet.</p>
        )}
      </div>

      {/* ✅ No Shows */}
      <div className="dashboard-section">
        <h2>❌ No Shows ({selectedDate.toISOString().split("T")[0]})</h2>
        {noShows.length > 0 ? (
          <ul>{noShows.map((v, i) => <li key={i}>{v.first_name} {v.last_name}</li>)}</ul>
        ) : (
          <p>No no-shows detected.</p>
        )}
      </div>

      {/* ✅ Scheduled Volunteers */}
      {scheduledVolunteers.length > 0 && (
        <div className="dashboard-section">
          <h2>📅 Scheduled Volunteers ({selectedDate.toISOString().split("T")[0]})</h2>
          <ul>
            {scheduledVolunteers.map((v, i) => (
              <li key={i}>{v.first_name} {v.last_name} - {v.shift}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
