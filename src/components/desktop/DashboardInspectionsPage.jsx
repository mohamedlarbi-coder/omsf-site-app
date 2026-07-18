import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { supabase } from "../../supabaseClient";

/* Desktop Inspections — a genuinely new, minimal feature backed by a
   real `inspections` table (see schema_add_inspections.sql), not
   placeholder data. Supports scheduling and marking complete. Keep
   this intentionally simple: title, location, date, status, notes —
   more fields (checklists, templates, assigned inspector) can be
   added later once this basic version is in use. */
export default function DashboardInspectionsPage({ profile, setView, showToast }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: "", location: "", scheduled_date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function loadInspections() {
    setLoading(true);
    const { data, error } = await supabase.from("inspections").select("*").order("scheduled_date", { ascending: true });
    if (!error) setInspections(data || []);
    else showToast("Couldn't load inspections — has the database table been set up?");
    setLoading(false);
  }

  useEffect(() => { loadInspections(); }, []);

  async function handleCreate() {
    if (!draft.title.trim()) { showToast("Add a title first"); return; }
    setSaving(true);
    const { error } = await supabase.from("inspections").insert({
      title: draft.title,
      location: draft.location,
      scheduled_date: draft.scheduled_date || null,
      notes: draft.notes,
      created_by: profile.id,
    });
    setSaving(false);
    if (error) { showToast("Failed to create inspection"); return; }
    setDraft({ title: "", location: "", scheduled_date: "", notes: "" });
    setShowForm(false);
    showToast("Inspection scheduled");
    loadInspections();
  }

  async function toggleStatus(inspection) {
    const newStatus = inspection.status === "Completed" ? "Planned" : "Completed";
    const { error } = await supabase.from("inspections").update({ status: newStatus }).eq("id", inspection.id);
    if (!error) loadInspections();
  }

  function handleSidebarNav(key) {
    if (key === "inspections") return;
    if (key === "dashboard") setView("home");
    else if (key === "observations") setView("observations-desktop");
    else if (key === "actions") setView("actions-desktop");
    else if (key === "reports") setView("stats");
    else if (key === "settings") setView("settings");
    else showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} isn't built yet — coming soon`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08131D", display: "flex", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <DashboardSidebar active="inspections" onNavigate={handleSidebarNav} profile={profile} />

      <div style={{ flex: 1, padding: "22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 650, color: "#F0F4F6" }}>Inspections</div>
            <div style={{ fontSize: 12.5, color: "#8997A1", marginTop: 4 }}>Planned & completed site inspections</div>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: showForm ? "#0D1B25" : "linear-gradient(135deg, #1BD5D3, #07949B)",
              border: showForm ? "1px solid rgba(121,159,176,0.2)" : "none",
              color: showForm ? "#D7DFE3" : "#031014",
              fontWeight: 650, fontSize: 13, padding: "9px 16px", borderRadius: 9, cursor: "pointer",
            }}
          >
            {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Schedule Inspection</>}
          </button>
        </div>

        {showForm && (
          <div style={{ background: "#0C1A24", border: "1px solid rgba(126,164,181,0.16)", borderRadius: 14, padding: 18, marginBottom: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Inspection title"
                style={{ background: "#0D1B25", border: "1px solid rgba(121,159,176,0.16)", borderRadius: 10, padding: "0 14px", height: 42, color: "#F1F4F5", fontSize: 13 }}
              />
              <input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="Location / Area"
                style={{ background: "#0D1B25", border: "1px solid rgba(121,159,176,0.16)", borderRadius: 10, padding: "0 14px", height: 42, color: "#F1F4F5", fontSize: 13 }}
              />
            </div>
            <input
              type="date"
              value={draft.scheduled_date}
              onChange={(e) => setDraft({ ...draft, scheduled_date: e.target.value })}
              style={{ background: "#0D1B25", border: "1px solid rgba(121,159,176,0.16)", borderRadius: 10, padding: "0 14px", height: 42, color: "#F1F4F5", fontSize: 13 }}
            />
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Notes (optional)"
              rows={2}
              style={{ background: "#0D1B25", border: "1px solid rgba(121,159,176,0.16)", borderRadius: 10, padding: "10px 14px", color: "#F1F4F5", fontSize: 13, resize: "vertical" }}
            />
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{ alignSelf: "flex-start", background: "linear-gradient(135deg, #1BD5D3, #07949B)", border: "none", color: "#031014", fontWeight: 650, fontSize: 13, padding: "9px 18px", borderRadius: 9, cursor: "pointer" }}
            >
              {saving ? "Saving…" : "Save Inspection"}
            </button>
          </div>
        )}

        <div style={{ background: "#0C1A24", border: "1px solid rgba(126,164,181,0.16)", borderRadius: 14, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#70808B", fontSize: 13 }}>Loading…</div>
          ) : inspections.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#70808B", fontSize: 13 }}>No inspections scheduled yet.</div>
          ) : (
            inspections.map((insp, i) => (
              <div
                key={insp.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 110px 100px",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderBottom: i === inspections.length - 1 ? "none" : "1px solid rgba(121,157,173,0.12)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: "#E0E6E9" }}>{insp.title}</div>
                  {insp.location && <div style={{ fontSize: 11.5, color: "#8997A0", marginTop: 3 }}>{insp.location}</div>}
                </div>
                <div style={{ fontSize: 12, color: "#8997A0" }}>{insp.scheduled_date || "No date set"}</div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: insp.status === "Completed" ? "#1FC99B" : "#E5A01E" }}>{insp.status}</div>
                <button
                  onClick={() => toggleStatus(insp)}
                  style={{ justifySelf: "end", background: "none", border: "1px solid rgba(121,159,176,0.2)", color: "#D7DFE3", fontSize: 11.5, padding: "6px 10px", borderRadius: 7, cursor: "pointer" }}
                >
                  {insp.status === "Completed" ? "Reopen" : "Mark done"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
