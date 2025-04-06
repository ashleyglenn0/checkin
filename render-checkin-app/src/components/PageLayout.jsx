import React from "react";
import { Box, Container } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const PageLayout = ({ children, centered = false }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
        py: 4,
        display: "flex",
        justifyContent: "center",
        alignItems: centered ? "center" : "flex-start", // ← dynamic here
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          backgroundColor: theme.palette.background.paper,
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          width: "100%",
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default PageLayout;
