import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db, checkInsRef } from "../config/firebaseConfig";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import "../styles.css";

const CheckInForm = ({ showAdminButtons = false }) => {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffMember, setStaffMember] = useState(null);
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Track admin role
  const navigate = useNavigate();

  const isQRScan = searchParams.has("staff");

  useEffect(() => {
    const storedAdmin = JSON.parse(localStorage.getItem("adminInfo"));
    if (storedAdmin?.role === "admin") setIsAdmin(true);

    const qrStaff = searchParams.get("staff");
    if (qrStaff) setStaffMember(qrStaff); // Staff member from QR code
  }, [searchParams]);

  const handleCheckInOut = async (statusType) => {
    if (!firstName || !lastName) {
      alert("⚠️ Please enter both first and last name.");
      return;
    }

    if (!staffMember) {
      alert("⚠️ Please select the staff member checking in the volunteer.");
      return;
    }

    try {
      const userQuery = query(
        collection(db, "users"),
        where("first_name", "==", firstName),
        where("last_name", "==", lastName)
      );
      const userSnapshot = await getDocs(userQuery);

      const isUserAdmin = !userSnapshot.empty && userSnapshot.docs[0].data().role === "admin";

      if (statusType === "Checked In" && isUserAdmin) {
        // ✅ Admin detected → save to localStorage and redirect
        localStorage.setItem("adminInfo", JSON.stringify({ firstName, lastName, role: "admin" }));
        setIsAdmin(true);
        alert("✅ Admin successfully checked in. Redirecting to dashboard...");
        navigate("/admin/dashboard");
        return;
      }

      // ✅ Normal volunteer check-in (skip if admin)
      if (!isUserAdmin) {
        await addDoc(checkInsRef, {
          first_name: firstName,
          last_name: lastName,
          status: statusType,
          staff_qr: staffMember,
          timestamp: Timestamp.now(),
          isAtlTechWeek,
        });

        alert(`✅ Volunteer successfully ${statusType}!`);
        setFirstName("");
        setLastName("");
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
        <select onChange={(e) => setStaffMember(e.target.value)} value={staffMember || ""}>
          <option value="">Select Staff Member</option>
          {["Ashley", "Mikal", "Reba", "Lloyd"].map((staff) => (
            <option key={staff} value={staff}>
              {staff}
            </option>
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
        <button className="dashboard" onClick={() => handleCheckInOut("Checked In")}>
          Check In
        </button>
        <button
          className="dashboard"
          onClick={() => handleCheckInOut("Checked Out")}
          style={{ marginLeft: "10px" }}
        >
          Check Out
        </button>
      </div>

      {/* ✅ Show admin-specific buttons only if showAdminButtons is true and user is admin */}
      {showAdminButtons && isAdmin && (
        <div style={{ marginTop: "20px" }}>
          <button className="dashboard" onClick={() => navigate("/admin/dashboard")}>
            Go to Dashboard
          </button>
          <button className="dashboard" style={{ marginLeft: "10px" }} onClick={() => navigate("/admin/qr-code")}>
            Get Your QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckInForm;
