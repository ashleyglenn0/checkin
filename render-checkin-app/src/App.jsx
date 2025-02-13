import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CheckInForm from "./components/CheckInForm";
import Dashboard from "./components/Dashboard";
import Reports from "./components/Reports";
import Schedule from "./components/Schedule";
import ThemePreview from "./components/ThemePreview";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CheckInForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/theme-preview" element={<ThemePreview />} />
      </Routes>
    </Router>
  );
};

export default App;
