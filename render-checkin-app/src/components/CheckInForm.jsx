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
  const isQRScan = searchParams.has("staff");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffMember, setStaffMember] = useState(null);
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [qrLink, setQrLink] = useState("");
  const [showQRLink, setShowQRLink] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const storedAdmin = JSON.parse(localStorage.getItem("adminInfo"));
    if (storedAdmin?.role === "admin") setIsAdmin(true);

    const qrStaff = searchParams.get("staff");
    if (qrStaff) setStaffMember(qrStaff);
  }, [searchParams]);

  const handleCheckInOut = async (statusType) => {
    if (useMagicLink) {
      if (!adminEmail) {
        alert("⚠️ Please enter your admin email.");
        return;
      }

      const magicLink = `${
        window.location.origin
      }/admin/checkin?email=${encodeURIComponent(adminEmail)}`;

      try {
        await fetch(
          "https://us-central1-volunteercheckin-3659e.cloudfunctions.net/sendMagicLink",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminEmail, link: magicLink }),
          }
        );

        alert("✅ Magic link sent! Check your email.");
        setAdminEmail("");
        setUseMagicLink(false);
      } catch (error) {
        console.error("❌ Error sending magic link:", error);
        alert("❌ Failed to send magic link. Please try again.");
      }

      return;
    }

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

        if (statusType === "Checked In") {
          if (userRole === "admin") {
            localStorage.setItem(
              "userInfo",
              JSON.stringify({ firstName, lastName, role: "admin" })
            );
            setIsAdmin(true);
            alert("✅ Admin successfully checked in. Redirecting...");
            return setTimeout(() => navigate("/admin/dashboard"), 100);
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

            const generatedLink = `${
              window.location.origin
            }/teamlead-qr?firstName=${encodeURIComponent(
              firstName
            )}&lastName=${encodeURIComponent(
              lastName
            )}&task=${encodeURIComponent(
              user.assignedTask
            )}&event=${encodeURIComponent(user.event)}`;

            if (isQRScan) {
              alert("✅ Team Lead checked in. Redirecting to QR page...");
              return setTimeout(() => navigate(generatedLink), 100);
            } else {
              setQrLink(generatedLink);
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

              alert("✅ Team Lead checked in. QR link displayed.");
              return;
            }
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

      alert(`✅ Volunteer successfully ${statusType}!`);
      setFirstName("");
      setLastName("");
    } catch (error) {
      console.error("🔥 Error:", error);
      alert("❌ An error occurred. Please try again.");
    }
  };

  return (
    <ThemeProvider theme={renderTheme}>
      <CssBaseline />
      <PageLayout>
        <Typography variant="h4" gutterBottom align="center">
          Volunteer Check-In
        </Typography>

        <Stack spacing={2} mt={2}>
          {!showAdminButtons && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={useMagicLink}
                  onChange={(e) => setUseMagicLink(e.target.checked)}
                />
              }
              label="I am an Admin - Send me a Magic Link"
            />
          )}

          {useMagicLink ? (
            <>
              <TextField
                label="Admin Email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                fullWidth
                required
              />
              <Button
                variant="contained"
                onClick={() => handleCheckInOut("Checked In")}
              >
                Send Magic Link
              </Button>
            </>
          ) : (
            <>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
              />
              {!isQRScan && (
                <TextField
                  select
                  label="Select Staff Member"
                  value={staffMember || ""}
                  onChange={(e) => setStaffMember(e.target.value)}
                  fullWidth
                >
                  {["Ashley", "Mikal", "Reba", "Lloyd"].map((staff) => (
                    <MenuItem key={staff} value={staff}>
                      {staff}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAtlTechWeek}
                    onChange={() => setIsAtlTechWeek(!isAtlTechWeek)}
                  />
                }
                label="Is this volunteer for ATL Tech Week?"
              />

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={() => handleCheckInOut("Checked In")}
                >
                  Check In
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleCheckInOut("Checked Out")}
                >
                  Check Out
                </Button>
              </Stack>
            </>
          )}

          {showAdminButtons && isAdmin && (
            <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
              <Button
                variant="contained"
                onClick={() => navigate("/admin/dashboard")}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/qr-code")}
              >
                Get Your QR Code
              </Button>
            </Stack>
          )}

          {showQRLink && (
            <Box mt={3}>
              <Typography variant="subtitle1">
                Team Lead QR Code Link:
              </Typography>
              <TextField
                value={qrLink}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{ mt: 1 }}
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(qrLink);
                  alert("📋 Link copied to clipboard!");
                }}
                sx={{ mt: 1 }}
              >
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
