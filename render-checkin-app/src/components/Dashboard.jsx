import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  serverTimestamp,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  CssBaseline,
  Stack,
  Grid,
  useMediaQuery,
} from "@mui/material";
import { useTheme, createTheme, ThemeProvider } from "@mui/material/styles";
import SendAlertDialog from "./SendAlertDialog";

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

const Dashboard = () => {
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const [longTaskVolunteers, setLongTaskVolunteers] = useState([]);
  const [checkIns, setCheckIns] = useState(0);
  const [checkOuts, setCheckOuts] = useState(0);
  const [noShows, setNoShows] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState("85%");
  const [alerts, setAlerts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAlert, setNewAlert] = useState({
    message: "",
    severity: "info",
    audience: "admin-all",
  });
  const [slackMessages, setSlackMessages] = useState([]);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const activeEvent = isAtlTechWeek ? "ATL" : "Render";

  const handleAddAlert = async () => {
    try {
      const alertDoc = {
        ...newAlert,
        createdAt: serverTimestamp(),
        event: activeEvent,
      };

      const docRef = await addDoc(collection(db, "alerts"), alertDoc);
      const addedDoc = await getDoc(docRef);

      setAlerts((prev) => [...prev, { id: docRef.id, ...addedDoc.data() }]);
      setOpenDialog(false);

      console.log("🟣 Alert being checked for Slack:", newAlert);
      console.log("🔍 Severity:", newAlert.severity);
      console.log("🔍 Audience:", newAlert.audience);
      console.log(
        "🔍 Condition result:",
        newAlert.audience?.startsWith("admin"),
        newAlert.severity === "urgent"
      );

      if (
        newAlert.audience?.startsWith("admin") &&
        newAlert.severity === "error"
      ) {
        console.log("📢 Calling Slack webhook for urgent alert...");

        const res = await fetch(
          "https://us-central1-volunteercheckin-3659e.cloudfunctions.net/sendSlackAlert",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newAlert.message }),
          }
        );

        const result = await res.text();
        console.log("📢 Slack webhook response:", result);
      }
    } catch (error) {
      console.error("❌ handleAddAlert error:", error);
    }
  };

  useEffect(() => {
    const fetchSlackMessages = async () => {
      try {
        const res = await fetch(
          "https://us-central1-volunteercheckin-3659e.cloudfunctions.net/getSlackMessages"
        );
        const messages = await res.json();
        console.log("Slack fetch result:", messages);
        setSlackMessages(messages);
      } catch (error) {
        console.error("Failed to fetch Slack messages:", error);
      }
    };

    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventFilter = where("event", "==", activeEvent);

      const checkInsSnap = await getDocs(
        query(collection(db, "check_ins"), eventFilter)
      );
      const checkOutsSnap = await getDocs(
        query(collection(db, "check_outs"), eventFilter)
      );
      const scheduledSnap = await getDocs(
        query(collection(db, "scheduled_volunteers"), eventFilter)
      );

      setCheckIns(checkInsSnap.size);
      setCheckOuts(checkOutsSnap.size);
      setNoShows(scheduledSnap.size - checkInsSnap.size);
    };

    const fetchAlerts = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const q = query(
          collection(db, "alerts"),
          where("event", "==", activeEvent)
          // Optionally add timestamp range if needed: where("createdAt", ">=", today)
        );
        const snap = await getDocs(q);
        const fetchedAlerts = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAlerts(fetchedAlerts);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
    };

    const fetchLongTaskVolunteers = async () => {
      const now = new Date();
      const q = query(
        collection(db, "task_checkins"),
        where("checkoutTime", "==", null),
        where("event", "==", activeEvent)
      );
      const snapshot = await getDocs(q);
      const twoHours = 2 * 60 * 60 * 1000;
      const threeHours = 3 * 60 * 60 * 1000;

      const volunteers = snapshot.docs.map((doc) => {
        const data = doc.data();
        const checkinTime = new Date(data.checkinTime);
        const duration = now - checkinTime;
        const durationMinutes = Math.floor(duration / 60000);
        const isFood = data.task.toLowerCase().includes("food");

        let overdueBy = 0;
        let status = "safe";

        if (isFood && duration > twoHours) {
          status = "overdue";
          overdueBy = Math.floor((duration - twoHours) / 60000);
        } else if (!isFood && duration > threeHours) {
          status = "overdue";
          overdueBy = Math.floor((duration - threeHours) / 60000);
        }

        return {
          name: `${data.first_name} ${data.last_name}`,
          task: data.task,
          checkinTime: checkinTime.toLocaleTimeString(),
          duration: durationMinutes,
          overdueBy,
          status,
        };
      });

      setLongTaskVolunteers(volunteers.filter((v) => v.status === "overdue"));
    };

    fetchSlackMessages();
    fetchAlerts();
    fetchStats();
    fetchLongTaskVolunteers();
    const interval = setInterval(fetchSlackMessages, 60000);
    return () => clearInterval(interval);
  }, [isAtlTechWeek]);

  const currentTheme = isAtlTechWeek ? atlTheme : renderTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />

      {/* Top Toolbar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: currentTheme.palette.background.default,
          p: 2,
          mb: 2,
          borderBottom: "1px solid #ddd",
        }}
      >
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          alignItems="center"
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Volunteer Dashboard
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}
          >
            Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/admin/schedule")}
          >
            View Schedule
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/admin/checkin")}
          >
            Back to Check-In
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/admin/reports")}
          >
            Reports
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenDialog(true)}
          >
            Send Alert
          </Button>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          p: isMobile ? 2 : 4,
          overflowY: "auto",
          maxHeight: "calc(100vh - 64px)",
        }}
      >
        {/* Metrics */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: "#e3f2fd" }}>
              <Typography variant="subtitle2">Check-Ins (Today)</Typography>
              <Typography variant="h5">{checkIns}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: "#fff3e0" }}>
              <Typography variant="subtitle2">Check-Outs (Today)</Typography>
              <Typography variant="h5">{checkOuts}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: "#ffebee" }}>
              <Typography variant="subtitle2">No Shows (Today)</Typography>
              <Typography variant="h5">{noShows}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: "#e8f5e9" }}>
              <Typography variant="subtitle2">Tasks Completed</Typography>
              <Typography variant="h5">{tasksCompleted}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Long Task Volunteers */}
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Overdue Volunteers</Typography>
          {longTaskVolunteers.length === 0 ? (
            <Typography variant="body2">
              No one is currently over their task time.
            </Typography>
          ) : (
            longTaskVolunteers.map((v, idx) => (
              <Box key={idx} sx={{ my: 0.5 }}>
                <Typography>
                  {v.name} - {v.task} - {v.duration} mins (Overdue by{" "}
                  {v.overdueBy ??
                    v.duration -
                      (v.task.toLowerCase().includes("food") ? 120 : 180)}{" "}
                  mins)
                </Typography>
              </Box>
            ))
          )}
        </Paper>

        {/* Slack Feed */}
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Slack Feed</Typography>
          {slackMessages.map((msg, idx) => (
            <Box key={idx} sx={{ my: 0.5 }}>
              <Typography variant="body2">
                <strong>{msg.user}:</strong> {msg.text}
              </Typography>
            </Box>
          ))}
        </Paper>

        {/* Alerts Section */}
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Recent Alerts</Typography>
          {alerts.length === 0 ? (
            <Typography variant="body2">No recent alerts.</Typography>
          ) : (
            alerts.map((alert, idx) => (
              <Alert
                key={alert.id}
                severity={alert.severity}
                onClose={async () => {
                  try {
                    await deleteDoc(doc(db, "alerts", alert.id));
                    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                  } catch (err) {
                    console.error("Failed to delete alert:", err);
                  }
                }}
                sx={{ mb: 1 }}
              >
                {alert.message}
              </Alert>
            ))
          )}
        </Paper>
      </Box>

      <SendAlertDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        newAlert={newAlert}
        setNewAlert={setNewAlert}
        handleAddAlert={handleAddAlert}
      />
    </ThemeProvider>
  );
};

export default Dashboard;
