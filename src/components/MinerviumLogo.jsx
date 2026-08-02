import React, { useState } from "react";
export default function MinerviumLogo({
  variant = "dark",
  size = 168,
  showWordmark = true,
  showTagline = true,
  className = "",
}) {
  const [useFallback, setUseFallback] = useState(false);
  const isLight = variant === "light";
  const svgSource = isLight
    ? "/branding/minervium-emblem-light.svg"
    : "/branding/logo-icon.svg";
  const pngSource = isLight
    ? "/branding/minervium-emblem-light.png"
    : "/branding/logo-icon.png";
  return (
    <div
      className={`flex w-full flex-col items-center text-center ${className}`}
    >
      <img
        src={useFallback ? pngSource : svgSource}
        onError={() => setUseFallback(true)}
        alt="MINERVIUM owl and shield emblem"
        draggable="false"
        decoding="async"
        className="block select-none"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: "center",
          imageRendering: "auto",
          filter: isLight
            ? "drop-shadow(0 8px 15px rgba(11,35,64,0.15))"
            : `
                drop-shadow(0 12px 22px rgba(0,0,0,0.34))
                drop-shadow(0 0 10px rgba(20,201,203,0.10))
              `,
        }}
      />
      {showWordmark && (
        <div
          className={
            isLight
              ? "mt-4 font-semibold text-[#0B2340]"
              : "mt-4 font-semibold text-slate-100"
          }
          style={{
            fontSize: "clamp(28px, 8vw, 37px)",
            letterSpacing: "0.17em",
            lineHeight: 1,
            paddingLeft: "0.17em",
          }}
        >
          MINERVIUM
        </div>
      )}
      {showTagline && (
        <div
          className={
            isLight
              ? "mt-3 font-semibold uppercase text-[#2F7F45]"
              : "mt-3 font-semibold uppercase text-[#23C5C2]"
          }
          style={{
            fontSize: "clamp(9px, 2.7vw, 11px)",
            letterSpacing: "0.15em",
            lineHeight: 1.5,
          }}
        >
          See. Share. Prevent. Improve.
        </div>
      )}
    </div>
  );
}
