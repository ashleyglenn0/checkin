// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("authToken");
    if (storedToken) {
      verifyToken(storedToken);
    }
  }, []);

  const verifyToken = async (token) => {
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

      const data = await response.json();
      setUser(data); // ✅ data contains { firstName, lastName, role }
      setToken(token);
    } catch (err) {
      console.warn("⚠️ Invalid or expired token. Clearing session.");
      logout();
    }
  };

  const login = async (userData) => {
    try {
      const response = await fetch("https://us-central1-volunteercheckin-3659e.cloudfunctions.net/createAuthToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Token generation failed");
      }

      const data = await response.json();
      const newToken = data.token;

      setUser(userData);
      setToken(newToken);
      sessionStorage.setItem("authToken", newToken);
    } catch (err) {
      console.error("❌ Token generation failed:", err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
