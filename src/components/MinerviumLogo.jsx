import React from "react";

/* MINERVIUM logo — geometric owl-shield icon, uses the real artwork
   (public/logo-icon.png for small/icon use, public/logo.png for the
   full hero panel on the welcome screen). object-contain, never cropped. */
export default function MinerviumLogo({ size = 140, className = "", full = false }) {
  return (
    <img
      src={full ? "/logo.png" : "/logo-icon.png"}
      alt="MINERVIUM"
      className={`object-contain ${className}`}
      style={{ width: size, height: "auto" }}
    />
  );
}
