import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db, checkInsRef } from "../config/firebaseConfig";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import "../styles.css";

const CheckInForm = () => {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [action, setAction] = useState("Check In");
  const [staffMember, setStaffMember] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(false); // NEW STATE
  const navigate = useNavigate();

  const isQRScan = searchParams.has("staff");

  // List of authorized staff for manual check-ins
  const authorizedStaff = ["Ashley", "Mikal", "Reba", "Lloyd"];

  useEffect(() => {
    const staff = searchParams.get("staff");
    if (staff) {
      setStaffMember(staff);
      setIsButtonDisabled(false); // Re-enable buttons when a QR code is scanned
    }
  }, [searchParams]);

  const checkLastAction = async (first, last) => {
    const today = new Date().toISOString().split("T")[0];
    const q = query(
      checkInsRef,
      where("first_name", "==", first),
      where("last_name", "==", last),
      where("timestamp", ">=", today)
    );

    const querySnapshot = await getDocs(q);
    let lastStatus = null;

    querySnapshot.forEach((doc) => {
      lastStatus = doc.data().status;
    });

    setAction(lastStatus === "Checked In" ? "Check Out" : "Check In");
  };

  const handleCheckInOut = async (statusType) => {
    if (!firstName || !lastName) {
      alert("⚠️ Please enter both first and last name.");
      return;
    }
  
    if (!isQRScan && !staffMember) {
      alert("⚠️ Please select a staff member for manual check-in.");
      return;
    }
  
    try {
      // If attempting to check out, verify the volunteer has checked in first
      if (statusType === "Checked Out") {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to beginning of the day
  
        const checkInQuery = query(
          checkInsRef,
          where("first_name", "==", firstName),
          where("last_name", "==", lastName),
          where("status", "==", "Checked In"),
          where("timestamp", ">=", Timestamp.fromDate(today)) // Use Firestore Timestamp
        );
  
        const checkInSnapshot = await getDocs(checkInQuery);
  
        console.log("📌 Checking for Check-In Records for:", firstName, lastName);
        console.log("📌 Query Snapshot Size:", checkInSnapshot.size);
  
        checkInSnapshot.forEach((doc) => {
          console.log("✅ Found Check-In Record:", doc.data());
        });
  
        if (checkInSnapshot.empty) {
          alert("❌ This volunteer has NOT checked in yet and cannot check out.");
          return;
        }
      }
  
      // Proceed with check-in or check-out
      await addDoc(checkInsRef, {
        first_name: firstName,
        last_name: lastName,
        status: statusType,
        timestamp: Timestamp.now(), // Store timestamp correctly
        staff_qr: staffMember || "manual-entry",
        isAtlTechWeek: isAtlTechWeek
      });
  
      alert(`✅ Successfully ${statusType}!`);
  
      // Disable buttons after a successful check-in/check-out to prevent abuse
      setIsButtonDisabled(true);
    } catch (error) {
      console.error(`🔥 Error recording ${statusType.toLowerCase()}:`, error);
      alert(`❌ Error processing ${statusType.toLowerCase()}. Please try again.`);
    }
  };

  return (
    <div className="container">
      <h1>Volunteer Check-In</h1>
      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />

      {/* If manually checking in (not from QR code), show staff dropdown */}
      {!isQRScan && (
        <select
          onChange={(e) => setStaffMember(e.target.value)}
          value={staffMember || ""}
        >
          <option value="">Select Staff Member</option>
          {authorizedStaff.map((staff) => (
            <option key={staff} value={staff}>
              {staff}
            </option>
          ))}
        </select>
      )}
      {/* ATL Tech Week Checkbox */}
    <label>
      <input
        type="checkbox"
        checked={isAtlTechWeek}
        onChange={() => setIsAtlTechWeek(!isAtlTechWeek)}
      />
      Is this volunteer for ATL Tech Week?
    </label>

      <button
        className="dashboard"
        onClick={() => handleCheckInOut("Checked In")}
        disabled={isButtonDisabled}
      >
        Check In
      </button>
      <button
        className="dashboard"
        onClick={() => handleCheckInOut("Checked Out")}
        disabled={isButtonDisabled}
        style={{ marginLeft: "10px" }}
      >
        Check Out
      </button>

      {/* Show "Go to Dashboard" only if NOT accessed via QR Code */}
      {!isQRScan && (
        <button
        className="dashboard"
          onClick={() => navigate("/dashboard")}
          style={{ marginLeft: "10px" }}
        >
          Go to Dashboard
        </button>
      )}

      {/* Show which staff QR code was used */}
      {staffMember && <p>Checked in via: {staffMember}</p>}
    </div>
  );
};

export default CheckInForm;
