import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  TextField,
  useMediaQuery,
  CssBaseline,
} from "@mui/material";
import { useTheme, createTheme, ThemeProvider } from "@mui/material/styles";

const renderTheme = createTheme({
  palette: {
    background: { default: "#fdf0e2" },
    primary: { main: "#fe88df" },
    text: { primary: "#711b43" },
  },
});

const atlTheme = createTheme({
  palette: {
    background: { default: "#e0f7f9" },
    primary: { main: "#5ec3cc" },
    text: { primary: "#004d61" },
  },
});

const Schedule = () => {
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const currentTheme = isAtlTechWeek ? atlTheme : renderTheme;

  useEffect(() => {
    localStorage.setItem("isAtlTechWeek", JSON.stringify(isAtlTechWeek));
  }, [isAtlTechWeek]);

  useEffect(() => {
    const fetchSchedule = async () => {
      const scheduleQuery = query(
        collection(db, "scheduled_volunteers"),
        where("date", "==", selectedDate),
        where("isAtlTechWeek", "==", isAtlTechWeek)
      );

      const scheduleSnapshot = await getDocs(scheduleQuery);
      setSchedule(scheduleSnapshot.docs.map((doc) => doc.data()));
    };

    fetchSchedule();
  }, [selectedDate, isAtlTechWeek]);

  const handleExport = () => {
    const headers = ["Name", "Shift", "Role"];
    const rows = schedule.map((v) => [
      `${v.first_name} ${v.last_name}`,
      v.shift,
      v.role || "Volunteer",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `schedule-${selectedDate}.csv`);
    link.click();
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box
  sx={{
    px: 2,
    py: 6,
    backgroundColor: currentTheme.palette.background.default,
    display: "flex",
    justifyContent: "center",
  }}
>
  <Box sx={{ width: "100%", maxWidth: 1000 }}>
    {/* Header */}
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-end"
      flexWrap="wrap"
      mb={4}
      spacing={2}
    >
      <Box>
        <Typography variant="h4" color="text.primary" gutterBottom>
          {isAtlTechWeek ? "ATL Tech Week Schedule" : "Render Schedule"}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Volunteers scheduled for {selectedDate}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="outlined"
          onClick={() => setIsAtlTechWeek((prev) => !prev)}
        >
          Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
        </Button>
        <TextField
          label="Select Date"
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>
    </Stack>

    {/* Table */}
    <TableContainer component={Paper} elevation={3}>
      <Table>
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: currentTheme.palette.primary.main,
            }}
          >
            <TableCell sx={{ color: "#fff" }}>Name</TableCell>
            <TableCell sx={{ color: "#fff" }}>Shift</TableCell>
            <TableCell sx={{ color: "#fff" }}>Role</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schedule.length > 0 ? (
            schedule.map((volunteer, index) => (
              <TableRow key={index}>
                <TableCell>
                  {volunteer.first_name} {volunteer.last_name}
                </TableCell>
                <TableCell>{volunteer.shift}</TableCell>
                <TableCell>{volunteer.role || "Volunteer"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3}>No volunteers scheduled.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Buttons */}
    <Stack direction="row" spacing={2} mt={4} justifyContent="flex-start">
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/admin/dashboard")}
      >
        ⬅ Back to Dashboard
      </Button>
      <Button variant="outlined" onClick={handleExport}>
        📤 Export to CSV
      </Button>
    </Stack>
  </Box>
</Box>

    </ThemeProvider>
  );
};

export default Schedule;
