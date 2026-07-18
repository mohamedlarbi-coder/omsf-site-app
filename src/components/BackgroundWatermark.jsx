import React from "react";
import MinerviumLogo from "./MinerviumLogo";

/* Fixed, full-viewport watermark: the big MINERVIUM badge sitting faintly
   behind all page content. Pointer-events disabled so it never blocks
   taps/clicks on the real UI above it. */
export default function BackgroundWatermark() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <div style={{ opacity: 0.20, transform: "scale(2.2)", imageRendering: "crisp-edges" }}>
        <MinerviumLogo size={360} />
      </div>
    </div>
  );
}
