import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import "../styles/taskcheckinstyles.css";

const TaskCheckInForm = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isTeamLeadPath = location.pathname.includes("/teamlead");
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [task, setTask] = useState("");
  const [teamLead, setTeamLead] = useState("");
  const [event, setEvent] = useState("");
  const [error, setError] = useState(null);
  const [showBackButton, setShowBackButton] = useState(false);

  const db = getFirestore();

  useEffect(() => {
    setTask(searchParams.get("task") || "");
    setTeamLead(searchParams.get("teamLead") || "");
    setEvent(searchParams.get("event") || "");
    setShowBackButton(searchParams.get("manual") === "true");
  }, [searchParams]);

  const verifyAdminCheckIn = async (first, last, minWaitMinutes = 1) => {
    const startOfDay = Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0)));
    const endOfDay = Timestamp.fromDate(new Date(new Date().setHours(23, 59, 59, 999)));

    const q = query(
      collection(db, "check_ins"),
      where("first_name", "==", first),
      where("last_name", "==", last),
      where("status", "==", "Checked In"),
      where("timestamp", ">=", startOfDay),
      where("timestamp", "<=", endOfDay)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { allowed: false, message: "⚠️ No admin check-in found for today." };
    }

    const checkInTime = snapshot.docs[0].data().timestamp.toDate();
    const currentTime = new Date();
    const timeDifferenceMinutes = (currentTime - checkInTime) / 60000; // ms to minutes

    if (timeDifferenceMinutes < minWaitMinutes) {
      return {
        allowed: false,
        message: `⚠️ Please wait ${Math.ceil(minWaitMinutes - timeDifferenceMinutes)} more minute(s) before checking in with the team lead while the system updates.`,
      };
    }

    return { allowed: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { allowed, message } = await verifyAdminCheckIn(firstName, lastName, 1);
      if (!allowed) {
        setError(message);
        return;
      }

      const timestamp = new Date().toISOString();

      // ✅ Create or update task_checkins record
      const taskCheckinId = `${firstName}_${lastName}_${timestamp}`;
      await setDoc(doc(db, "task_checkins", taskCheckinId), {
        first_name: firstName,
        last_name: lastName,
        task,
        checkinTime: timestamp,
        checkoutTime: null,
        teamLead,
        event,
      });

      alert(`✅ Checked in: ${firstName} ${lastName} for ${task}`);

      localStorage.setItem(
        "teamLeadInfo",
        JSON.stringify({ firstName, lastName, task, event })
      );

      setFirstName("");
      setLastName("");
    } catch (error) {
      console.error("🔥 Error checking in:", error);
      setError("❌ Failed to check in. Please try again.");
    }
  };

  return (
    <div className={`task-checkin-form ${event === "ATL Tech Week" ? "atl-tech-week" : "render-event"}`}>
      <h2>Task Check-In Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label>Last Name:</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div>
          <label>Task:</label>
          <p>{task}</p>
        </div>
        <div>
          <label>Team Lead:</label>
          <p>{teamLead}</p>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Check In</button>
      </form>

      {isTeamLeadPath && (
        <button
          className="back-button"
          onClick={() => {
            const teamLeadData = JSON.parse(localStorage.getItem("teamLeadInfo"));
            if (teamLeadData) {
              const { firstName, lastName, task, event } = teamLeadData;
              navigate(`/teamlead-qr?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(event)}`);
            } else {
              alert("⚠️ No team lead information found.");
            }
          }}
        >
          Back to QR Code
        </button>
      )}
    </div>
  );
};

export default TaskCheckInForm;
