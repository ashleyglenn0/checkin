// RecoverQRPage.js
import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  Alert,
  Paper,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { db } from "../config/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  increment,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const renderTheme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#fdf0e2", paper: "#ffffff" },
    primary: { main: "#fe88df" },
    text: { primary: "#711b43" },
  },
});

const MAX_ATTEMPTS = 5;

const RecoverQRPage = () => {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [qrLink, setQrLink] = useState(null);
  const [message, setMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  const handleRecover = async () => {
    if (!firstName || !lastName) {
      setAlertType("warning");
      return setMessage("Please enter both first and last name.");
    }
  
    try {
      const userQuery = query(
        collection(db, "users"),
        where("first_name", "==", firstName),
        where("last_name", "==", lastName),
        where("role", "==", "teamLead")
      );
  
      const snapshot = await getDocs(userQuery);
  
      if (snapshot.empty) {
        setAlertType("error");
        return setMessage("Team Lead not found or role mismatch.");
      }
  
      const userData = snapshot.docs[0].data();
      const assignedTask = userData.assignedTask || userData.task || "";
      const event = userData.event || "";
  
      if (!assignedTask || !event) {
        setAlertType("error");
        return setMessage("Missing task or event info. Please contact an admin.");
      }
  
      const attemptId = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
      const attemptRef = doc(db, "qr_recovery_attempts", attemptId);
      const attemptSnap = await getDoc(attemptRef);
  
      const currentCount = attemptSnap.exists() ? attemptSnap.data().count : 0;
  
      if (currentCount >= MAX_ATTEMPTS) {
        setAlertType("error");
        return setMessage("Maximum QR code regenerations reached. Please contact an admin.");
      }
  
      // 🔐 Set context before redirect
      await login({
        firstName,
        lastName,
        event: userData.event || "",
        role: "teamlead",
        assignedTask: userData.assignedTask || "",
        task: userData.assignedTask || "", // ensure both are set in case your QR page uses one or the other
      });
  
      await setDoc(
        attemptRef,
        {
          count: increment(1),
          lastAccessed: new Date().toISOString(),
        },
        { merge: true }
      );
  
      await addDoc(collection(db, "alerts"), {
        audience: "admin-only",
        event,
        severity: "warning",
        message: `🔁 QR code regenerated by ${firstName} ${lastName} for task "${assignedTask}".`,
        timestamp: new Date().toISOString(),
      });
  
      const qrURL = `${window.location.origin}/teamlead-qr?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&task=${encodeURIComponent(assignedTask)}&event=${encodeURIComponent(event)}`;
  
      setQrLink(qrURL);
      setAlertType("success");
      setMessage("✅ QR code link generated! Redirecting in 5 seconds...");
  
      setTimeout(() => {
        window.location.href = qrURL;
      }, 5000);
    } catch (err) {
      console.error("QR Recovery Error:", err);
      setAlertType("error");
      setMessage("Something went wrong. Please try again or contact support.");
    }
  };
  

  return (
    <ThemeProvider theme={renderTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Recover Team Lead QR Code
          </Typography>

          {message && <Alert severity={alertType} sx={{ mb: 2 }}>{message}</Alert>}

          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Button variant="contained" onClick={handleRecover}>
            Generate QR Link
          </Button>

          {qrLink && (
            <Box mt={3}>
              <TextField
                value={qrLink}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{ mb: 1 }}
              />
              <Button
                variant="outlined"
                onClick={() => navigator.clipboard.writeText(qrLink)}
              >
                Copy to Clipboard
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default RecoverQRPage;
