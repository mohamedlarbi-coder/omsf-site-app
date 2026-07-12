import React from "react";

/* SentiQ badge logo — shows the full uploaded artwork with no cropping.
   object-contain + auto height so nothing is ever cut off, at any size. */
export default function SentiQLogo({ size = 140, className = "" }) {
  return (
    <img
      src="/logo-icon.png"
      alt="SentiQ"
      className={`object-contain ${className}`}
      style={{ width: size, height: "auto" }}
    />
  );
}
