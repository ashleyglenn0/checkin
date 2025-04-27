import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CssBaseline,
  Paper,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import PageLayout from "../components/PageLayout";
import { useAuth } from "../context/AuthContext";
import PinkPeachIcon from "../assets/PinkPeachIcon.png";
import ATWLogo from "../assets/ATWLogo.jpg";

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
    background: {
      default: "#f5f5f5",
      paper: "#ffffff"
    },
    primary: {
      main: "#ffb89e"
    },
    text: {
      primary: "#4f2b91",
      secondary: "#2b2b36"
    },
    secondary: {
      main: "#68dcaf"
    },
  },
});

const TeamLeadQRPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const db = getFirestore();

  const [task, setTask] = useState("");
  const [event, setEvent] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [teamLeadAlerts, setTeamLeadAlerts] = useState([]);
  const [overdueReturns, setOverdueReturns] = useState([]);
  const [coveragePercentage, setCoveragePercentage] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "teamlead") {
      navigate("/");
      return;
    }

    const resolvedTask =
      user.task || user.assignedTask || searchParams.get("task") || "";
    const resolvedEvent = user.event || searchParams.get("event") || "";

    setTask(resolvedTask);
    setEvent(resolvedEvent);
  }, [user, navigate, searchParams]);

  useEffect(() => {
    if (!user || !user.firstName || !user.lastName || !task || !event) return;

    const fetchAlertsAndStats = async () => {
      const alertsRef = collection(db, "alerts");
      const q = query(alertsRef, where("event", "==", event));
      const snapshot = await getDocs(q);

      const localKey = `dismissedTeamLeadAlerts_${user.firstName}_${user.lastName}`;
      const dismissed = JSON.parse(localStorage.getItem(localKey) || "[]");

      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (alert) =>
            !dismissed.includes(alert.id) &&
            ["everyone", "teamlead-all", "teamlead-direct"].includes(
              alert.audience
            ) &&
            (alert.audience !== "teamlead-direct" || alert.task === task)
        );

      setTeamLeadAlerts(filtered);

      const checkinsRef = collection(db, "task_checkins");
      const checkinQ = query(
        checkinsRef,
        where("task", "==", task),
        where("event", "==", event)
      );
      const checkinSnap = await getDocs(checkinQ);

      const now = new Date();
      let active = 0;
      const overdueList = [];

      checkinSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (
          data.status === "Check In for Task" ||
          data.status === "Check In from Break"
        ) {
          active++;
        }

        if (
          data.status === "Check Out for Break" &&
          data.time &&
          !checkinSnap.docs.some(
            (d) =>
              d.data().first_name === data.first_name &&
              d.data().last_name === data.last_name &&
              d.data().status === "Check In from Break" &&
              new Date(d.data().time) > new Date(data.time)
          )
        ) {
          const breakTime = new Date(data.time);
          const minutes = Math.floor((now - breakTime) / 60000);
          if (minutes > 30) {
            overdueList.push({ ...data, duration: minutes });
          }
        }
      });

      const scheduledRef = collection(db, "scheduled_volunteers");
      const today = new Date().toISOString().split("T")[0];
      const schedQ = query(
        scheduledRef,
        where("task", "==", task),
        where("event", "==", event),
        where("date", "==", today)
      );
      const schedSnap = await getDocs(schedQ);
      const scheduledCount = schedSnap.size || 1;

      setCoveragePercentage(Math.round((active / scheduledCount) * 100));
      setOverdueReturns(overdueList);
    };

    fetchAlertsAndStats();
    const interval = setInterval(fetchAlertsAndStats, 60000);
    return () => clearInterval(interval);
  }, [db, task, event, user]);

  const handleDismissAlert = (id) => {
    const localKey = `dismissedTeamLeadAlerts_${user.firstName}_${user.lastName}`;
    const dismissed = JSON.parse(localStorage.getItem(localKey) || "[]");
    localStorage.setItem(localKey, JSON.stringify([...dismissed, id]));
    setTeamLeadAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const theme = event === "ATL Tech Week" ? atlTheme : renderTheme;
  const appUrl = window.location.origin + "/task-check-in";
  const qrValue = `${appUrl}?teamLead=${encodeURIComponent(
    `${user?.firstName || ""} ${user?.lastName || ""}`
  )}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(event)}`;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageLayout centered>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <img
            src={event ? ATWLogo : PinkPeachIcon}
            alt="Event Logo"
            style={{ height: "60px", width: "auto" }}
          />
        </Box>
        <Typography variant="h5" gutterBottom>
          Welcome, {user?.firstName} {user?.lastName}
        </Typography>
        <Typography>
          Event: <strong>{event}</strong>
        </Typography>
        <Typography>
          Assigned Task: <strong>{task}</strong>
        </Typography>

        <Box sx={{ my: 3 }}>
          <Typography variant="h6">📊 Task Overview</Typography>
          <Typography>
            ✅ Current Coverage:{" "}
            {coveragePercentage !== null
              ? `${coveragePercentage}%`
              : "Loading..."}
          </Typography>

          {coveragePercentage < 60 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              ⚠️ Task coverage is below 60%. Consider limiting breaks.
            </Alert>
          )}

          {overdueReturns.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              ⚠️ Volunteers overdue from break:
              <ul>
                {overdueReturns.map((v, i) => (
                  <li key={i}>
                    {v.first_name} {v.last_name} — {v.duration} mins ago
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {teamLeadAlerts.map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.severity || "info"}
              onClose={() => handleDismissAlert(alert.id)}
              sx={{ mt: 2 }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>

        {!showQR ? (
          <Button variant="contained" onClick={() => setShowQR(true)}>
            Get Your QR Code
          </Button>
        ) : (
          <>
            <Paper sx={{ p: 2, mt: 2, mb: 2 }} elevation={3}>
              <QRCodeCanvas value={qrValue} size={220} level="H" />
              <Typography mt={2}>
                Scan this code to check volunteers into <strong>{task}</strong>
              </Typography>
            </Paper>
            <Button
              variant="outlined"
              onClick={() =>
                navigate(
                  `/teamlead/task-checkin?task=${encodeURIComponent(
                    task
                  )}&teamLead=${encodeURIComponent(
                    `${user?.firstName || ""} ${user?.lastName || ""}`
                  )}&event=${encodeURIComponent(event)}&manual=true`
                )
              }
            >
              Manual Check-In
            </Button>
          </>
        )}
      </PageLayout>
    </ThemeProvider>
  );
};

export default TeamLeadQRPage;
