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
  const [qrLink, setQrLink] = useState(""); // For Team Lead manual check-in
  const [showQRLink, setShowQRLink] = useState(false); // Show QR URL
  const [countdown, setCountdown] = useState(10); // Countdown timer
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

      if (!userSnapshot.empty) {
        const user = userSnapshot.docs[0].data();
        const userRole = user.role?.toLowerCase() || "no role found";
        console.log(`🚀 Fetched user role: ${userRole}`);

        if (statusType === "Checked In") {
          if (userRole === "admin") {
            localStorage.setItem("userInfo", JSON.stringify({ firstName, lastName, role: "admin" }));
            setIsAdmin(true);
            alert("✅ Admin successfully checked in. Redirecting...");
            return setTimeout(() => navigate("/admin/dashboard"), 100);
          }

          if (userRole === "teamlead") {
            // ✅ Log team lead check-in
            await addDoc(checkInsRef, {
              first_name: firstName,
              last_name: lastName,
              status: statusType,
              staff_qr: staffMember,
              timestamp: Timestamp.now(),
              isAtlTechWeek,
            });

            const generatedLink = `${window.location.origin}/teamlead-qr?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&task=${encodeURIComponent(user.assignedTask)}&event=${encodeURIComponent(user.event)}`;

            if (isQRScan) {
              // ✅ Redirect if scanned
              alert("✅ Team Lead checked in. Redirecting to QR page...");
              return setTimeout(() => navigate(generatedLink), 100);
            } else {
              // ✅ Manual check-in: Show QR link for screenshot
              setQrLink(generatedLink);
              setShowQRLink(true);
              setCountdown(10);

              const interval = setInterval(() => {
                setCountdown((prev) => {
                  if (prev <= 1) {
                    clearInterval(interval);
                    setShowQRLink(false); // Hide after countdown
                  }
                  return prev - 1;
                });
              }, 1000);

              alert("✅ Team Lead checked in (manual entry). QR link displayed.");
              return;
            }
          }
        }
      }

      // ✅ Regular volunteer check-in
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

      {/* ✅ Admin dashboard buttons */}
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

      {/* ✅ Display QR link for Team Lead (manual check-in) */}
      {showQRLink && (
        <div className="qr-link-popup">
          <p><strong>Team Lead QR Code Link:</strong></p>
          <input
            type="text"
            value={qrLink}
            readOnly
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(qrLink);
              alert("📋 Link copied to clipboard!");
            }}
          >
            Copy Link
          </button>
          <p>⏳ Link will disappear in {countdown} seconds.</p>
        </div>
      )}
    </div>
  );
};

export default CheckInForm;
