import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db, checkInsRef } from "../config/firebaseConfig";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import "../styles.css";

const CheckInForm = () => {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffMember, setStaffMember] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // ✅ Track admin status
  const navigate = useNavigate();

  const isQRScan = searchParams.has("staff");

  // ✅ Check localStorage for admin info on mount
  useEffect(() => {
    const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));
    setIsAdmin(adminInfo?.role === "admin");
  }, []);

  const handleCheckInOut = async (statusType) => {
    if (!firstName || !lastName) {
      alert("⚠️ Please enter both first and last name.");
      return;
    }

    try {
      const userQuery = query(
        collection(db, "users"),
        where("first_name", "==", firstName),
        where("last_name", "==", lastName)
      );
      const userSnapshot = await getDocs(userQuery);

      if (statusType === "Checked In" && !userSnapshot.empty) {
        const user = userSnapshot.docs[0].data();

        // ✅ Handle Admin Role
        if (user.role === "admin") {
          localStorage.setItem("userInfo", JSON.stringify({ firstName, lastName, role: "admin" }));
          setIsAdmin(true); // Update state for immediate UI feedback
          navigate("/admin/dashboard"); // Redirect to dashboard
          return;
        }
      }

      // ✅ Normal volunteer check-in/out
      await addDoc(checkInsRef, {
        first_name: firstName,
        last_name: lastName,
        status: statusType,
        timestamp: Timestamp.now(),
        staff_qr: staffMember || "manual-entry",
        isAtlTechWeek: Boolean(isAtlTechWeek),  // ✅ Ensure it's a boolean (true/false)
      });

      alert(`✅ Successfully ${statusType}!`);
      if (statusType === "Checked Out") {
        // ✅ Clear admin info and reset form
        localStorage.removeItem("adminInfo");
        setIsAdmin(false);
        setFirstName("");
        setLastName("");
        setStaffMember(null);
        setIsButtonDisabled(false); // Re-enable buttons
  
        // ✅ Redirect back to check-in form
        navigate("/");
      } else {
        setIsButtonDisabled(true); // Prevent double submissions
      }
    } catch (error) {
      console.error("🔥 Error:", error);
      alert("❌ An error occurred. Please try again.");
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

      {!isQRScan && (
        <select
          onChange={(e) => setStaffMember(e.target.value)}
          value={staffMember || ""}
        >
          <option value="">Select Staff Member</option>
          {["Ashley", "Mikal", "Reba", "Lloyd"].map((staff) => (
            <option key={staff} value={staff}>{staff}</option>
          ))}
        </select>
      )}

      <label>
        <input
          type="checkbox"
          checked={isAtlTechWeek}
          onChange={() => setIsAtlTechWeek(!isAtlTechWeek)}
        />
        Is this volunteer for ATL Tech Week?
      </label>

      <div style={{ marginTop: "20px" }}>
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
      </div>

      {/* ✅ Show admin-specific buttons only if isAdmin is true */}
      {isAdmin && (
        <div style={{ marginTop: "20px" }}>
          <button
            className="dashboard"
            onClick={() => navigate("/admin/dashboard")}
          >
            Go to Dashboard
          </button>
          <button
            className="dashboard"
            style={{ marginLeft: "10px" }}
            onClick={() => navigate("/admin/qr-code")}
          >
            Get Your QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckInForm;
