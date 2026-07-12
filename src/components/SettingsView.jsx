import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, User, Send, MapPin, Check, LogOut, Loader2, Building2 } from "lucide-react";
import { compressImage } from "../lib/constants";

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
        className="mt-1 w-full rounded-lg border border-slate-700 bg-[#050b14] px-3 py-2.5 text-[15px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-[#050b14] px-3 py-2.5 text-[15px] text-white placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
      />
    </label>
  );
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={18} className="text-teal-400" />}
      <h2 className="text-[15px] font-semibold tracking-wide text-white uppercase">{children}</h2>
    </div>
  );
}

function SiteMapUpload({ currentUrl, onUpload }) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result, 1600, 0.8);
      setBusy(false);
      onUpload(compressed);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <button onClick={() => fileInputRef.current?.click()} disabled={busy}
        className="w-full flex items-center justify-center gap-2 border border-slate-700 text-slate-300 font-semibold text-sm py-2.5 rounded-lg disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
        {busy ? "Uploading…" : currentUrl ? "Replace site map" : "Upload site map"}
      </button>
    </div>
  );
}

export default function SettingsView({ profile, siteMapUrl, updateMyProfile, handleUploadSiteMap, handleLogout, setView }) {
  const [draft, setDraft] = useState({
    my_name: profile.my_name || "",
    my_company: profile.my_company || "",
    my_position: profile.my_position || "",
    distribution_list: profile.distribution_list || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateMyProfile(draft);
    setSaving(false);
    setView("log");
  }

  return (
    <div className="min-h-screen bg-[#050b14] font-sans">
      <div className="max-w-md mx-auto pb-10">
        <header className="sticky top-0 bg-[#0b1522] border-b border-slate-800 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView("log")} className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-800 text-slate-300">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-semibold text-white">Settings</h1>
        </header>

        <div className="p-4 space-y-6">
          <div className="bg-[#0b1522] rounded-xl border border-slate-800 p-4 space-y-4">
            <SectionTitle icon={User}>Your Details</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Full Name" value={draft.my_name} onChange={(v) => setDraft({ ...draft, my_name: v })} required />
              <TextField label="Position" value={draft.my_position} onChange={(v) => setDraft({ ...draft, my_position: v })} placeholder="Senior Manager" />
            </div>
            <TextField label="Company" value={draft.my_company} onChange={(v) => setDraft({ ...draft, my_company: v })} placeholder="Webuild" />
            <p className="text-xs text-slate-500 -mt-1">Auto-fills into every new report so you don't retype it.</p>
          </div>

          <div className="bg-[#0b1522] rounded-xl border border-slate-800 p-4 space-y-4">
            <SectionTitle icon={Send}>Distribution List</SectionTitle>
            <TextArea label="Send completed reports to" value={draft.distribution_list} onChange={(v) => setDraft({ ...draft, distribution_list: v })} placeholder="safety.manager@company.com, hse.team@company.com" rows={4} />
            <p className="text-xs text-slate-500">Separate multiple emails with commas, semicolons, or new lines. This is your base list — every report goes here by default.</p>
          </div>

          <button
            onClick={() => setView("contacts")}
            className="w-full flex items-center justify-between gap-3 bg-[#0b1522] border border-slate-800 rounded-xl px-4 py-3.5 text-left hover:border-teal-500/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-teal-400" />
              <div>
                <div className="text-sm font-semibold text-white">Subcontractor Contacts</div>
                <div className="text-xs text-slate-500 mt-0.5">Route reports to the right company automatically</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600" />
          </button>

          <div className="bg-[#0b1522] rounded-xl border border-slate-800 p-4 space-y-3">
            <SectionTitle icon={MapPin}>Site Map</SectionTitle>
            <p className="text-xs text-slate-500 -mt-2">Shared with the whole team — everyone pins hazard locations on the same site plan.</p>
            {siteMapUrl && <img src={siteMapUrl} className="w-full h-32 object-cover rounded-lg border border-slate-800" />}
            <SiteMapUpload currentUrl={siteMapUrl} onUpload={handleUploadSiteMap} />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-60 text-white font-bold tracking-wide py-3 rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Save Settings
          </button>

          <button onClick={handleLogout} className="w-full text-red-400 font-semibold py-2 text-sm flex items-center justify-center gap-2">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
