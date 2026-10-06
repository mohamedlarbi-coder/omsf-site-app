import React, { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { supabase } from "../supabaseClient";

/* "Help me write" — asks the ai-assist Edge Function for a suggestion and
   shows it for the person to accept or dismiss. Nothing is ever applied
   without a tap on "Use this". */
const MESSAGES = {
  not_configured: "AI help isn't switched on yet — ask the admin.",
  needs_notes: "Type a few rough notes first, then I'll tidy them up.",
  needs_description: "Write the description first, then I can suggest the action.",
};

export default function AiAssistButton({ mode, context, onUse, label, canRun = true, dark = true }) {
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  async function run() {
    setBusy(true); setError(""); setSuggestion("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-assist", { body: { mode, context } });
      let code = data?.error;
      if (fnError && !code) {
        try { code = (await fnError.context?.json?.())?.error; } catch { /* ignore */ }
      }
      if (code) setError(MESSAGES[code] || "AI help isn't available right now. You can still write it yourself.");
      else if (data?.text) setSuggestion(data.text);
      else setError("No suggestion came back — try again.");
    } catch {
      setError("AI help isn't available right now. You can still write it yourself.");
    }
    setBusy(false);
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={run}
        disabled={busy || !canRun}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10,
          background: "rgba(24,201,203,0.10)", border: "1px solid rgba(24,201,203,0.35)", color: "#18C9CB",
          fontSize: 13, fontWeight: 600, cursor: busy || !canRun ? "default" : "pointer", opacity: canRun ? 1 : 0.5, font: "inherit",
        }}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {busy ? "Writing…" : label}
      </button>

      {error && <div style={{ marginTop: 6, fontSize: 12, color: "#E0A80F" }}>{error}</div>}

      {suggestion && (
        <div style={{ marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid rgba(24,201,203,0.35)", background: "#0d1b26", animation: "minervium-slide-in 0.28s ease-out" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#18C9CB", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            Suggestion — check it before using
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.55, color: "#E6ECEF" }}>{suggestion}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" onClick={() => { onUse(suggestion); setSuggestion(""); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, background: "#14C9CB", color: "#06222A", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", font: "inherit" }}>
              <Check size={14} /> Use this
            </button>
            <button type="button" onClick={() => setSuggestion("")}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, background: "transparent", color: "#8A9198", border: "1px solid rgba(160,190,204,0.25)", fontSize: 13, cursor: "pointer", font: "inherit" }}>
              <X size={14} /> Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
