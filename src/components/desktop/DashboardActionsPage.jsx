import React, { useState, useEffect } from "react";
import { X, Camera } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { supabase } from "../../supabaseClient";
import { compressImage } from "../../lib/constants";

function ageLabel(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function dueLabel(item) {
  if (item.status === "Closed") return { label: `Closed ${ageLabel(item.closed_at)}`, color: "#1FC99B" };
  if (!item.due_date) return { label: "No due date", color: "#8A9198" };
  const overdueDays = Math.floor((Date.now() - new Date(item.due_date).getTime()) / 86400000);
  if (overdueDays > 0) return { label: `Overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`, color: "#E5484D" };
  return { label: `Due in ${-overdueDays} day${-overdueDays === 1 ? "" : "s"}`, color: "#E5A01E" };
}

/* Desktop Actions tracker — backed by the real action_items table
   (see schema_add_action_items.sql). Items are created automatically
   whenever a report includes a Corrective/Preventative Action.
   Closing an item requires a photo, matching the real workflow: the
   assigned sub reviews the report, takes action, and submits proof. */
export default function DashboardActionsPage({ profile, setView, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Open");
  const [closingItem, setClosingItem] = useState(null);
  const [closurePhoto, setClosurePhoto] = useState(null);
  const [closureNotes, setClosureNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase.from("action_items").select("*").order("created_at", { ascending: false });
    if (!error) setItems(data || []);
    else showToast("Couldn't load action items — has the database table been set up?");
    setLoading(false);
  }

  useEffect(() => { loadItems(); }, []);

  const filtered = items.filter((i) => {
    if (filter === "All") return true;
    if (filter === "Overdue") return i.status === "Open" && i.due_date && new Date(i.due_date) < new Date();
    return i.status === filter;
  });

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => setClosurePhoto(await compressImage(reader.result));
    reader.readAsDataURL(file);
  }

  async function submitClosure() {
    if (!closurePhoto) {
      showToast("A photo is required to close out an action item");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("action_items").update({
      status: "Closed",
      closed_at: new Date().toISOString(),
      closure_photo_url: closurePhoto,
      closure_notes: closureNotes,
      closed_by: profile.id,
    }).eq("id", closingItem.id);
    setSaving(false);
    if (error) { showToast("Failed to close item"); return; }
    showToast("Action item closed");
    setClosingItem(null);
    setClosurePhoto(null);
    setClosureNotes("");
    loadItems();
  }

  function handleSidebarNav(key) {
    if (key === "actions") return;
    if (key === "dashboard") setView("home");
    else if (key === "observations") setView("observations-desktop");
    else if (key === "inspections") setView("inspections-desktop");
    else if (key === "reports") setView("stats");
    else if (key === "settings") setView("settings");
    else showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} isn't built yet — coming soon`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08131D", display: "flex", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <DashboardSidebar active="actions" onNavigate={handleSidebarNav} profile={profile} />

      <div style={{ flex: 1, padding: "22px 28px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 650, color: "#F0F4F6" }}>Actions</div>
          <div style={{ fontSize: 12.5, color: "#8997A1", marginTop: 4 }}>
            {items.filter((i) => i.status === "Open").length} open · {items.filter((i) => i.status === "Closed").length} closed
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["Open", "Overdue", "Closed", "All"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                border: "1px solid rgba(121,159,176,0.16)",
                background: filter === f ? "rgba(24,201,203,0.15)" : "#0D1B25",
                color: filter === f ? "#18C9CB" : "#8997A1", cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ background: "#0C1A24", border: "1px solid rgba(126,164,181,0.16)", borderRadius: 14, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#70808B", fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#70808B", fontSize: 13 }}>
              No {filter !== "All" ? filter.toLowerCase() : ""} action items. Corrective/preventative actions added to a report show up here automatically.
            </div>
          ) : (
            filtered.map((item, i) => {
              const due = dueLabel(item);
              return (
                <div
                  key={item.id}
                  style={{
                    display: "grid", gridTemplateColumns: "100px 1fr 130px 120px 140px 100px",
                    alignItems: "center", gap: 14, padding: "14px 18px",
                    borderBottom: i === filtered.length - 1 ? "none" : "1px solid rgba(121,157,173,0.12)",
                  }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "0 8px", height: 22, display: "flex",
                    alignItems: "center", justifyContent: "center", borderRadius: 4,
                    background: item.kind === "Corrective" ? "#246DAE" : "#178F8C", color: "#fff", whiteSpace: "nowrap",
                  }}>
                    {item.kind.toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#E0E6E9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.description}</div>
                    <div style={{ fontSize: 11.5, color: "#8997A0", marginTop: 3 }}>{item.location} · created {ageLabel(item.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#8997A0" }}>{item.subcontractor || item.owner || "Unassigned"}</div>
                  <div style={{ fontSize: 11.5, color: "#70808B" }}>{item.due_date || "—"}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: due.color }}>{due.label}</div>
                  {item.status === "Open" ? (
                    <button
                      onClick={() => setClosingItem(item)}
                      style={{ justifySelf: "end", background: "rgba(24,201,203,0.12)", border: "1px solid rgba(24,201,203,0.3)", color: "#18C9CB", fontSize: 11.5, fontWeight: 600, padding: "6px 12px", borderRadius: 7, cursor: "pointer" }}
                    >
                      Close with proof
                    </button>
                  ) : (
                    item.closure_photo_url && (
                      <img src={item.closure_photo_url} alt="Closure proof" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", justifySelf: "end" }} />
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {closingItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0C1A24", border: "1px solid rgba(126,164,181,0.2)", borderRadius: 16, padding: 24, width: 420, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 650, color: "#F0F4F6" }}>Close Action Item</div>
              <button onClick={() => { setClosingItem(null); setClosurePhoto(null); setClosureNotes(""); }} style={{ background: "none", border: "none", color: "#8997A0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: "#B8C0C6", marginBottom: 16 }}>{closingItem.description}</div>

            <label
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                height: 140, borderRadius: 10, border: "1.5px dashed rgba(24,201,203,0.4)", cursor: "pointer",
                background: closurePhoto ? `url(${closurePhoto}) center/cover` : "transparent", marginBottom: 12,
              }}
            >
              {!closurePhoto && (
                <>
                  <Camera size={22} color="#18C9CB" />
                  <span style={{ fontSize: 12.5, color: "#18C9CB", fontWeight: 600 }}>Upload proof photo (required)</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
            </label>

            <textarea
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              placeholder="Closure notes (optional)"
              rows={3}
              style={{ width: "100%", background: "#08131D", border: "1px solid rgba(121,159,176,0.16)", borderRadius: 10, padding: "10px 12px", color: "#F1F4F5", fontSize: 13, resize: "vertical", marginBottom: 16 }}
            />

            <button
              onClick={submitClosure}
              disabled={saving || !closurePhoto}
              style={{
                width: "100%", height: 42, borderRadius: 9, fontWeight: 650, fontSize: 13.5, border: "none",
                background: closurePhoto ? "linear-gradient(135deg, #1BD5D3, #07949B)" : "#26353D",
                color: closurePhoto ? "#031014" : "#677780", cursor: closurePhoto ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "Submitting…" : "Submit Closure"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
