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
import RecoverQRPage from "./components/RecoverQRPage";
import { AuthProvider } from "./context/AuthContext";
import PrivacyPolicy from "./components/PrivacyPolicy";

// ✅ Import protected route wrappers
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedTeamLead from "./components/ProtectedTeamLead";

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
      <AuthProvider>
        <Routes>
          {/* ✅ Public Routes */}
          <Route path="/" element={<CheckInForm />} />
          <Route path="/task-check-in" element={<TaskCheckInForm />} />
          <Route path="/recover-qr" element={<RecoverQRPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* ✅ Protected Team Lead Routes */}
          <Route
            path="/teamlead-qr"
            element={
              <ProtectedTeamLead>
                <TeamLeadQRPage />
              </ProtectedTeamLead>
            }
          />
          <Route
            path="/teamlead/task-checkin"
            element={
              <ProtectedTeamLead>
                <TaskCheckInForm />
              </ProtectedTeamLead>
            }
          />

          {/* ✅ Protected Admin Routes */}
          <Route
            path="/admin/checkin"
            element={
              <ProtectedAdminRoute>
                <CheckInForm showAdminButtons />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <Dashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/qr-code"
            element={
              <ProtectedAdminRoute>
                <AdminQRCode />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedAdminRoute>
                <Reports />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/schedule"
            element={
              <ProtectedAdminRoute>
                <Schedule />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/task-dashboard"
            element={
              <ProtectedAdminRoute>
                <TaskDashboard />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
