import React, { useState, useRef } from "react";
import {
  X, Check, ChevronLeft, ChevronRight, Camera, Image as ImageIcon,
  AlertTriangle, MapPin, Loader2, ClipboardList,
} from "lucide-react";
import {
  REPORT_TYPES, HAZARD_CLASSES, TRACKING_TYPES, RISK_RATINGS, CONTRIBUTING_FACTORS,
  emptyReportForm, compressImage, getGpsPosition, riskBarInfo,
} from "../lib/constants";

const STEPS = ["Photo", "Type & Location", "Site Map", "Description", "Classification", "Corrective Action", "Review"];

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={18} className="text-teal-600" />}
      <h2 className="text-[15px] font-semibold tracking-wide text-stone-800 uppercase">{children}</h2>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
        {label} {required && <span className="text-teal-600">*</span>}
      </span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-[15px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, required, rows = 4 }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
        {label} {required && <span className="text-teal-600">*</span>}
      </span>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-[15px] text-stone-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
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
        ${active ? "bg-teal-500 border-teal-500 text-white shadow-sm" : "bg-white border-stone-300 text-stone-700 hover:border-teal-400"}`}
    >
      <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 ${active ? "bg-white border-white" : "border-stone-400"}`}>
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
    <div className="rounded-xl overflow-hidden border border-stone-200">
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
      <div className="w-full h-64 rounded-xl border border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-2 text-stone-400">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm font-medium">Optimizing photo…</span>
      </div>
    );
  }

  if (photoDataUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-stone-300 bg-stone-100">
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
        <button onClick={() => cameraInputRef.current?.click()} className="h-40 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center gap-2 text-stone-500 hover:border-teal-400 hover:bg-teal-50/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
            <Camera size={22} className="text-teal-600" />
          </div>
          <div className="text-center px-2">
            <div className="font-semibold text-stone-700 text-sm">Take photo</div>
            <div className="text-xs text-stone-400 mt-0.5">Use camera</div>
          </div>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="h-40 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center gap-2 text-stone-500 hover:border-teal-400 hover:bg-teal-50/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center">
            <ImageIcon size={22} className="text-stone-600" />
          </div>
          <div className="text-center px-2">
            <div className="font-semibold text-stone-700 text-sm">Attach photo</div>
            <div className="text-xs text-stone-400 mt-0.5">From gallery / files</div>
          </div>
        </button>
      </div>
    </div>
  );
}

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
      <div className="w-full h-44 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center gap-2 text-stone-400">
        <MapPin size={26} />
        <div className="text-center px-4">
          <div className="font-semibold text-stone-700 text-sm">No site map uploaded yet</div>
          <div className="text-xs text-stone-400 mt-0.5">Add one from Settings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-stone-300 select-none touch-none cursor-crosshair" onClick={handleTap}>
        <img ref={imgRef} src={siteMapUrl} alt="Site map" className="w-full h-auto block" draggable={false} />
        {pin && (
          <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none" style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}>
            <MapPin size={32} className="text-red-600 drop-shadow-md" fill="#dc2626" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-stone-400">{pin ? "Tap the map to move the pin" : "Tap the map to mark the exact spot"}</span>
        {gpsStatus === "locating" && <span className="text-teal-600 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Locating…</span>}
        {gpsStatus === "located" && <span className="text-emerald-600">GPS pin placed — adjust if needed</span>}
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

  const canNext = () => {
    if (step === 1) return draft.location.trim().length > 0;
    if (step === 3) return draft.description.trim().length > 0;
    return true;
  };

  async function handleSave() {
    setSaving(true);
    const payload = { ...draft, site_map_snapshot: draft.map_pin ? siteMapUrl : null };
    const saved = await saveReport(payload);
    setSaving(false);
    if (saved) {
      showToast("Report saved");
      if (profile.distribution_list && profile.distribution_list.trim()) {
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
              <TextField label="Location / Area" required value={draft.location} onChange={(v) => setDraft({ ...draft, location: v })} placeholder="e.g. Bay 3 pedestrian walkway" />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Respondent" value={draft.respondent} onChange={(v) => setDraft({ ...draft, respondent: v })} />
                <TextField label="Company" value={draft.company} onChange={(v) => setDraft({ ...draft, company: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Project" value={draft.project} onChange={(v) => setDraft({ ...draft, project: v })} />
                <TextField label="Report Date" type="date" value={draft.report_date} onChange={(v) => setDraft({ ...draft, report_date: v })} />
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Report To (Subcontractor)</span>
                <select
                  value={draft.action_report_to || ""}
                  onChange={(e) => setDraft({ ...draft, action_report_to: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-[15px] text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                >
                  <option value="">— Select —</option>
                  {subcontractors.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <p className="text-xs text-stone-400 mt-1">
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
              <button onClick={locateGps} className="w-full flex items-center justify-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 font-semibold text-sm py-2.5 rounded-xl">
                <MapPin size={16} /> Use my current GPS location
              </button>
            )}
            <SiteMapPicker siteMapUrl={siteMapUrl} pin={draft.map_pin} onPinChange={(pin) => setDraft({ ...draft, map_pin: pin })} gpsStatus={gpsStatus} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <SectionTitle icon={AlertTriangle}>Description</SectionTitle>
            <TextArea label="Description" required rows={5} value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />
            <TextArea label="Safety Concern" rows={5} value={draft.safety_concern} onChange={(v) => setDraft({ ...draft, safety_concern: v })} />
          </div>
        );
      case 4:
        return (
          <div className="space-y-7">
            <div>
              <SectionTitle>Hazard Classification</SectionTitle>
              <MultiSelectGrid options={HAZARD_CLASSES} selected={draft.hazard_classes} onToggle={(v) => setDraft({ ...draft, hazard_classes: toggleInArray(draft.hazard_classes, v) })} />
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
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${draft.risk_rating === r.key ? "bg-teal-500 border-teal-500 text-white" : "bg-white border-stone-300 hover:border-teal-400"}`}>
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className={`text-xs ${draft.risk_rating === r.key ? "text-teal-50" : "text-stone-400"}`}>{r.sub}</div>
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
            {draft.photo_data_url && <img src={draft.photo_data_url} className="w-full h-48 object-cover rounded-xl border border-stone-200" />}
            <div className="bg-white rounded-xl border border-stone-200 px-4 py-1">
              {[
                ["Type", draft.report_type],
                ["Location", `${draft.project} — ${draft.location}`],
                ["Description", draft.description],
                ["Safety Concern", draft.safety_concern],
                ["Hazard Classification", draft.hazard_classes.join(", ")],
                ["Risk Rating", draft.risk_rating],
                ["Corrective Action", draft.corrective_action],
                ["Preventative Action", draft.preventative_action],
              ].map(([label, value]) => value ? (
                <div key={label} className="py-2 border-b border-stone-100 last:border-0">
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</div>
                  <div className="text-sm text-stone-800 mt-0.5 whitespace-pre-wrap">{value}</div>
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
    <div className="min-h-screen bg-stone-100 font-sans">
      <div className="max-w-md mx-auto pb-28">
        <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 z-10">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setView("log")} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
              <X size={20} />
            </button>
            <h1 className="font-semibold text-stone-800">{STEPS[step]}</h1>
            <span className="ml-auto text-xs text-stone-400 font-medium">{step + 1} / {STEPS.length}</span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </header>
        <div className="p-4">{renderStep()}</div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="px-4 py-3 rounded-xl border border-stone-300 text-stone-600 font-semibold flex items-center gap-1">
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
