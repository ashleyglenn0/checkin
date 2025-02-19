import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CheckInForm from "./components/CheckInForm";
import Dashboard from "./components/Dashboard";
import Reports from "./components/Reports";
import Schedule from "./components/Schedule";
import ThemePreview from "./components/ThemePreview";
import TaskCheckInForm from "./components/TaskCheckInForm";
import QRScanner from "./components/QRScanner";
import TaskDashboard from "./components/TaskDashboard";

const App = () => {
  useEffect(() => {
    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;

      const installButton = document.createElement("button");
      installButton.textContent = "Install App";
      installButton.style.position = "fixed";
      installButton.style.bottom = "20px";
      installButton.style.right = "20px";
      installButton.style.zIndex = "1000";
      installButton.style.padding = "10px 20px";
      installButton.style.backgroundColor = "#FE88DF";
      installButton.style.color = "#fff";
      installButton.style.border = "none";
      installButton.style.borderRadius = "5px";
      installButton.style.cursor = "pointer";

      installButton.addEventListener("click", () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the install prompt");
          } else {
            console.log("User dismissed the install prompt");
          }
          deferredPrompt = null;
        });
      });

      document.body.appendChild(installButton);
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CheckInForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/theme-preview" element={<ThemePreview />} />
        <Route path="/task-check-in" element={<TaskCheckInForm />} />
        <Route path="/qr-scanner" element={<QRScanner />} />
        <Route path="/task-dashboard" element={<TaskDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;

