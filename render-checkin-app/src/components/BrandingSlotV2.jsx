import React from "react";
import PinkPeachIcon from "../assets/PinkPeachIcon.png"; 
import ATWLogo from "../assets/ATWLogo.jpg"; 

const BrandingSlotV2 = ({ currentEvent }) => {
  const logo = currentEvent === "ATL Tech Week" ? ATWLogo : PinkPeachIcon;

  return (
    <div style={{
      backgroundColor: "white",
      padding: "6px",
      borderRadius: "8px",
      display: "inline-block"
    }}>
      <img
        src={logo}
        alt={`${currentEvent} Logo`}
        style={{ height: "40px", width: "auto", maxWidth: "160px" }}
      />
    </div>
  );
};

export default BrandingSlotV2;
