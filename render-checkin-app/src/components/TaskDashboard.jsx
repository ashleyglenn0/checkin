import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import "../styles/taskdashboardstyles.css";

const TaskDashboard = () => {
  const [taskCheckIns, setTaskCheckIns] = useState({});
  const [selectedEvent, setSelectedEvent] = useState("ATL Tech Week"); // Default event
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  ); // Default to today
  const db = getFirestore();
  const navigate = useNavigate();

  const tasks =
    selectedEvent === "ATL Tech Week"
      ? [
          "Registration",
          "Room Setup",
          "Tech Support",
          "Food Service",
          "Stage Crew",
          "General Support",
        ]
      : [
          "Registration",
          "Swag Distribution",
          "Tech Support",
          "Check-in Desk",
          "Room Setup",
          "General Support",
        ];

  useEffect(() => {
    if (!selectedEvent || !selectedDate) return;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0); // Start at 00:00:00

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999); // End at 23:59:59

    console.log("Selected Event:", selectedEvent);
    console.log("Selected Date:", selectedDate);
    console.log("Start:", startOfDay.toISOString());
    console.log("End:", endOfDay.toISOString());

    const q = query(
      collection(db, "task_checkins"),
      where("event", "==", selectedEvent),
      where("checkinTime", ">=", `${selectedDate}T00:00:00`),
      where("checkinTime", "<=", `${selectedDate}T23:59:59`)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        const checkIn = doc.data();
        if (!data[checkIn.task]) {
          data[checkIn.task] = [];
        }
        data[checkIn.task].push({ id: doc.id, ...checkIn });
        console.log("Query snapshot size:", snapshot.size);
        snapshot.forEach((doc) => console.log("Doc Data:", doc.data()));
      });
      setTaskCheckIns(data);
    });

    return () => unsubscribe();
  }, [selectedEvent, selectedDate, db]);

  const calculateTimeSpent = (checkinTime) => {
    if (!checkinTime) return "-";
    const now = new Date();
    const checkinDate = new Date(checkinTime);
    const diffMs = now - checkinDate;
    return Math.max(Math.floor(diffMs / 60000), 0); // Ensure no negative values
  };

  return (
    <div
      className={`task-dashboard-container ${
        selectedEvent === "ATL Tech Week" ? "atl-tech-week" : "render-event"
      }`}
    >
      {/* Event Toggle */}
      <div className="event-toggle">
        <button
          className={selectedEvent === "ATL Tech Week" ? "active" : ""}
          onClick={() => setSelectedEvent("ATL Tech Week")}
        >
          ATL Tech Week
        </button>
        <button
          className={selectedEvent === "Render" ? "active" : ""}
          onClick={() => setSelectedEvent("Render")}
        >
          Render
        </button>
      </div>

      {/* Date Selector */}
      <div className="date-selector">
        <label htmlFor="date">Select Date:</label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <h2>
        {selectedEvent} Task Dashboard -{" "}
        {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}
      </h2>

      <div className="task-panels">
        {tasks.map((task) => (
          <details key={task} className="task-panel">
            <summary>{task}</summary>
            <table>
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Team Lead</th>
                  <th>Check-in Time</th>
                  <th>Time Spent (mins)</th>
                </tr>
              </thead>
              <tbody>
                {taskCheckIns[task] && taskCheckIns[task].length > 0 ? (
                  taskCheckIns[task].map((volunteer) => (
                    <tr key={volunteer.id}>
                      <td>
                        {volunteer.firstName} {volunteer.lastName}
                      </td>
                      <td>{volunteer.teamLead}</td>
                      <td>
                        {new Date(volunteer.checkinTime).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </td>
                      <td>{calculateTimeSpent(volunteer.checkinTime)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      No check-ins for this task.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </details>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="dashboard-buttons">
        <button onClick={() => navigate("/admin/dashboard")}>
          Back to Dashboard
        </button>
        <button onClick={() => console.log("Exporting report...")}>
          Export to Report
        </button>
      </div>
    </div>
  );
};

export default TaskDashboard;
