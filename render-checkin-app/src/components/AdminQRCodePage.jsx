import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { Box, Typography, Button, Container, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext"; // ✅ AuthContext
import PinkPeachIcon from "../assets/PinkPeachIcon.png"; // Update path if needed

const renderTheme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#fdf0e2", paper: "#ffffff" },
    primary: { main: "#fe88df" },
    text: { primary: "#711b43" },
  },
});

const AdminQRPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ grab admin from context
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    if (user?.role === "admin") {
      setAdminInfo(user);
    } else {
      alert("⚠️ No admin found. Please check in as an admin first.");
      navigate("/admin/checkin");
    }
  }, [user, navigate]);

  if (!adminInfo) return null;

  const volunteerCheckInUrl = "https://volunteercheckin-3659e.web.app/";
  const qrValue = `${volunteerCheckInUrl}?staff=${encodeURIComponent(
    `${adminInfo.firstName} ${adminInfo.lastName}`
  )}`;

  return (
    <ThemeProvider theme={renderTheme}>
      <CssBaseline />
      <Box
        sx={{
          backgroundColor: renderTheme.palette.background.default,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            backgroundColor: renderTheme.palette.background.paper,
            borderRadius: 2,
            boxShadow: 3,
            p: 4,
            textAlign: "center",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <img
              src={PinkPeachIcon}
              alt="Event Logo"
              style={{ height: "60px", width: "auto" }}
            />
          </Box>
          <Typography variant="h5" gutterBottom color="textPrimary">
            Welcome, {adminInfo.firstName} {adminInfo.lastName}
          </Typography>
          <Typography variant="subtitle1" color="textPrimary" gutterBottom>
            <strong>Event:</strong> {adminInfo.event || "Render"}
          </Typography>

          <Box sx={{ my: 3 }}>
            <QRCodeCanvas value={qrValue} size={220} level="H" />
            <Typography variant="body1" mt={2} color="textPrimary">
              Scan this code to check volunteers in/out.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate("/admin/checkin")}
          >
            Back to Check-In
          </Button>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AdminQRPage;
