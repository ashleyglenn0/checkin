// components/ProtectedAdminRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../config/firebaseConfig"; // ✅ You were missing this
import { getTokenFromSession } from "../utils/tokenHelpers";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

const ProtectedAdminRoute = ({ children }) => {
  const functions = getFunctions(app); // ✅ Now works since we have `app`
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

        if (result?.data?.role === "admin") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        console.error("🛑 Admin token verification failed:", err);
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

export default ProtectedAdminRoute;
