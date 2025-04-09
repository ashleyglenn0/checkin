import React, { useState, useEffect } from "react";
import {
  Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField,
  Typography, CssBaseline, Alert
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db, checkInsRef } from "../config/firebaseConfig";
import {
  collection, query, where, getDocs, addDoc, Timestamp
} from "firebase/firestore";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PageLayout from "../components/PageLayout";
import { useAuth } from "../context/AuthContext";

const renderTheme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#fdf0e2", paper: "#ffffff" },
    primary: { main: "#fe88df" },
    text: { primary: "#711b43" },
  },
});

const CheckInForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffMember, setStaffMember] = useState(null);
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(false);
  const [qrLink, setQrLink] = useState("");
  const [showQRLink, setShowQRLink] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [feedback, setFeedback] = useState({ message: "", type: "", show: false });
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const isFromQR = searchParams.has("staff");
  const staffFromQR = searchParams.get("staff") || null;

  const { user, setUser, login } = useAuth();

  const showAlert = (message, type = "success") => {
    setFeedback({ message, type, show: true });
    setTimeout(() => setFeedback({ ...feedback, show: false }), 4000);
  };

  const handleCheckInOut = async (statusType) => {
    if (!firstName || !lastName) {
      showAlert("⚠️ Please enter both first and last name.", "warning");
      return;
    }

    if (!agreedToPolicy) {
      showAlert("⚠️ You must agree to the privacy policy before checking in.", "warning");
      return;
    }

    if (user?.role === "admin" && !staffMember) {
      showAlert("⚠️ Please select the staff member checking in the volunteer.", "warning");
      return;
    }

    try {
      const userQuery = query(
        collection(db, "users"),
        where("first_name", "==", firstName),
        where("last_name", "==", lastName)
      );
      const userSnapshot = await getDocs(userQuery);
      const activeEvent = isAtlTechWeek ? "ATL Tech Week" : "Render";
      const timestamp = Timestamp.now();

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const userRole = userData.role?.toLowerCase();

        await login({
          firstName,
          lastName,
          event: userData.event,
          role: userRole,
          assignedTask: userData.assignedTask || null,
        });

        if (userRole === "admin" && statusType === "Checked In") {
          const adminQR = `${window.location.origin}/admin/qr-code?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`;
          setQrLink(adminQR);
          setShowQRLink(true);
          setTimeout(() => navigate("/admin/dashboard"), 1000);
          return;
        }

        if (userRole === "teamlead" && statusType === "Checked In") {
          const teamLeadQR = `${window.location.origin}/teamlead-qr?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&task=${encodeURIComponent(userData.assignedTask)}&event=${encodeURIComponent(userData.event)}`;
          setQrLink(teamLeadQR);
          setShowQRLink(true);
          setTimeout(() => navigate("/teamlead-qr"), 1000);
          return;
        }
      }

      await addDoc(checkInsRef, {
        first_name: firstName,
        last_name: lastName,
        status: statusType,
        staff_qr: staffFromQR || staffMember,
        timestamp,
        isAtlTechWeek,
        event: activeEvent,
      });

      showAlert(`✅ Volunteer ${statusType.toLowerCase()} successfully!`);
      setFirstName("");
      setLastName("");
    } catch (err) {
      console.error("🔥 Error:", err);
      showAlert("❌ Something went wrong. Try again.", "error");
    }
  };

  useEffect(() => {
    if (showQRLink) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowQRLink(false);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showQRLink]);

  const isAdmin = user?.role === "admin";

  return (
    <ThemeProvider theme={renderTheme}>
      <CssBaseline />
      <PageLayout>
        <Typography variant="h4" gutterBottom align="center">
          Volunteer Check-In
        </Typography>

        <Stack spacing={2} mt={2}>
          {feedback.show && (
            <Alert severity={feedback.type} onClose={() => setFeedback({ ...feedback, show: false })}>
              {feedback.message}
            </Alert>
          )}

          <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
          <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />

          {isAdmin && (
            <TextField
              select
              label="Select Staff Member"
              value={staffMember || ""}
              onChange={(e) => setStaffMember(e.target.value)}
              fullWidth
            >
              {["Ashley", "Mikal", "Reba", "Lloyd"].map((staff) => (
                <MenuItem key={staff} value={staff}>{staff}</MenuItem>
              ))}
            </TextField>
          )}

          <FormControlLabel
            control={<Checkbox checked={isAtlTechWeek} onChange={() => setIsAtlTechWeek(!isAtlTechWeek)} />}
            label="Is this volunteer for ATL Tech Week?"
          />

          <FormControlLabel
            control={<Checkbox checked={agreedToPolicy} onChange={() => setAgreedToPolicy(!agreedToPolicy)} />}
            label={<span>I agree to the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">privacy policy</a></span>}
          />

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" onClick={() => handleCheckInOut("Checked In")}>Check In</Button>
            <Button variant="outlined" onClick={() => handleCheckInOut("Checked Out")}>Check Out</Button>
          </Stack>

          {isAdmin && (
            <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
              <Button variant="contained" onClick={() => navigate("/admin/dashboard")}>Go to Dashboard</Button>
              <Button variant="outlined" onClick={() => {
                if (user?.firstName && user?.lastName) {
                  const qrUrl = `${window.location.origin}/admin/qr-code?firstName=${encodeURIComponent(user.firstName)}&lastName=${encodeURIComponent(user.lastName)}`;
                  window.open(qrUrl, "_blank");
                } else {
                  showAlert("❌ QR code unavailable. Please check in first.", "error");
                }
              }}>Get Your QR Code</Button>
            </Stack>
          )}

          {showQRLink && (
            <Box mt={3}>
              <Typography variant="subtitle1">QR Code Link:</Typography>
              <TextField value={qrLink} fullWidth InputProps={{ readOnly: true }} sx={{ mt: 1 }} />
              <Typography variant="body2" mt={1}>⏳ Link will disappear in {countdown} seconds.</Typography>
            </Box>
          )}
        </Stack>
      </PageLayout>
    </ThemeProvider>
  );
};

export default CheckInForm;
