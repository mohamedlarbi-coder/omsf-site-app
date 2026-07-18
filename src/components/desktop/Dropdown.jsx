import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { fieldStyle, LABEL_STYLE, ERROR_TEXT_STYLE } from "./fieldStyles";

/* Shared dropdown used by Location, Tracking Type and Hazard Class —
   avoids duplicating the same open/close/keyboard logic and styling
   three times. Native <select> semantics aren't flexible enough to
   match the MINERVIUM field styling, so this is a small custom
   listbox with full keyboard support (Arrow keys, Enter, Escape). */
export default function Dropdown({ label, required, value, onChange, options, placeholder = "Select…", error }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && highlightIndex >= 0) {
        onChange(options[highlightIndex]);
        setOpen(false);
      } else {
        setOpen(true);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <label style={LABEL_STYLE}>
        {label} {required && <span style={{ color: "#E5484D" }}>*</span>}
      </label>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required}
        aria-invalid={!!error}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...fieldStyle({ focused, hovered, error }),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: value ? "#F1F5F6" : "#5C6870" }}>{value || placeholder}</span>
        <ChevronDown size={16} color="#8A9198" style={{ transition: "transform 180ms ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "#0D1B25",
            border: "1px solid rgba(170, 190, 200, 0.22)",
            borderRadius: 10,
            padding: 6,
            maxHeight: 240,
            overflowY: "auto",
            boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
            listStyle: "none",
            animation: "minervium-dropdown-in 180ms ease",
          }}
        >
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              onMouseDown={() => { onChange(opt); setOpen(false); }}
              onMouseEnter={() => setHighlightIndex(i)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 10px",
                borderRadius: 7,
                fontSize: 14,
                color: "#F1F5F6",
                background: i === highlightIndex ? "rgba(24, 201, 203, 0.12)" : "transparent",
                cursor: "pointer",
              }}
            >
              {opt}
              {value === opt && <Check size={14} color="#18C9CB" />}
            </li>
          ))}
        </ul>
      )}
      {error && <div style={ERROR_TEXT_STYLE}>{error}</div>}
    </div>
  );
}
