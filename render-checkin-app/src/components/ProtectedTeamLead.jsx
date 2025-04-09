// components/ProtectedTeamLead.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../config/firebaseConfig"; // ✅ Corrected import
import { getTokenFromSession } from "../utils/tokenHelpers";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

const ProtectedTeamLead = ({ children }) => {
  const functions = getFunctions(app); // ✅ Use app from firebaseConfig
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = getTokenFromSession();

      if (!token) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const verifyAuthToken = httpsCallable(functions, "verifyAuthToken");
        const result = await verifyAuthToken({ token });

        if (result?.data?.role === "teamlead") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        console.error("🛑 Team Lead token verification failed:", err);
        setAuthorized(false);
      }

      setLoading(false);
    };

    verifyToken();
  }, []);

  if (loading) {
    return (
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return authorized ? children : <Navigate to="/" replace />;
};

export default ProtectedTeamLead;
