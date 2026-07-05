import React, { useState, useRef } from "react";
import { ChevronLeft, User, Send, MapPin, Check, LogOut, Loader2 } from "lucide-react";
import { compressImage } from "../lib/constants";

function TextField({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
        {label} {required && <span className="text-amber-600">*</span>}
      </span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-[15px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</span>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-[15px] text-stone-800 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      />
    </label>
  );
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={18} className="text-amber-600" />}
      <h2 className="text-[15px] font-semibold tracking-wide text-stone-800 uppercase">{children}</h2>
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
        className="w-full flex items-center justify-center gap-2 border border-stone-300 text-stone-600 font-semibold text-sm py-2.5 rounded-lg disabled:opacity-60">
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
    <div className="min-h-screen bg-stone-100 font-sans">
      <div className="max-w-md mx-auto pb-10">
        <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView("log")} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-semibold text-stone-800">Settings</h1>
        </header>

        <div className="p-4 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
            <SectionTitle icon={User}>Your Details</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Full Name" value={draft.my_name} onChange={(v) => setDraft({ ...draft, my_name: v })} required />
              <TextField label="Position" value={draft.my_position} onChange={(v) => setDraft({ ...draft, my_position: v })} placeholder="Senior Manager" />
            </div>
            <TextField label="Company" value={draft.my_company} onChange={(v) => setDraft({ ...draft, my_company: v })} placeholder="Webuild" />
            <p className="text-xs text-stone-400 -mt-1">Auto-fills into every new report so you don't retype it.</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
            <SectionTitle icon={Send}>Distribution List</SectionTitle>
            <TextArea label="Send completed reports to" value={draft.distribution_list} onChange={(v) => setDraft({ ...draft, distribution_list: v })} placeholder="safety.manager@company.com, hse.team@company.com" rows={4} />
            <p className="text-xs text-stone-400">Separate multiple emails with commas, semicolons, or new lines.</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
            <SectionTitle icon={MapPin}>Site Map</SectionTitle>
            <p className="text-xs text-stone-400 -mt-2">Shared with the whole team — everyone pins hazard locations on the same site plan.</p>
            {siteMapUrl && <img src={siteMapUrl} className="w-full h-32 object-cover rounded-lg border border-stone-200" />}
            <SiteMapUpload currentUrl={siteMapUrl} onUpload={handleUploadSiteMap} />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-stone-800 hover:bg-stone-900 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Save Settings
          </button>

          <button onClick={handleLogout} className="w-full text-red-600 font-semibold py-2 text-sm flex items-center justify-center gap-2">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
