import React, { useState } from "react";
import { FIELD_BASE, fieldStyle, LABEL_STYLE, ERROR_TEXT_STYLE } from "./fieldStyles";

const MAX_LENGTH = 2000;
const MIN_LENGTH = 20;

export default function ObservationDescriptionField({ value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      <label style={LABEL_STYLE}>
        Description <span style={{ color: "#E5484D" }}>*</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        placeholder="Direct observation of flexible electrical power cables positioned across primary pedestrian thoroughfares…"
        rows={5}
        aria-required="true"
        aria-invalid={!!error}
        style={{
          ...fieldStyle({ focused, hovered, error }),
          height: "auto",
          minHeight: 120,
          padding: "14px 16px",
          resize: "vertical",
          lineHeight: 1.55,
        }}
      />
      {error && <div style={ERROR_TEXT_STYLE}>{error}</div>}
    </div>
  );
}
