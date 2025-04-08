// Admin Dashboard with Traffic Monitor and Full Logic Restored
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
  CssBaseline,
  Alert,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db, checkInsRef } from "../config/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PageLayout from "../components/PageLayout";

const renderTheme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#fdf0e2", paper: "#ffffff" },
    primary: { main: "#fe88df" },
    text: { primary: "#711b43" },
  },
});

const CheckInForm = ({ showAdminButtons = false }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAdminPath = window.location.pathname.includes("/admin");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffMember, setStaffMember] = useState(null);
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [qrLink, setQrLink] = useState("");
  const [showQRLink, setShowQRLink] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [feedback, setFeedback] = useState({ message: "", type: "", show: false });

  useEffect(() => {
    const url = new URL(window.location.href);
    const isQR = url.searchParams.has("staff");
    const storedAdmin = JSON.parse(localStorage.getItem("adminInfo"));
    const staffFromQR = url.searchParams.get("staff");

    const isMismatch =
      storedAdmin?.role === "admin" &&
      `${storedAdmin.firstName} ${storedAdmin.lastName}` !== staffFromQR;

    if (isQR && isAdminPath && isMismatch) {
      localStorage.removeItem("adminInfo");
      navigate("/");
    }

    // ✅ FIX: Only set admin state if on /admin path
    if (storedAdmin?.role === "admin" && isAdminPath) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    const qrStaff = searchParams.get("staff");
    if (qrStaff) setStaffMember(qrStaff);

    const lastQRLink =
      localStorage.getItem("teamLeadQRLink") ||
      localStorage.getItem("adminQRLink");
    if (lastQRLink) setQrLink(lastQRLink);
  }, [searchParams, navigate, isAdminPath]);

  const showAlert = (message, type = "success") => {
    setFeedback({ message, type, show: true });
    setTimeout(() => setFeedback({ ...feedback, show: false }), 4000);
  };

  const handleCheckInOut = async (statusType) => {
    if (!firstName || !lastName) {
      showAlert("⚠️ Please enter both first and last name.", "warning");
      return;
    }

    if (!staffMember) {
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

      if (!userSnapshot.empty) {
        const user = userSnapshot.docs[0].data();
        const userRole = user.role?.toLowerCase() || "no role found";

        if (statusType === "Checked In") {
          if (userRole === "admin") {
            const adminQR = `${window.location.origin}/admin/qr-code?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`;
            localStorage.setItem("adminQRLink", adminQR);
            setQrLink(adminQR);
            localStorage.setItem("adminInfo", JSON.stringify({ firstName, lastName, role: "admin" }));
            setIsAdmin(true);
            showAlert("✅ Admin successfully checked in. Redirecting...");

            setTimeout(() => {
              try {
                navigate("/admin/dashboard");
              } catch (e) {
                console.error("Navigation failed:", e);
                window.location.href = "/admin/dashboard";
              }
            }, 2000);
            return;
          }

          if (userRole === "teamlead") {
            await addDoc(checkInsRef, {
              first_name: firstName,
              last_name: lastName,
              status: statusType,
              staff_qr: staffMember,
              timestamp: Timestamp.now(),
              isAtlTechWeek,
            });

            const teamLeadQR = `${window.location.origin}/teamlead-qr?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&task=${encodeURIComponent(user.assignedTask)}&event=${encodeURIComponent(user.event)}`;

            localStorage.setItem("teamLeadQRLink", teamLeadQR);
            setQrLink(teamLeadQR);
            setShowQRLink(true);
            setCountdown(30);

            const interval = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(interval);
                  setShowQRLink(false);
                }
                return prev - 1;
              });
            }, 1000);

            showAlert("✅ Team Lead checked in. Redirecting to your QR code in 5 seconds...");
            setTimeout(() => {
              try {
                window.location.href = teamLeadQR;
              } catch (e) {
                console.error("Redirect failed:", e);
                window.open(teamLeadQR, "_self");
              }
            }, 2000);
          }
        }
      }

      await addDoc(checkInsRef, {
        first_name: firstName,
        last_name: lastName,
        status: statusType,
        staff_qr: staffMember,
        timestamp: Timestamp.now(),
        isAtlTechWeek,
      });

      showAlert(`✅ Volunteer successfully ${statusType.toLowerCase()}!`);
      setFirstName("");
      setLastName("");
    } catch (error) {
      console.error("🔥 Error:", error);
      showAlert("❌ An error occurred. Please try again.", "error");
    }
  };

  return (
    <ThemeProvider theme={renderTheme}>
      <CssBaseline />
      <PageLayout>
        <Typography variant="h6" color="red">🚨 DEBUG MODE ACTIVE</Typography>
        <Button size="small" onClick={() => setShowDebug(!showDebug)}>
          Debug
        </Button>
        {showDebug && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "#f0f0f0", fontSize: "12px" }}>
            <pre>
              isAdmin: {String(isAdmin)}
              <br />
              staffMember: {staffMember || "none"}
              <br />
              URL: {window.location.href}
              <br />
              localStorage keys: {Object.keys(localStorage).join(", ")}
            </pre>
          </Box>
        )}

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

          {!searchParams.has("staff") && (
            <TextField select label="Select Staff Member" value={staffMember || ""} onChange={(e) => setStaffMember(e.target.value)} fullWidth>
              {["Ashley", "Mikal", "Reba", "Lloyd"].map((staff) => (
                <MenuItem key={staff} value={staff}>{staff}</MenuItem>
              ))}
            </TextField>
          )}

          <FormControlLabel
            control={<Checkbox checked={isAtlTechWeek} onChange={() => setIsAtlTechWeek(!isAtlTechWeek)} />}
            label="Is this volunteer for ATL Tech Week?"
          />

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" onClick={() => handleCheckInOut("Checked In")}>Check In</Button>
            <Button variant="outlined" onClick={() => handleCheckInOut("Checked Out")}>Check Out</Button>
          </Stack>

          {(showAdminButtons || isAdminPath || isAdmin) && (
            <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
              <Button
                variant="contained"
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    navigate("/admin/dashboard");
                  } catch (err) {
                    console.error("Navigation failed:", err);
                    window.location.href = "/admin/dashboard";
                  }
                }}
                style={{ touchAction: "manipulation" }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const link = localStorage.getItem("adminQRLink") || localStorage.getItem("teamLeadQRLink");
                  if (link) {
                    window.open(link, "_blank");
                  } else {
                    showAlert("❌ No saved QR link found.", "error");
                  }
                }}
              >
                Get Your QR Code
              </Button>
            </Stack>
          )}

          {showQRLink && (
            <Box mt={3}>
              <Typography variant="subtitle1">QR Code Link:</Typography>
              <TextField value={qrLink} fullWidth InputProps={{ readOnly: true }} sx={{ mt: 1 }} />
              <Button onClick={() => {
                navigator.clipboard.writeText(qrLink);
                showAlert("📋 Link copied to clipboard!");
              }} sx={{ mt: 1 }}>
                Copy Link
              </Button>
              <Typography variant="body2" mt={1}>
                ⏳ Link will disappear in {countdown} seconds.
              </Typography>
            </Box>
          )}
        </Stack>
      </PageLayout>
    </ThemeProvider>
  );
};

export default CheckInForm;
