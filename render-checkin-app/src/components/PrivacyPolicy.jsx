import React from "react";
import {
  Box,
  Typography,
  CssBaseline,
  Container,
  Paper,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PageLayout from "../components/PageLayout";

const renderTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#fdf0e2",
      paper: "#ffffff",
    },
    primary: {
      main: "#fe88df",
    },
    text: {
      primary: "#711b43",
    },
  },
  typography: {
    fontFamily: "Arial, sans-serif",
  },
});

const PrivacyPolicy = () => {
  return (
    <ThemeProvider theme={renderTheme}>
      <CssBaseline />
      <PageLayout>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ padding: 4, mt: 4 }}>
            <Typography variant="h4" gutterBottom color="primary">
              Privacy Policy
            </Typography>

            <Typography variant="body1" paragraph>
              This application collects your first and last name for the purpose of managing check-ins and coordinating volunteer tasks during the Render conference.
            </Typography>

            <Typography variant="body1" paragraph>
              Your information is stored securely and only accessible to authorized staff. We do not sell or share your data with any third-party organizations.
            </Typography>

            <Typography variant="body1" paragraph>
              By checking in, you acknowledge that your name may appear in check-in reports, task assignments, and be visible to conference organizers for the duration of the event.
            </Typography>

            <Typography variant="body1" paragraph>
              For any questions regarding data privacy, please contact the event organizer directly or visit the admin desk on-site.
            </Typography>

            <Typography variant="body2" mt={4} color="textSecondary">
              Last updated: April 2025
            </Typography>
          </Paper>
        </Container>
      </PageLayout>
    </ThemeProvider>
  );
};

export default PrivacyPolicy;
