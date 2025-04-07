import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Box,
  Button,
  TextField,
  Typography,
  CssBaseline,
  Alert,
} from "@mui/material";
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

const atlTheme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#e0f7f9", paper: "#ffffff" },
    primary: { main: "#5ec3cc" },
    text: { primary: "#004d61" },
  },
});

const TaskCheckInForm = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isTeamLeadPath = location.pathname.includes("/teamlead");
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [task, setTask] = useState("");
  const [teamLead, setTeamLead] = useState("");
  const [event, setEvent] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showBackButton, setShowBackButton] = useState(false);

  const db = getFirestore();

  useEffect(() => {
    setTask(searchParams.get("task") || "");
    setTeamLead(searchParams.get("teamLead") || "");
    setEvent(searchParams.get("event") || "");
    setShowBackButton(true);
  }, [searchParams]);

  const verifyAdminCheckIn = async (first, last, minWaitMinutes = 1) => {
    const startOfDay = Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0)));
    const endOfDay = Timestamp.fromDate(new Date(new Date().setHours(23, 59, 59, 999)));

    const q = query(
      collection(db, "check_ins"),
      where("first_name", "==", first),
      where("last_name", "==", last),
      where("status", "==", "Checked In"),
      where("timestamp", ">=", startOfDay),
      where("timestamp", "<=", endOfDay)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { allowed: false, message: "\u26a0\ufe0f No admin check-in found for today." };
    }

    const checkInTime = snapshot.docs[0].data().timestamp.toDate();
    const currentTime = new Date();
    const timeDifferenceMinutes = (currentTime - checkInTime) / 60000;

    if (timeDifferenceMinutes < minWaitMinutes) {
      return {
        allowed: false,
        message: `\u26a0\ufe0f Please wait ${Math.ceil(minWaitMinutes - timeDifferenceMinutes)} more minute(s) before checking in with the team lead while the system updates.`,
      };
    }

    return { allowed: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");

    try {
      const { allowed, message } = await verifyAdminCheckIn(firstName, lastName, 1);
      if (!allowed) {
        setError(message);
        return;
      }

      const timestamp = new Date().toISOString();
      const taskCheckinId = `${firstName}_${lastName}_${timestamp}`;

      await setDoc(doc(db, "task_checkins", taskCheckinId), {
        first_name: firstName,
        last_name: lastName,
        task,
        checkinTime: timestamp,
        checkoutTime: null,
        teamLead,
        event,
      });

      localStorage.setItem(
        "teamLeadInfo",
        JSON.stringify({ firstName, lastName, task, event })
      );

      setSuccessMessage(`✅ ${firstName} ${lastName} successfully checked in.`);

      setTimeout(() => {
        navigate(`/teamlead-qr?firstName=${encodeURIComponent(teamLead.split(" ")[0])}&lastName=${encodeURIComponent(teamLead.split(" ")[1] || "")}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(event)}`);
      }, 1200);
    } catch (error) {
      console.error("🔥 Error checking in:", error);
      setError("❌ Failed to check in. Please try again.");
    }
  };

  const theme = event === "ATL Tech Week" ? atlTheme : renderTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageLayout centered>
        <Typography variant="h5" gutterBottom>Task Check-In Form</Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <Typography mt={2}><strong>Task:</strong> {task}</Typography>
          <Typography><strong>Team Lead:</strong> {teamLead}</Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}

          <Button type="submit" variant="contained" sx={{ mt: 2 }}>
            Check In
          </Button>
        </Box>

        {isTeamLeadPath && showBackButton && (
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => {
              const teamLeadData = JSON.parse(localStorage.getItem("teamLeadInfo"));
              if (teamLeadData) {
                const { firstName, lastName, task, event } = teamLeadData;
                navigate(`/teamlead-qr?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(event)}`);
              } else {
                alert("⚠️ No team lead information found.");
              }
            }}
          >
            Back to QR Code
          </Button>
        )}
      </PageLayout>
    </ThemeProvider>
  );
};

export default TaskCheckInForm;
