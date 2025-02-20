import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
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
    setShowBackButton(searchParams.get("manual") === "true"); // Show back button if 'manual=true' is in the URL
  }, [searchParams]);

  const verifyAdminCheckIn = async (first, last) => {
    const today = new Date().toISOString().split("T")[0];
    const checkInsRef = collection(db, "check_ins");
    const q = query(
      checkInsRef,
      where("first_name", "==", first),
      where("last_name", "==", last),
      where("status", "==", "Checked In"),
      where("timestamp", ">=", today)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if checked in by an admin
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const timestamp = new Date().toISOString();
  
    try {
      const isCheckedIn = await verifyAdminCheckIn(firstName, lastName);
      if (!isCheckedIn) {
        setError("⚠️ This volunteer has not checked in with an admin and cannot check into a task.");
        return;
      }
  
      const volunteerDocRef = doc(db, "volunteers", `${firstName}_${lastName}`.toLowerCase());
      const volunteerDoc = await getDoc(volunteerDocRef);
  
      if (volunteerDoc.exists()) {
        const currentTask = volunteerDoc.data().currentTask;
        if (currentTask?.id && currentTask.task !== task) {
          await updateDoc(doc(db, "task_checkins", currentTask.id), {
            checkoutTime: timestamp,
          });
        }
      }
  
      const newTaskCheckinRef = doc(db, "task_checkins", `${firstName}_${lastName}_${timestamp}`);
      await setDoc(newTaskCheckinRef, {
        first_name: firstName,
        last_name: lastName,
        task,
        checkinTime: timestamp,
        checkoutTime: null,
        teamLead,
        event,
      });
  
      await setDoc(
        volunteerDocRef,
        { currentTask: { id: `${firstName}_${lastName}_${timestamp}`, task } },
        { merge: true }
      );
  
      alert(`✅ Checked in: ${firstName} ${lastName} for ${task}`);
  
      // 👉 Save firstName and lastName in localStorage to preserve them across navigations
      localStorage.setItem(
        "teamLeadInfo",
        JSON.stringify({ firstName, lastName, task, event })
      );
  
      // ✅ Clear fields after saving to localStorage
      setFirstName("");
      setLastName("");
    } catch (error) {
      console.error("🔥 Error checking in:", error);
      setError("❌ Failed to check in. Please try again.");
    }
  };
  

  return (
    <div
      className={`task-checkin-form ${
        event === "ATL Tech Week" ? "atl-tech-week" : "render-event"
      }`}
    >
      <h2>Task Check-In Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
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

        navigate(
          `/teamlead-qr?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(event)}`
        );
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
