// New file: TeamLeadQRPage.js
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
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

const TeamLeadQRPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const db = getFirestore();

  const [task, setTask] = useState("");
  const [event, setEvent] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [teamLeadAlerts, setTeamLeadAlerts] = useState([]);
  const [overdueReturns, setOverdueReturns] = useState([]);
  const [coveragePercentage, setCoveragePercentage] = useState(null);

  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";

  const theme = event === "ATL Tech Week" ? atlTheme : renderTheme;

  useEffect(() => {
    const fetchTeamLeadInfo = async () => {
      if (!firstName || !lastName) return;

      const q = query(
        collection(db, "users"),
        where("first_name", "==", firstName),
        where("last_name", "==", lastName),
        where("role", "==", "teamLead")
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setTask(data.assignedTask);
        setEvent(data.event);
      } else {
        setTask(searchParams.get("task") || "Unknown Task");
        setEvent(searchParams.get("event") || "Unknown Event");
      }
    };

    fetchTeamLeadInfo();
  }, [db, firstName, lastName, searchParams]);

  useEffect(() => {
    if (!event || !task) return;

    const fetchAlertsAndStats = async () => {
      const alertsRef = collection(db, "alerts");
      const q = query(alertsRef, where("event", "==", event));
      const snapshot = await getDocs(q);

      const localKey = `dismissedTeamLeadAlerts_${firstName}_${lastName}`;
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
  }, [event, task]);

  const handleDismissAlert = (id) => {
    setTeamLeadAlerts((prev) => prev.filter((a) => a.id !== id));
    const localKey = `dismissedTeamLeadAlerts_${firstName}_${lastName}`;
    const dismissed = JSON.parse(localStorage.getItem(localKey) || "[]");
    localStorage.setItem(localKey, JSON.stringify([...dismissed, id]));
  };

  const appUrl = "https://volunteercheckin-3659e.web.app/task-check-in";
  const qrValue = `${appUrl}?teamLead=${encodeURIComponent(
    `${firstName} ${lastName}`
  )}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(event)}`;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageLayout centered>
        <Typography variant="h5" gutterBottom>
          Welcome, {firstName} {lastName}
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
            ✅ Current Coverage: {coveragePercentage !== null ? `${coveragePercentage}%` : "Loading..."}
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
                    `${firstName} ${lastName}`
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
