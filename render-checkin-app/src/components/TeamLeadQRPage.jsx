import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/qrstyles.css";

const TeamLeadQRPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const db = getFirestore();

  const [task, setTask] = useState("");
  const [event, setEvent] = useState("");
  const [showQR, setShowQR] = useState(false);

  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";

  useEffect(() => {
    const fetchTeamLeadInfo = async () => {
      if (!firstName || !lastName) return;

      const q = query(
        collection(db, "users"),
        where("first_name", "==", firstName),
        where("last_name", "==", lastName),
        where("role", "==", "teamLead")
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setTask(data.assignedTask);
        setEvent(data.event);
      } else {
        console.warn(`No team lead found for ${firstName} ${lastName}. Using URL params as fallback.`);
        setTask(searchParams.get("task") || "Unknown Task");
        setEvent(searchParams.get("event") || "Unknown Event");
      }
    };

    fetchTeamLeadInfo();
  }, [db, firstName, lastName, searchParams]);

  const appUrl = "https://volunteercheckin-3659e.web.app/task-check-in";

  console.log("URL Parameters:", {
    firstName: searchParams.get("firstName"),
    lastName: searchParams.get("lastName"),
    task: searchParams.get("task"),
    event: searchParams.get("event"),
  });
  

  return (
    <div className={`qr-page-container ${event === "ATL Tech Week" ? "atl-tech-week" : "render-event"}`}>
      <h2>Welcome, {firstName} {lastName}</h2>
      <p>Event: <strong>{event || "Loading..."}</strong></p>
      <p>Assigned Task: <strong>{task || "Loading..."}</strong></p>

      {!showQR ? (
        <button onClick={() => setShowQR(true)}>Get Your QR Code</button>
      ) : (
        <>
          <div className="qr-code-container">
            <QRCodeCanvas
              value={`${appUrl}?teamLead=${encodeURIComponent(`${firstName} ${lastName}`)}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(event)}`}
              size={200}
              level="H"
            />
            <p>Scan this code to check volunteers into <strong>{task}</strong></p>
          </div>
          <button
            onClick={() =>
              navigate(
                `/teamlead/task-checkin?task=${encodeURIComponent(task)}&teamLead=${encodeURIComponent(`${firstName} ${lastName}`)}&event=${encodeURIComponent(event)}`
              )
            }
          >
            Manual Check-In
          </button>
        </>
      )}
    </div>
  );
};

export default TeamLeadQRPage;
