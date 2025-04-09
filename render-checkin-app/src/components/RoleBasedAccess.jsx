// RoleBasedAccess.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebaseConfig";
import { getTokenFromSession } from "../utils/tokenHelpers"; // We'll make this
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
        const verifyAuthToken = httpsCallable(functions, "verifyAuthToken");
        const result = await verifyAuthToken({ token });

        if (result?.data?.role && allowedRoles.includes(result.data.role.toLowerCase())) {
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
