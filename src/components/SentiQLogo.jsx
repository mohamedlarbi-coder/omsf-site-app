import React from "react";

/* SentiQ badge logo — now using the real logo artwork (public/logo-icon.png)
   instead of a hand-coded SVG recreation, so it matches exactly. */
export default function SentiQLogo({ size = 140, className = "" }) {
  return (
    <img
      src="/logo-icon.png"
      alt="SentiQ"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
