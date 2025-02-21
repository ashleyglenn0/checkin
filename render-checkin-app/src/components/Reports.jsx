import React, { useState, useEffect } from "react";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { CSVLink } from "react-csv";
import "../styles/reportstyles.css";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("check-ins");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [checkIns, setCheckIns] = useState([]);
  const [checkOuts, setCheckOuts] = useState([]);
  const [noShows, setNoShows] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [shiftCoverage, setShiftCoverage] = useState([]);
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );

  const generateNextSevenDays = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });
  };

  const fetchData = async () => {
    const startOfDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0, 0, 0, 0
    );
    const endOfDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      23, 59, 59, 999
    );

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    const mapData = (docs) =>
      docs.map((doc) => ({
        "Last Name": doc.last_name,
        "First Name": doc.first_name,
        "Staff QR": doc.staff_qr,
        Status: doc.status,
        "ATL Tech Week": doc.isAtlTechWeek ? "Yes" : "No",
        "Date of Check-In": new Date(doc.timestamp.toDate()).toLocaleDateString(),
        Timestamp: new Date(doc.timestamp.toDate()).toLocaleTimeString(),
      }));

    // Queries
    const [checkInsSnapshot, checkOutsSnapshot, scheduledSnapshot, volunteersSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, "check_ins"),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        where("status", "==", "Checked In"),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      )),
      getDocs(query(
        collection(db, "check_ins"),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        where("status", "==", "Checked Out"),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      )),
      getDocs(query(
        collection(db, "scheduled_volunteers"),
        where("date", "==", selectedDate.toISOString().split("T")[0]),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      )),
      getDocs(collection(db, "volunteers")),
    ]);

    const fetchedCheckIns = checkInsSnapshot.docs.map((doc) => doc.data());
    const fetchedCheckOuts = checkOutsSnapshot.docs.map((doc) => doc.data());
    const scheduled = scheduledSnapshot.docs.map((doc) => doc.data());
    const volunteers = volunteersSnapshot.docs.map((doc) => doc.data());

    const fetchedNoShows = scheduled.filter(
      (vol) => !fetchedCheckIns.some(
        (checkIn) => checkIn.first_name === vol.first_name && checkIn.last_name === vol.last_name
      )
    );

    setCheckIns(mapData(fetchedCheckIns));
    setCheckOuts(mapData(fetchedCheckOuts));
    setNoShows(fetchedNoShows.map((vol) => ({
      "Last Name": vol.last_name,
      "First Name": vol.first_name,
      "ATL Tech Week": vol.isAtlTechWeek ? "Yes" : "No",
      "Date of Scheduled Shift": vol.date,
    })));

    // Volunteer Role Distribution
    const roleCounts = volunteers.reduce((acc, { role }) => {
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    setRoleDistribution(Object.entries(roleCounts).map(([role, count]) => ({ Role: role, Count: count })));

    // Shift Coverage vs Need
    const shiftData = scheduled.reduce((acc, { shift }) => {
      const checkInCount = fetchedCheckIns.filter((checkIn) => checkIn.shift === shift).length;
      acc[shift] = acc[shift] || { Shift: shift, Scheduled: 0, "Checked In": 0 };
      acc[shift].Scheduled += 1;
      acc[shift]["Checked In"] = checkInCount;
      return acc;
    }, {});
    setShiftCoverage(Object.values(shiftData));
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, isAtlTechWeek]);

  const dateOptions = generateNextSevenDays();

  const renderTable = (data) => (
    <table className="reports-table">
      <thead>
        <tr>{data.length > 0 && Object.keys(data[0]).map((key) => <th key={key}>{key}</th>)}</tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, index) => (
            <tr key={index}>
              {Object.values(row).map((value, idx) => <td key={idx}>{value}</td>)}
            </tr>
          ))
        ) : (
          <tr><td colSpan="100%">No data available.</td></tr>
        )}
      </tbody>
    </table>
  );

  const getCurrentTabData = () => {
    switch (activeTab) {
      case "check-ins": return checkIns;
      case "check-outs": return checkOuts;
      case "no-shows": return noShows;
      case "role-distribution": return roleDistribution;
      case "shift-coverage": return shiftCoverage;
      default: return [];
    }
  };

  return (
    <div className={`reports-container ${isAtlTechWeek ? "atl-tech-week" : "render"}`}>
      <h1>{isAtlTechWeek ? "ATL Tech Week Reports" : "Render Reports"}</h1>

      <div className="reports-controls">
        <label>Select Date:</label>
        <select
          value={selectedDate.toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        >
          {dateOptions.map((date) => (
            <option key={date.toISOString()} value={date.toISOString().split("T")[0]}>
              {date.toLocaleDateString()}
            </option>
          ))}
        </select>
        <button onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}>
          Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["check-ins", "check-outs", "no-shows", "role-distribution", "shift-coverage"].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace("-", " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="reports-section">{renderTable(getCurrentTabData())}</div>

      {/* CSV Export */}
      <div className="export-button-container">
        <CSVLink
          data={getCurrentTabData()}
          filename={`${activeTab}_${selectedDate.toISOString().split("T")[0]}.csv`}
          className="export-button"
        >
          📤 Export {activeTab.replace("-", " ")} CSV
        </CSVLink>
      </div>
    </div>
  );
};

export default Reports;
