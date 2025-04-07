import React from "react";
import { Box, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const PageLayout = ({ children, centered = false }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: centered ? "center" : "flex-start",
        py: centered ? 0 : 4,
        px: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          backgroundColor: theme.palette.background.paper,
          padding: { xs: 3, sm: 4, md: 6 },
          borderRadius: 3,
          width: "100%",
          maxWidth: "600px",
        }}
      >
        {children}
      </Paper>
    </Box>
  );
};

export default PageLayout;
