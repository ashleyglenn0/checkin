import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

const RoleBasedAccess = ({ allowedRoles }) => {
  const [userRole, setUserRole] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Try pulling from both possible keys in localStorage
    const storedUser =
      JSON.parse(localStorage.getItem("userInfo")) ||
      JSON.parse(localStorage.getItem("adminInfo"));

    if (storedUser?.role) {
      setUserRole(storedUser.role.toLowerCase());
    } else {
      setUserRole("guest"); // fallback role
    }

    setIsLoaded(true); // Trigger render after hydration
  }, []);

  if (!isLoaded) return <p>Loading access...</p>;

  return allowedRoles.includes(userRole) ? <Outlet /> : <Navigate to="/" />;
};

export default RoleBasedAccess;
