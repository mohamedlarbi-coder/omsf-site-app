import React from "react";

export default function BackgroundWatermark() {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 8%, rgba(20,201,203,0.10), transparent 29%), linear-gradient(180deg, #071722 0%, #06141E 48%, #030C13 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(30deg, rgba(28,187,193,0.055) 12%, transparent 12.5%, transparent 87%, rgba(28,187,193,0.055) 87.5%), linear-gradient(150deg, rgba(28,187,193,0.055) 12%, transparent 12.5%, transparent 87%, rgba(28,187,193,0.055) 87.5%)",
          backgroundSize: "76px 132px",
          backgroundPosition: "0 0, 38px 66px",
          WebkitMaskImage:
            "linear-gradient(90deg, rgba(0,0,0,0.95), rgba(0,0,0,0.42) 38%, transparent 75%)",
          maskImage:
            "linear-gradient(90deg, rgba(0,0,0,0.95), rgba(0,0,0,0.42) 38%, transparent 75%)",
        }}
      />

      <div
        className="absolute rounded-full"
        style={{
          width: "360px",
          height: "360px",
          top: "-170px",
          right: "-140px",
          background:
            "radial-gradient(circle, rgba(15,150,168,0.10), transparent 68%)",
        }}
      />

      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          height: "190px",
          background:
            "linear-gradient(0deg, rgba(3,12,19,0.96), rgba(3,12,19,0))",
        }}
      />
    </div>
  );
}
