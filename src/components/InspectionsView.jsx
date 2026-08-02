import React, { useState, useEffect } from "react";
import { ChevronLeft, Plus, X, Loader2 } from "lucide-react";
import MinerviumLogo from "./MinerviumLogo";
import BackgroundWatermark from "./BackgroundWatermark";
import { supabase } from "../supabaseClient";

/* Mobile Inspections — same real `inspections` table as the desktop
   version (schema_add_inspections.sql). Lets field staff schedule an
   inspection and mark it done from their phone, not just from a
   computer. Kept intentionally simple, matching the desktop feature
   set: title, location, date, notes, status toggle. */
export default function InspectionsView({ profile, setView, showToast }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: "", location: "", scheduled_date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function loadInspections() {
    setLoading(true);
    const { data, error } = await supabase.from("inspections").select("*").order("scheduled_date", { ascending: true });
    if (!error) setInspections(data || []);
    else showToast("Couldn't load inspections");
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

  return (
    <div className="min-h-screen bg-[#08131D] font-sans relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto pb-28 relative z-10 px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setView("home")} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-slate-300">
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <MinerviumLogo size={40} showWordmark={false} showTagline={false} />
            <span className="text-teal-400 text-xs font-bold tracking-widest uppercase">Inspections</span>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300"
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>

        {showForm && (
          <div className="bg-[#0d1b26] border border-slate-800 rounded-2xl p-4 mb-5 space-y-3">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Inspection title"
              className="w-full rounded-lg border border-slate-700 bg-[#08131D] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="Location / Area"
              className="w-full rounded-lg border border-slate-700 bg-[#08131D] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="date"
              value={draft.scheduled_date}
              onChange={(e) => setDraft({ ...draft, scheduled_date: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#08131D] text-white px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-[#08131D] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <button
              onClick={handleCreate}
              disabled={saving}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Inspection
            </button>
          </div>
        )}

        <div className="bg-[#0d1b26] border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
          ) : inspections.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No inspections scheduled yet.</div>
          ) : (
            inspections.map((insp, i) => (
              <div
                key={insp.id}
                className={`flex items-center justify-between px-4 py-3.5 ${i !== inspections.length - 1 ? "border-b border-slate-800" : ""}`}
              >
                <div className="min-w-0">
                  <div className="text-white text-[14px] font-semibold truncate">{insp.title}</div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    {insp.location || "No location"} · {insp.scheduled_date || "No date"}
                  </div>
                </div>
                <button
                  onClick={() => toggleStatus(insp)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ml-2 flex-shrink-0 ${
                    insp.status === "Completed" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                  }`}
                >
                  {insp.status}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
