// components/RoleBasedAccess.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getTokenFromSession } from "../utils/tokenHelpers"; 
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

const RoleBasedAccess = ({ allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const token = getTokenFromSession();

      if (!token) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://us-central1-volunteercheckin-3659e.cloudfunctions.net/verifyAuthToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error("Token verification failed");
        }

        const result = await response.json();

        if (result?.role && allowedRoles.includes(result.role.toLowerCase())) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("🔒 Token verification failed:", err);
        setIsAuthorized(false);
      }

      setLoading(false);
    };

    verifyAccess();
  }, [allowedRoles]);

  if (loading) {
    return (
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return isAuthorized ? <Outlet /> : <Navigate to="/" replace />;
};

export default RoleBasedAccess;
