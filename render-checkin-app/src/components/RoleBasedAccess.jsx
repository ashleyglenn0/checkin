import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

const RoleBasedAccess = ({ allowedRoles }) => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("userInfo"));
    if (storedUser?.role) {
      setUserRole(storedUser.role); // 🚀 Use cached role
    } else {
      setUserRole("guest"); // Default to 'guest' or handle appropriately
    }
  }, []);

  if (userRole === null) return <p>Loading...</p>; // Short loading only if localStorage read is pending

  return allowedRoles.includes(userRole) ? <Outlet /> : <Navigate to="/" />;
};

export default RoleBasedAccess;
