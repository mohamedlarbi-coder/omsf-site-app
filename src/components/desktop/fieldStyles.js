/* Shared styling for every Step 2 field, so all inputs/dropdowns/textarea
   stay pixel-identical per the MINERVIUM spec instead of duplicating
   these values across five separate field components. */
export const FIELD_BASE = {
  width: "100%",
  height: 50,
  borderRadius: 10,
  padding: "0 16px",
  background: "#0D1B25",
  border: "1px solid rgba(170, 190, 200, 0.18)",
  color: "#F1F5F6",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
};

export const FIELD_FOCUS_SHADOW = "0 0 0 3px rgba(20, 201, 203, 0.18)";
export const FIELD_FOCUS_BORDER = "#18C9CB";
export const FIELD_HOVER_BORDER = "rgba(200, 220, 228, 0.32)";
export const FIELD_ERROR_BORDER = "#E5484D";

export function fieldStyle({ focused, hovered, error }) {
  let border = "rgba(170, 190, 200, 0.18)";
  let boxShadow = "none";
  if (error) border = FIELD_ERROR_BORDER;
  else if (focused) { border = FIELD_FOCUS_BORDER; boxShadow = FIELD_FOCUS_SHADOW; }
  else if (hovered) border = FIELD_HOVER_BORDER;

  return {
    ...FIELD_BASE,
    border: `1px solid ${border}`,
    boxShadow,
  };
}

export const LABEL_STYLE = {
  display: "block",
  fontSize: 13,
  fontWeight: 550,
  color: "#A9B5BC",
  marginBottom: 8,
};

export const ERROR_TEXT_STYLE = {
  fontSize: 12,
  color: FIELD_ERROR_BORDER,
  marginTop: 6,
};
