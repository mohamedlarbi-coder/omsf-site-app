import React from "react";

/* SentiQ badge logo — circular metallic ring with initials, teal accents.
   Rendered as SVG so it stays crisp at any size (splash screen, favicon-ish
   use inside the app, etc.) without needing an image asset. */
export default function SentiQLogo({ size = 140, initials = "MJ" }) {
  const id = React.useId ? React.useId().replace(/:/g, "") : "sq";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="35%" stopColor="#e2e8f0" />
          <stop offset="65%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id={`letter-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#0f172a" stopOpacity="0" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.15" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="98" fill={`url(#glow-${id})`} />

      {/* outer ring, broken into arcs like the reference badge */}
      <circle cx="100" cy="100" r="82" fill="none" stroke={`url(#ring-${id})`} strokeWidth="7"
        strokeDasharray="94 20 94 20" strokeLinecap="round" transform="rotate(-20 100 100)" />

      {/* inner ring, offset */}
      <circle cx="100" cy="100" r="66" fill="none" stroke={`url(#ring-${id})`} strokeWidth="5"
        strokeDasharray="70 16 70 16" strokeLinecap="round" transform="rotate(35 100 100)" opacity="0.85" />

      {/* initials, stacked/overlapping like a monogram seal */}
      <text x="100" y="118" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700" fontSize="72" fill={`url(#letter-${id})`} opacity="0.95">
        {initials}
      </text>

      {/* small teal highlight accent, echoing the reference image's top-left glint */}
      <path d="M 100 18 A 82 82 0 0 1 155 40" fill="none" stroke="#2dd4bf" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
