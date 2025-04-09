// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../config/firebaseConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const functions = getFunctions(app);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("authToken");
    if (storedToken) {
      verifyToken(storedToken);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const verifyAuthToken = httpsCallable(functions, "verifyAuthToken");
      const response = await verifyAuthToken({ token });
      setUser(response.data);
      setToken(token);
    } catch (err) {
      console.warn("⚠️ Invalid or expired token. Clearing session.");
      logout();
    }
  };

  const login = async (userData) => {
    try {
      const createAuthToken = httpsCallable(functions, "createAuthToken");
      const response = await createAuthToken(userData);
      const newToken = response.data.token;
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
