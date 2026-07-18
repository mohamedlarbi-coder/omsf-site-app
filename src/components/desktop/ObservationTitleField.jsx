import React, { useState } from "react";
import { fieldStyle, LABEL_STYLE, ERROR_TEXT_STYLE } from "./fieldStyles";

const MAX_LENGTH = 120;

export default function ObservationTitleField({ value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      <label style={LABEL_STYLE}>
        Title <span style={{ color: "#E5484D" }}>*</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        placeholder="Exposed rebar in walkway area"
        maxLength={MAX_LENGTH}
        aria-required="true"
        aria-invalid={!!error}
        style={fieldStyle({ focused, hovered, error })}
      />
      {error && <div style={ERROR_TEXT_STYLE}>{error}</div>}
    </div>
  );
}
