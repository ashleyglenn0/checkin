// Admin Dashboard with Traffic Monitor and Full Logic Restored
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  setDoc,
  onSnapshot,
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
  IconButton,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
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

const trafficZones = ["Registration", "Main Stage", "Food Truck Park"];

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const [longTaskVolunteers, setLongTaskVolunteers] = useState([]);
  const [checkIns, setCheckIns] = useState(0);
  const [checkOuts, setCheckOuts] = useState(0);
  const [noShows, setNoShows] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newAlert, setNewAlert] = useState({
    message: "",
    severity: "info",
    audience: "admin-all",
  });
  const [slackMessages, setSlackMessages] = useState([]);
  const [trafficLevels, setTrafficLevels] = useState({});

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const activeEvent = isAtlTechWeek ? "ATL Tech Week" : "Render";

  const handleLogout = () => {
    localStorage.removeItem("adminInfo");
    navigate("/");
  };

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

      if (
        newAlert.audience?.startsWith("admin") &&
        newAlert.severity === "error"
      ) {
        const res = await fetch(
          "https://us-central1-volunteercheckin-3659e.cloudfunctions.net/sendSlackAlert",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newAlert.message }),
          }
        );

        await res.text();
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
        setSlackMessages(messages);
      } catch (error) {
        console.error("Failed to fetch Slack messages:", error);
      }
    };

    const fetchStats = async () => {
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
      setScheduledCount(scheduledSnap.size);
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

    const unsubscribe = onSnapshot(collection(db, "traffic_levels"), (snapshot) => {
      const levels = {};
      snapshot.forEach((doc) => {
        levels[doc.id] = doc.data().level;
      });
      setTrafficLevels(levels);
    });

    fetchSlackMessages();
    fetchAlerts();
    fetchStats();
    fetchLongTaskVolunteers();

    return () => unsubscribe();
  }, [isAtlTechWeek]);

  useEffect(() => {
    const storedAdmin = JSON.parse(localStorage.getItem("adminInfo"));
    const currentPath = window.location.pathname;
  
    if (storedAdmin?.role === "admin" || currentPath.includes("/admin")) {
      setIsAdmin(true);
    }
  
    const qrStaff = searchParams.get("staff");
    if (qrStaff) setStaffMember(qrStaff);
  }, [searchParams]);

  const currentTheme = isAtlTechWeek ? atlTheme : renderTheme;
  const coverageRate = scheduledCount > 0 ? Math.round((checkIns / scheduledCount) * 100) : 0;

  const updateTrafficLevel = async (zone, level) => {
    const docRef = doc(db, "traffic_levels", zone);
    await setDoc(docRef, { level, event: activeEvent }, { merge: true });
  };

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
        <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button variant="outlined" onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}>
            Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
          </Button>
          <Button variant="contained" onClick={() => navigate("/admin/schedule")}>View Schedule</Button>
          <Button variant="contained" onClick={() => navigate("/admin/checkin")}>Back to Check-In</Button>
          <Button variant="contained" onClick={() => navigate("/admin/reports")}>Reports</Button>
          <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>Send Alert</Button>
          <Button variant="outlined" onClick={handleLogout}>Log Out</Button>
        </Stack>
      </Box>

      <Box sx={{ p: isMobile ? 2 : 4 }}>
        {/* Metrics */}
        <Grid container spacing={2} mb={2} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={3} lg={2.5}>
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
              <Typography variant="subtitle2">Coverage Rate</Typography>
              <Typography variant="h5">{coverageRate}%</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Traffic Monitor */}
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Traffic Monitor</Typography>
          {trafficZones.map((zone) => (
            <Box key={zone} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">{zone}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {[1, 2, 3, 4, 5].map((level) => (
                  <IconButton
                    key={level}
                    size="small"
                    onClick={() => updateTrafficLevel(zone, level)}
                  >
                    <CircleIcon
                      sx={{
                        color:
                          level <= (trafficLevels[zone] || 0)
                            ? currentTheme.palette.primary.main
                            : "#ccc",
                      }}
                    />
                  </IconButton>
                ))}
              </Stack>
            </Box>
          ))}
        </Paper>

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
                  {v.name} - {v.task} - {v.duration} mins (Overdue by {v.overdueBy ??
                    v.duration -
                      (v.task.toLowerCase().includes("food") ? 120 : 180)} mins)
                </Typography>
              </Box>
            ))
          )}
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/admin/task-dashboard")}
          >
            View Task Breakdown
          </Button>
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
            alerts.map((alert) => (
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
