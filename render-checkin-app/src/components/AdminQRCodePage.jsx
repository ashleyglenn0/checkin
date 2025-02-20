import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/qrstyles.css";

const AdminQRPage = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    const storedAdmin = JSON.parse(localStorage.getItem("adminInfo"));
    if (storedAdmin?.role === "admin") {
      setAdminInfo(storedAdmin);
    } else {
      alert("⚠️ No admin found. Please check in as an admin first.");
      navigate("/admin/check-in");
    }
  }, [navigate]);

  if (!adminInfo) return null;

  const volunteerCheckInUrl = "https://volunteercheckin-3659e.web.app/";
  const qrValue = `${volunteerCheckInUrl}?staff=${encodeURIComponent(
    `${adminInfo.firstName} ${adminInfo.lastName}`
  )}`;

  return (
    <div className="qr-page-container render-event">
      <h2>Welcome, {adminInfo.firstName} {adminInfo.lastName}</h2>
      <p><strong>Event:</strong> {adminInfo.event || "Render"}</p>
      <div className="qr-code-container">
        <QRCodeCanvas value={qrValue} size={220} level="H" />
        <p>Scan this code to check volunteers in/out.</p>
      </div>
      <button onClick={() => navigate("/admin/checkin")}>
        Back to Check-In
      </button>
    </div>
  );
};

export default AdminQRPage;
