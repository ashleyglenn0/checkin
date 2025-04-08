import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CheckInForm from "./components/CheckInForm";
import Dashboard from "./components/Dashboard";
import Reports from "./components/Reports";
import Schedule from "./components/Schedule";
import TaskCheckInForm from "./components/TaskCheckInForm";
import TaskDashboard from "./components/TaskDashboard";
import AdminQRCode from "./components/AdminQRCodePage";
import TeamLeadQRPage from "./components/TeamLeadQRPage";
import RoleBasedAccess from "./components/RoleBasedAccess";
import RecoverQRPage from "./components/RecoverQRPage";

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
  console.log("🔥 This is the latest deployed build - April 7th, 1:30PM");


  return (
    <Router>
      <Routes>
        <Route path="/" element={<CheckInForm />} />
        <Route path="/task-check-in" element={<TaskCheckInForm />} />
        <Route path="/teamlead-qr" element={<TeamLeadQRPage />} />
        <Route path="/teamlead/task-checkin" element={<TaskCheckInForm />} />
        <Route path="/recover-qr" element={<RecoverQRPage />} />

        {/* Protected Admin Routes */}
        <Route element={<RoleBasedAccess allowedRoles={["admin"]} />}>
          <Route path="/admin/checkin" element={<CheckInForm showAdminButtons={true} />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/qr-code" element={<AdminQRCode />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/schedule" element={<Schedule />} />
          <Route path="/admin/task-dashboard" element={<TaskDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
