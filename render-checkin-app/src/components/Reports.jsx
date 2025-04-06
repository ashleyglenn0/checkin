import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  TextField,
  CssBaseline,
} from "@mui/material";
import { CSVLink } from "react-csv";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { ThemeProvider, createTheme } from "@mui/material/styles";

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

const Reports = () => {
  const [activeTab, setActiveTab] = useState("check-ins");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [checkIns, setCheckIns] = useState([]);
  const [checkOuts, setCheckOuts] = useState([]);
  const [noShows, setNoShows] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [shiftCoverage, setShiftCoverage] = useState([]);
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const navigate = useNavigate();

  const currentTheme = isAtlTechWeek ? atlTheme : renderTheme;

  const fetchData = async () => {
    const startOfDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0, 0, 0, 0
    );
    const endOfDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      23, 59, 59, 999
    );

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    const mapData = (docs) =>
      docs.map((doc) => ({
        "Last Name": doc.last_name,
        "First Name": doc.first_name,
        "Staff QR": doc.staff_qr,
        Status: doc.status,
        "ATL Tech Week": doc.isAtlTechWeek ? "Yes" : "No",
        "Date of Check-In": new Date(doc.timestamp.toDate()).toLocaleDateString(),
        Timestamp: new Date(doc.timestamp.toDate()).toLocaleTimeString(),
      }));

    const [checkInsSnap, checkOutsSnap, scheduledSnap, volunteersSnap] = await Promise.all([
      getDocs(query(
        collection(db, "check_ins"),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        where("status", "==", "Checked In"),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      )),
      getDocs(query(
        collection(db, "check_ins"),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        where("status", "==", "Checked Out"),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      )),
      getDocs(query(
        collection(db, "scheduled_volunteers"),
        where("date", "==", selectedDate.toISOString().split("T")[0]),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      )),
      getDocs(collection(db, "volunteers")),
    ]);

    const checkIns = checkInsSnap.docs.map((doc) => doc.data());
    const checkOuts = checkOutsSnap.docs.map((doc) => doc.data());
    const scheduled = scheduledSnap.docs.map((doc) => doc.data());
    const volunteers = volunteersSnap.docs.map((doc) => doc.data());

    const noShows = scheduled.filter(
      (vol) => !checkIns.some(
        (ci) => ci.first_name === vol.first_name && ci.last_name === vol.last_name
      )
    );

    setCheckIns(mapData(checkIns));
    setCheckOuts(mapData(checkOuts));
    setNoShows(noShows.map((vol) => ({
      "Last Name": vol.last_name,
      "First Name": vol.first_name,
      "ATL Tech Week": vol.isAtlTechWeek ? "Yes" : "No",
      "Date of Scheduled Shift": vol.date,
    })));

    const roleCounts = volunteers.reduce((acc, { role }) => {
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    setRoleDistribution(Object.entries(roleCounts).map(([role, count]) => ({ Role: role, Count: count })));

    const shiftData = scheduled.reduce((acc, { shift }) => {
      const checkInCount = checkIns.filter((ci) => ci.shift === shift).length;
      acc[shift] = acc[shift] || { Shift: shift, Scheduled: 0, "Checked In": 0 };
      acc[shift].Scheduled += 1;
      acc[shift]["Checked In"] = checkInCount;
      return acc;
    }, {});
    setShiftCoverage(Object.values(shiftData));
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, isAtlTechWeek]);

  const getCurrentTabData = () => {
    switch (activeTab) {
      case "check-ins": return checkIns;
      case "check-outs": return checkOuts;
      case "no-shows": return noShows;
      case "role-distribution": return roleDistribution;
      case "shift-coverage": return shiftCoverage;
      default: return [];
    }
  };

  const renderTable = (data) => (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            {data.length > 0 && Object.keys(data[0]).map((key) => (
              <TableCell key={key}>{key}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, i) => (
              <TableRow key={i}>
                {Object.values(row).map((val, j) => (
                  <TableCell key={j}>{val}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={100}>No data available.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ backgroundColor: currentTheme.palette.background.default, minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg" sx={{ backgroundColor: currentTheme.palette.background.paper, py: 4, borderRadius: 2 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" color="textPrimary">
              {isAtlTechWeek ? "ATL Tech Week Reports" : "Render Reports"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <TextField
              label="Select Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={selectedDate.toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              sx={{ backgroundColor: "white" }}
            />
            <Button variant="outlined" onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}>
              Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
            </Button>
          </Stack>

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            {["check-ins", "check-outs", "no-shows", "role-distribution", "shift-coverage"].map((tab) => (
              <Tab key={tab} label={tab.replace("-", " ").toUpperCase()} value={tab} />
            ))}
          </Tabs>

          {renderTable(getCurrentTabData())}

          <Stack direction="row" spacing={2} justifyContent="center" mt={4}>
            <CSVLink
              data={getCurrentTabData()}
              filename={`${activeTab}_${selectedDate.toISOString().split("T")[0]}.csv`}
              style={{ textDecoration: "none" }}
            >
              <Button variant="contained" color="primary">
                📤 Export CSV
              </Button>
            </CSVLink>
            <Button variant="outlined" onClick={() => navigate("/admin/dashboard")}>⬅ Back to Dashboard</Button>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Reports;