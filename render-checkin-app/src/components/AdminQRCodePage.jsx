import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/qrstyles.css";

const AdminQRCode = () => {
  const [adminInfo, setAdminInfo] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdmin = JSON.parse(localStorage.getItem("adminInfo"));
    if (storedAdmin) {
      setAdminInfo(storedAdmin);
    } else {
      alert("⚠️ No admin info found. Please check in first.");
      navigate("/"); // Redirect to check-in if no admin info
    }
  }, [navigate]);

  const appUrl = "https://volunteercheckin-3659e.web.app/admin/checkin";

  return (
    <div className="qr-page-container">
      {adminInfo && (
        <>
          <h2>Welcome, {adminInfo.firstName} {adminInfo.lastName}</h2>
          <p><strong>Role:</strong> Admin</p>

          {!showQR ? (
            <button onClick={() => setShowQR(true)}>Get Your QR Code</button>
          ) : (
            <>
              <div className="qr-code-container">
                <QRCodeCanvas
                  value={`${appUrl}?admin=${encodeURIComponent(`${adminInfo.firstName} ${adminInfo.lastName}`)}`}
                  size={200}
                  level="H"
                />
                <p>Scan this code to access the Admin Dashboard</p>
              </div>
              <button onClick={() => navigate("/")}>Back to Check-In</button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminQRCode;
