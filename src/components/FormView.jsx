import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Sparkles as SparklesIcon } from "lucide-react";
import {
  X, Check, ChevronLeft, ChevronRight, Camera, Image as ImageIcon,
  AlertTriangle, MapPin, Loader2, ClipboardList,
} from "lucide-react";
import {
  REPORT_TYPES, HAZARD_CLASSES, LIFE_SAVING_RULE, LIFE_SAVING_RULE_TYPES, TRACKING_TYPES, RISK_RATINGS, CONTRIBUTING_FACTORS,
  PROJECT_OPTIONS, COMPANY_OPTIONS_BY_PROJECT, SUBCONTRACTOR_OPTIONS, SITE_OPTIONS, BUILDING_OPTIONS_BY_SITE,
  emptyReportForm, compressImage, getGpsPosition, riskBarInfo, resolveCompanyName,
} from "../lib/constants";
import BackgroundWatermark from "./BackgroundWatermark";
import BuildingPlanPicker from "./BuildingPlanPicker";
import AiAssistButton from "./AiAssistButton";
import { planForLocation } from "../lib/constants";

const STEPS = ["Photo", "Type & Location", "Site Map", "Description", "Classification", "Corrective Action", "Review"];

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={18} className="text-teal-400" />}
      <h2 className="text-[15px] font-semibold tracking-wide text-white uppercase">{children}</h2>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label} {required && <span className="text-teal-400">*</span>}
      </span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-[#08131D] px-3 py-2.5 text-[15px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, required, disabled, placeholder = "— Select —" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label} {required && <span className="text-teal-400">*</span>}
      </span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0d1b26] px-3 py-2.5 text-[15px] text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, required, rows = 4 }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label} {required && <span className="text-teal-400">*</span>}
      </span>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-[#08131D] px-3 py-2.5 text-[15px] text-white placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
      />
    </label>
  );
}

function CheckPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left flex items-center gap-2
        ${active ? "bg-teal-500 border-teal-500 text-white shadow-sm" : "bg-[#0d1b26] border-slate-700 text-slate-200 hover:border-teal-400"}`}
    >
      <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 ${active ? "bg-white border-white" : "border-slate-600"}`}>
        {active && <Check size={12} strokeWidth={3} className="text-teal-500" />}
      </span>
      {label}
    </button>
  );
}

function MultiSelectGrid({ options, selected, onToggle, columns = 2 }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {options.map((opt) => (
        <CheckPill key={opt} label={opt} active={selected.includes(opt)} onClick={() => onToggle(opt)} />
      ))}
    </div>
  );
}

function RiskBar({ riskRatingKey }) {
  if (!riskRatingKey) return null;
  const info = riskBarInfo(riskRatingKey);
  return (
    <div className="rounded-xl overflow-hidden border border-slate-800">
      <div className="px-4 py-2.5 flex items-center justify-between text-white font-bold text-sm tracking-wide" style={{ backgroundColor: info.color }}>
        <span>{info.barLabel}</span>
        <span className="font-semibold text-xs opacity-90">{riskRatingKey}</span>
      </div>
    </div>
  );
}

function PhotoCapture({ photoDataUrl, onCapture, onClear }) {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [compressing, setCompressing] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result);
      setCompressing(false);
      onCapture(compressed);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  if (compressing) {
    return (
      <div className="w-full h-64 rounded-xl border border-slate-800 bg-[#08131D] flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm font-medium">Optimizing photo…</span>
      </div>
    );
  }

  if (photoDataUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
        <img src={photoDataUrl} alt="Site condition" className="w-full h-64 object-cover" />
        <button onClick={onClear} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => cameraInputRef.current?.click()} className="h-40 rounded-xl border-2 border-dashed border-slate-700 bg-[#08131D] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-teal-400 hover:bg-teal-500/5 transition-colors">
          <div className="w-12 h-12 rounded-full bg-teal-500/15 flex items-center justify-center">
            <Camera size={22} className="text-teal-400" />
          </div>
          <div className="text-center px-2">
            <div className="font-semibold text-slate-200 text-sm">Take photo</div>
            <div className="text-xs text-slate-500 mt-0.5">Use camera</div>
          </div>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="h-40 rounded-xl border-2 border-dashed border-slate-700 bg-[#08131D] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-teal-400 hover:bg-teal-500/5 transition-colors">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
            <ImageIcon size={22} className="text-slate-300" />
          </div>
          <div className="text-center px-2">
            <div className="font-semibold text-slate-200 text-sm">Attach photo</div>
            <div className="text-xs text-slate-500 mt-0.5">From gallery / files</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// Shrinks the photo before sending it to the AI — it doesn't need full resolution
// and a smaller upload is much quicker on a phone connection.
function downscaleForAi(dataUrl, max = 768) {
  return new Promise((resolve) => {
    if (!dataUrl) return resolve(null);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

const aiContext = (d) => ({
  report_type: d.report_type, site: d.site, location: d.location,
  subcontractor: d.subcontractor === "Others" ? d.subcontractor_other : d.subcontractor,
  hazard_classes: d.hazard_classes, life_saving_rules: d.life_saving_rules, tracking_types: d.tracking_types,
  risk_rating: d.risk_rating, safety_concern: d.safety_concern, description: d.description, corrective_action: d.corrective_action,
});

function SiteMapPicker({ siteMapUrl, pin, onPinChange, gpsStatus }) {
  const imgRef = useRef(null);

  function handleTap(e) {
    const rect = imgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    onPinChange({ x, y });
  }

  if (!siteMapUrl) {
    return (
      <div className="w-full h-44 rounded-xl border-2 border-dashed border-slate-700 bg-[#08131D] flex flex-col items-center justify-center gap-2 text-slate-500">
        <MapPin size={26} />
        <div className="text-center px-4">
          <div className="font-semibold text-slate-200 text-sm">No site map uploaded yet</div>
          <div className="text-xs text-slate-500 mt-0.5">Add one from Settings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-slate-700 select-none touch-none cursor-crosshair" onClick={handleTap}>
        <img ref={imgRef} src={siteMapUrl} alt="Site map" className="w-full h-auto block" draggable={false} />
        {pin && (
          <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none" style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}>
            <MapPin size={32} className="text-red-600 drop-shadow-md" fill="#dc2626" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{pin ? "Tap the map to move the pin" : "Tap the map to mark the exact spot"}</span>
        {gpsStatus === "locating" && <span className="text-teal-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Locating…</span>}
        {gpsStatus === "located" && <span className="text-emerald-400">GPS pin placed — adjust if needed</span>}
      </div>
    </div>
  );
}

export default function FormView({ profile, siteMapUrl, saveReport, setView, showToast, setPendingSendReport, subcontractors = [] }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => {
    const fresh = emptyReportForm();
    fresh.respondent = profile.my_name || "";
    fresh.company = profile.my_company || "";
    return fresh;
  });
  const [gpsStatus, setGpsStatus] = useState("idle");
  // First AI draft of Description + Safety Concern (built from the photo and the
  // report details). status: idle | loading | ready | off | error. Nothing moves on
  // until the person confirms or edits it.
  const [aiDraft, setAiDraft] = useState({ status: "idle", confirmed: false, key: "" });
  const [brief, setBrief] = useState(""); // the person's 3–5 word summary of the issue
  const [saving, setSaving] = useState(false);

  function toggleInArray(arr, val) {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  async function locateGps() {
    setGpsStatus("locating");
    const pos = await getGpsPosition();
    if (pos) {
      setDraft((d) => ({ ...d, gps: pos, map_pin: d.map_pin || { x: 0.5, y: 0.5 } }));
      setGpsStatus("located");
    } else {
      setGpsStatus("unavailable");
    }
  }

  const aiRun = useRef(0); // lets "Skip" / a newer run cancel an older one

  async function runAiDraft(key, { force = false } = {}) {
    const myRun = ++aiRun.current;
    const stale = () => aiRun.current !== myRun;
    setAiDraft({ status: "loading", confirmed: false, key });
    try {
      // Text only (the person's few words + the report details): much faster than sending a photo.
      const call = supabase.functions.invoke("ai-assist", {
        body: { mode: "draft", context: { ...aiContext(draft), brief: brief.trim() } },
      });
      // Never leave the spinner hanging: give up after 25 s and offer a retry.
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 25000));
      const { data, error } = await Promise.race([call, timeout]);
      if (stale()) return;
      if (error || data?.error || !data?.description) {
        // A non-2xx reply comes back as `error` with the JSON body on error.context.
        let code = data?.error;
        if (!code && error?.context?.json) { try { code = (await error.context.json())?.error; } catch { /* ignore */ } }
        if (stale()) return;
        setAiDraft({ status: code === "not_configured" ? "off" : "error", confirmed: false, key });
        return;
      }
      setDraft((d) => (!force && (d.description.trim() || d.safety_concern.trim())
        ? d
        : { ...d, description: data.description, safety_concern: data.safety_concern || "", ai_generated: true }));
      setAiDraft({ status: "ready", confirmed: false, key });
    } catch {
      if (!stale()) setAiDraft({ status: "error", confirmed: false, key });
    }
  }

  function skipAiDraft() {
    aiRun.current += 1; // ignore whatever comes back
    setAiDraft((s) => ({ ...s, status: "idle", confirmed: true }));
  }

  // Editing either box counts as reviewing the draft.
  const editField = (field, v) => {
    setDraft({ ...draft, [field]: v });
    if (aiDraft.status === "ready" && !aiDraft.confirmed) setAiDraft((s) => ({ ...s, confirmed: true }));
  };

  const canNext = () => {
    if (step === 1) {
      const baseValid = draft.project.trim().length > 0 && draft.company.trim().length > 0 && draft.site.trim().length > 0 && draft.location.trim().length > 0;
      if (!baseValid) return false;
      if (draft.company === "Subcontractor") {
        if (!draft.company_subcontractor) return false;
        if (draft.company_subcontractor === "Others" && !draft.company_subcontractor_other.trim()) return false;
      }
      if (draft.company === "Visitor" && !draft.company_visitor_name.trim()) return false;
      return true;
    }
    if (step === 3) return draft.description.trim().length > 0 && !(aiDraft.status === "ready" && !aiDraft.confirmed) && aiDraft.status !== "loading";
    return true;
  };

  async function handleSave() {
    setSaving(true);
    // Resolve the cascading Company selection (Connect6ix / Metrolinx /
    // Subcontractor → specific sub / Visitor → typed name) down to a
    // single final display name before saving, so the database and
    // downstream Word/email exports don't need new columns — they just
    // see the resolved company name like they always have.
    const { company_subcontractor, company_subcontractor_other, company_visitor_name, ...rest } = draft;
    const payload = { ...rest, company: resolveCompanyName(draft), site_map_snapshot: draft.map_pin ? siteMapUrl : null, building_pin: planForLocation(draft.location) ? draft.building_pin || null : null };
    const saved = await saveReport(payload);
    setSaving(false);
    if (saved) {
      showToast("Report saved");
      if ((profile.distribution_list && profile.distribution_list.trim()) || profile.email) {
        setPendingSendReport(saved);
        setView("send");
      } else {
        setView("log");
      }
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <SectionTitle icon={Camera}>Photo</SectionTitle>
            <PhotoCapture
              photoDataUrl={draft.photo_data_url}
              onCapture={(d) => setDraft({ ...draft, photo_data_url: d })}
              onClear={() => setDraft({ ...draft, photo_data_url: null })}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <SectionTitle icon={ClipboardList}>Report Type</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((t) => (
                <CheckPill key={t} label={t} active={draft.report_type === t} onClick={() => setDraft({ ...draft, report_type: t })} />
              ))}
            </div>
            <SectionTitle icon={MapPin}>Location & People</SectionTitle>
            <div className="space-y-4">
              <SelectField
                label="Project"
                required
                value={draft.project}
                onChange={(v) => setDraft({ ...draft, project: v, company: "" })}
                options={PROJECT_OPTIONS}
              />

              <SelectField
                label="Company"
                required
                value={draft.company}
                onChange={(v) => setDraft({ ...draft, company: v, company_subcontractor: "", company_subcontractor_other: "", company_visitor_name: "" })}
                options={COMPANY_OPTIONS_BY_PROJECT[draft.project] || []}
                disabled={!draft.project}
                placeholder={draft.project ? "— Select —" : "Select a project first"}
              />

              {draft.company === "Subcontractor" && (
                <SelectField
                  label="Subcontractor"
                  required
                  value={draft.company_subcontractor}
                  onChange={(v) => setDraft({ ...draft, company_subcontractor: v, company_subcontractor_other: "" })}
                  options={SUBCONTRACTOR_OPTIONS}
                />
              )}
              {draft.company === "Subcontractor" && draft.company_subcontractor === "Others" && (
                <TextField
                  label="Subcontractor Name"
                  required
                  value={draft.company_subcontractor_other}
                  onChange={(v) => setDraft({ ...draft, company_subcontractor_other: v })}
                  placeholder="Enter subcontractor name"
                />
              )}
              {draft.company === "Visitor" && (
                <TextField
                  label="Visitor Company Name"
                  required
                  value={draft.company_visitor_name}
                  onChange={(v) => setDraft({ ...draft, company_visitor_name: v })}
                  placeholder="Enter visitor's company name"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Site"
                  required
                  value={draft.site}
                  onChange={(v) => setDraft({ ...draft, site: v, location: "" })}
                  options={SITE_OPTIONS}
                />
                <TextField label="Respondent" value={draft.respondent} onChange={(v) => setDraft({ ...draft, respondent: v })} />
              </div>

              {draft.site && BUILDING_OPTIONS_BY_SITE[draft.site] ? (
                <SelectField
                  label="Location / Building"
                  required
                  value={draft.location}
                  onChange={(v) => setDraft({ ...draft, location: v })}
                  options={BUILDING_OPTIONS_BY_SITE[draft.site]}
                />
              ) : (
                <TextField
                  label="Location / Area"
                  required
                  value={draft.location}
                  onChange={(v) => setDraft({ ...draft, location: v })}
                  placeholder={draft.site ? "e.g. Bay 3 pedestrian walkway" : "Select a site first"}
                />
              )}

              <TextField label="Report Date" type="date" value={draft.report_date} onChange={(v) => setDraft({ ...draft, report_date: v })} />

              <label className="block">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Report To (Subcontractor)</span>
                <select
                  value={draft.action_report_to || ""}
                  onChange={(e) => setDraft({ ...draft, action_report_to: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 px-3 py-2.5 text-[15px] text-white bg-[#0d1b26] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                >
                  <option value="">— Select —</option>
                  {subcontractors.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Their contact emails will be added automatically alongside your base distribution list.
                  {subcontractors.length === 0 && " No subcontractors added yet — add them in Settings → Subcontractor Contacts."}
                </p>
              </label>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <SectionTitle icon={MapPin}>Mark the Location</SectionTitle>
            {!draft.gps && gpsStatus !== "locating" && (
              <button onClick={locateGps} className="w-full flex items-center justify-center gap-2 bg-[#0d1b26] border border-teal-500/30 text-teal-400 font-semibold text-sm py-2.5 rounded-xl">
                <MapPin size={16} /> Use my current GPS location
              </button>
            )}
            <SiteMapPicker siteMapUrl={siteMapUrl} pin={draft.map_pin} onPinChange={(pin) => setDraft({ ...draft, map_pin: pin })} gpsStatus={gpsStatus} />
            <BuildingPlanPicker plan={planForLocation(draft.location)} pin={draft.building_pin} onPinChange={(pin) => setDraft({ ...draft, building_pin: pin })} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <SectionTitle icon={AlertTriangle}>Description</SectionTitle>
            <div className="rounded-xl border border-teal-500/30 bg-[#0d1b26] p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-400">
                <SparklesIcon size={13} /> What's the issue? A few words is enough
              </div>
              <div className="flex gap-2">
                <input
                  value={brief}
                  onChange={(e) => setBrief(e.target.value.slice(0, 120))}
                  onKeyDown={(e) => { if (e.key === "Enter" && brief.trim().length >= 3 && aiDraft.status !== "loading") runAiDraft(aiDraft.key, { force: true }); }}
                  placeholder="e.g. cables across walkway"
                  enterKeyHint="go"
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-[#08131D] border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
                <button type="button" disabled={brief.trim().length < 3 || aiDraft.status === "loading"}
                  onClick={() => runAiDraft(aiDraft.key, { force: true })}
                  className="px-3 py-2.5 rounded-lg bg-teal-500 text-slate-900 text-sm font-bold flex items-center gap-1.5 disabled:opacity-40">
                  <SparklesIcon size={14} /> Write it
                </button>
              </div>
            </div>
            {aiDraft.status === "loading" && (
              <div className="rounded-xl border border-teal-500/30 bg-[#0d1b26] p-3 text-sm text-teal-300 flex items-center gap-2">
                <Loader2 size={15} className="animate-spin shrink-0" />
                <span className="flex-1">Writing it up…</span>
                <button type="button" onClick={skipAiDraft} className="underline text-slate-300 shrink-0">Skip</button>
              </div>
            )}
            {aiDraft.status === "ready" && (
              <div className="rounded-xl border border-teal-500/40 bg-[#0d1b26] p-3 space-y-2" style={{ animation: "minervium-slide-in 0.28s ease-out" }}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-400">
                  <SparklesIcon size={13} /> AI first draft
                </div>
                <div className="text-sm text-slate-200">
                  {aiDraft.confirmed
                    ? "Draft confirmed — you can keep editing the boxes below."
                    : "I filled in Description and Safety Concern from your photo and report type. Read them, change anything that's wrong, then confirm to continue."}
                </div>
                {!aiDraft.confirmed && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setAiDraft((s) => ({ ...s, confirmed: true }))}
                      className="px-3 py-2 rounded-lg bg-teal-500 text-slate-900 text-sm font-bold flex items-center gap-1.5">
                      <Check size={14} /> Looks good — confirm
                    </button>
                    <button type="button" onClick={() => runAiDraft(aiDraft.key, { force: true })}
                      className="px-3 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm">Regenerate</button>
                    <button type="button" onClick={() => { setDraft({ ...draft, description: "", safety_concern: "" }); setAiDraft((s) => ({ ...s, status: "idle", confirmed: true })); }}
                      className="px-3 py-2 rounded-lg border border-slate-600 text-slate-400 text-sm">Clear &amp; write myself</button>
                  </div>
                )}
              </div>
            )}
            {aiDraft.status === "off" && (
              <div className="rounded-xl border border-amber-500/30 bg-[#0d1b26] p-3 text-xs text-amber-300">
                AI help isn't switched on yet — ask the admin. You can still write the description yourself.
              </div>
            )}
            {aiDraft.status === "error" && (
              <div className="rounded-xl border border-amber-500/30 bg-[#0d1b26] p-3 text-xs text-amber-300 flex items-center justify-between gap-2">
                <span>Couldn't prepare a draft — write it yourself, or try again.</span>
                <button type="button" onClick={() => runAiDraft(aiDraft.key)} className="underline">Retry</button>
              </div>
            )}
            <TextArea label="Description" required rows={5} value={draft.description} onChange={(v) => editField("description", v)} />
            {draft.description.trim().length >= 5 && (
              <AiAssistButton mode="description" canRun label="Improve my text"
                context={aiContext(draft)} onUse={(t) => setDraft({ ...draft, description: t, ai_generated: true })} />
            )}
            <SelectField
              label="Subcontractor"
              value={draft.subcontractor}
              onChange={(v) => setDraft({ ...draft, subcontractor: v, subcontractor_other: "" })}
              options={SUBCONTRACTOR_OPTIONS}
              placeholder="Select subcontractor…"
            />
            {draft.subcontractor === "Others" && (
              <TextField
                label="Subcontractor Name"
                value={draft.subcontractor_other}
                onChange={(v) => setDraft({ ...draft, subcontractor_other: v })}
                placeholder="Enter subcontractor name"
              />
            )}
            <TextArea label="Safety Concern" rows={5} value={draft.safety_concern} onChange={(v) => editField("safety_concern", v)} />
          </div>
        );
      case 4:
        return (
          <div className="space-y-7">
            <div>
              <SectionTitle>Hazard Classification</SectionTitle>
              <MultiSelectGrid options={HAZARD_CLASSES} selected={draft.hazard_classes} onToggle={(v) => {
                const next = toggleInArray(draft.hazard_classes, v);
                // Dropping Life-Saving Rule also drops its sub-selection.
                setDraft({ ...draft, hazard_classes: next, life_saving_rules: next.includes(LIFE_SAVING_RULE) ? (draft.life_saving_rules || []) : [] });
              }} />
              {draft.hazard_classes.includes(LIFE_SAVING_RULE) && (
                <div className="mt-4 rounded-xl border border-teal-500/30 bg-[#0d1b26] p-3" style={{ animation: "minervium-slide-in 0.28s ease-out" }}>
                  <div className="text-xs font-semibold text-teal-400 mb-2">Which Life-Saving Rule?</div>
                  <MultiSelectGrid options={LIFE_SAVING_RULE_TYPES} selected={draft.life_saving_rules || []} onToggle={(v) => setDraft({ ...draft, life_saving_rules: toggleInArray(draft.life_saving_rules || [], v) })} />
                </div>
              )}
            </div>
            <div>
              <SectionTitle>Tracking Type</SectionTitle>
              <MultiSelectGrid options={TRACKING_TYPES} selected={draft.tracking_types} onToggle={(v) => setDraft({ ...draft, tracking_types: toggleInArray(draft.tracking_types, v) })} />
            </div>
            <div>
              <SectionTitle>Risk Rating</SectionTitle>
              <div className="space-y-2">
                {RISK_RATINGS.map((r) => (
                  <button key={r.key} onClick={() => setDraft({ ...draft, risk_rating: r.key })}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${draft.risk_rating === r.key ? "bg-teal-500 border-teal-500 text-white" : "bg-[#0d1b26] border-slate-700 text-slate-200 hover:border-teal-400"}`}>
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className={`text-xs ${draft.risk_rating === r.key ? "text-teal-50" : "text-slate-500"}`}>{r.sub}</div>
                  </button>
                ))}
              </div>
              {draft.risk_rating && <div className="mt-3"><RiskBar riskRatingKey={draft.risk_rating} /></div>}
            </div>
            <div>
              <SectionTitle>Contributing Factors</SectionTitle>
              <MultiSelectGrid options={CONTRIBUTING_FACTORS} selected={draft.contributing_factors} onToggle={(v) => setDraft({ ...draft, contributing_factors: toggleInArray(draft.contributing_factors, v) })} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <SectionTitle>Corrective Action</SectionTitle>
              <div className="space-y-3">
                <TextArea label="Corrective Action" rows={4} value={draft.corrective_action} onChange={(v) => setDraft({ ...draft, corrective_action: v })} />
                <AiAssistButton mode="corrective" label="Suggest a corrective action" canRun
                  context={aiContext(draft)} onUse={(t) => setDraft({ ...draft, corrective_action: t, ai_generated: true })} />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Action Owner" value={draft.corrective_action_owner} onChange={(v) => setDraft({ ...draft, corrective_action_owner: v })} />
                  <TextField label="Close Out Date" type="date" value={draft.corrective_close_out_date} onChange={(v) => setDraft({ ...draft, corrective_close_out_date: v })} />
                </div>
              </div>
            </div>
            <div>
              <SectionTitle>Preventative Action</SectionTitle>
              <div className="space-y-3">
                <TextArea label="Preventative Action" rows={4} value={draft.preventative_action} onChange={(v) => setDraft({ ...draft, preventative_action: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Action Owner" value={draft.preventative_action_owner} onChange={(v) => setDraft({ ...draft, preventative_action_owner: v })} />
                  <TextField label="Close Out Date" type="date" value={draft.preventative_close_out_date} onChange={(v) => setDraft({ ...draft, preventative_close_out_date: v })} />
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <RiskBar riskRatingKey={draft.risk_rating} />
            {draft.photo_data_url && <img src={draft.photo_data_url} className="w-full h-48 object-cover rounded-xl border border-slate-800" />}
            <div className="bg-[#0d1b26] rounded-xl border border-slate-800 px-4 py-1">
              {[
                ["Type", draft.report_type],
                ["Project", draft.project],
                ["Company", resolveCompanyName(draft)],
                ["Subcontractor", draft.subcontractor === "Others" ? draft.subcontractor_other : draft.subcontractor],
                ["Site / Location", `${draft.site} — ${draft.location}`],
                ["Description", draft.description],
                ["Safety Concern", draft.safety_concern],
                ["Hazard Classification", draft.hazard_classes.join(", ")],
                ...((draft.life_saving_rules || []).length ? [["Life-Saving Rule Type", draft.life_saving_rules.join(", ")]] : []),
                ["Risk Rating", draft.risk_rating],
                ["Corrective Action", draft.corrective_action],
                ["Preventative Action", draft.preventative_action],
              ].map(([label, value]) => value ? (
                <div key={label} className="py-2 border-b border-slate-800 last:border-0">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
                  <div className="text-sm text-white mt-0.5 whitespace-pre-wrap">{value}</div>
                </div>
              ) : null)}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#08131D] font-sans relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto pb-28 relative z-10">
        <header className="sticky top-0 bg-[#0d1b26] border-b border-slate-800 px-4 py-3 z-10">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setView("log")} className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-800 text-slate-300">
              <X size={20} />
            </button>
            <h1 className="font-semibold text-white">{STEPS[step]}</h1>
            <span className="ml-auto text-xs text-slate-500 font-medium">{step + 1} / {STEPS.length}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </header>
        <div className="p-4">{renderStep()}</div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d1b26] border-t border-slate-800 p-4 z-10">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold flex items-center gap-1">
              <ChevronLeft size={18} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}
              className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-1">
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-stone-800 hover:bg-stone-900 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {saving ? "Saving…" : "Save Report"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
