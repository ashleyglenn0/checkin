import React, { useState } from "react";
import "../themepreview.css";

const ThemePreview = () => {
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(false);

  return (
    <div className={`theme-container ${isAtlTechWeek ? "atl-tech-week" : "render"}`}>
      <h1>{isAtlTechWeek ? "ATL Tech Week Theme" : "Render Theme"}</h1>
      
      <button className="toggle-button" onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}>
        Switch to {isAtlTechWeek ? "Render" : "ATL Tech Week"}
      </button>

      <div className="theme-card">
        <h2>{isAtlTechWeek ? "ATL Tech Week Dashboard" : "Render Dashboard"}</h2>
        <p>This is a preview of how the UI will change based on the selected event.</p>
      </div>
    </div>
  );
};

export default ThemePreview;
