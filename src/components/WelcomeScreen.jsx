import React from "react";

export default function WelcomeScreen({ onGetStarted, onSignIn }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ minHeight: "100dvh", background: "#050C12" }}>
      {/* The exact approved mockup, used as-is. A wrapper locked to the
          image's own aspect ratio (1024:1536) means percentage-based
          button overlays below always line up with the real buttons
          in the image, regardless of viewport size — no letterboxing
          math needed at runtime. */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxWidth: "min(100vw, calc(100dvh * 1024 / 1536))",
          maxHeight: "min(100dvh, calc(100vw * 1536 / 1024))",
          aspectRatio: "1024 / 1536",
          margin: "0 auto",
        }}
      >
        <img
          src="/branding/welcome-full-mockup.png"
          alt="MINERVIUM"
          draggable="false"
          style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
        />

        {/* Invisible clickable zones, positioned to match the exact
            button locations measured from the approved mockup image. */}
        <button
          onClick={onGetStarted}
          aria-label="Get Started"
          style={{
            position: "absolute",
            left: "11.9%",
            top: "71.6%",
            width: "76.1%",
            height: "9.6%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
        <button
          onClick={onSignIn}
          aria-label="Sign In"
          style={{
            position: "absolute",
            left: "11.9%",
            top: "82.4%",
            width: "76.1%",
            height: "7.8%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}
