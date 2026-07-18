import React, { useState } from "react";
import { Send, Check, Loader2, User, Building2 } from "lucide-react";
import MinerviumLogo from "./MinerviumLogo";
import BackgroundWatermark from "./BackgroundWatermark";
import { PROJECT_OPTIONS, COMPANY_OPTIONS_BY_PROJECT, SUBCONTRACTOR_OPTIONS, SITE_OPTIONS, BUILDING_OPTIONS_BY_SITE, DEFAULT_DISTRIBUTION_LIST_BY_SITE } from "../lib/constants";

const fieldClass = "mt-1 w-full rounded-lg border border-slate-700 bg-[#08131D] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500";
const labelClass = "text-xs font-semibold text-slate-400 uppercase tracking-wide";

/* First-time setup, shown once right after signup (and again if any
   of these fields are still empty on login). Collects who the person
   is (position, company) and which project/site they're assigned to,
   in addition to the distribution list this screen already handled. */
export default function OnboardingView({ profile, updateMyProfile, setView, showToast }) {
  const [position, setPosition] = useState(profile.my_position || "");

  // Reconstruct the cascading selection from the previously saved,
  // already-resolved company name (e.g. "GIP" implies Subcontractor →
  // GIP). If it doesn't match a known bucket, treat it as a raw value
  // typed under "Visitor" so nothing is silently lost.
  const savedCompany = profile.my_company || "";
  const topOptions = COMPANY_OPTIONS_BY_PROJECT[profile.assigned_project || PROJECT_OPTIONS[0]] || [];
  let initialCompany = "";
  let initialSub = "";
  let initialSubOther = "";
  let initialVisitor = "";
  if (topOptions.includes(savedCompany)) {
    initialCompany = savedCompany;
  } else if (SUBCONTRACTOR_OPTIONS.includes(savedCompany)) {
    initialCompany = "Subcontractor";
    initialSub = savedCompany;
  } else if (savedCompany) {
    initialCompany = "Subcontractor";
    initialSub = "Others";
    initialSubOther = savedCompany;
  }

  const [company, setCompany] = useState(initialCompany);
  const [subcontractor, setSubcontractor] = useState(initialSub);
  const [subcontractorOther, setSubcontractorOther] = useState(initialSubOther);
  const [visitorName, setVisitorName] = useState(initialVisitor);
  const [project, setProject] = useState(profile.assigned_project || PROJECT_OPTIONS[0] || "");
  const [site, setSite] = useState(profile.assigned_site || "");
  const [building, setBuilding] = useState(profile.assigned_building || "");
  const [distributionList, setDistributionList] = useState(profile.distribution_list || "");
  const [saving, setSaving] = useState(false);

  const companyOptions = COMPANY_OPTIONS_BY_PROJECT[project] || [];
  const buildingOptions = BUILDING_OPTIONS_BY_SITE[site] || [];

  function resolvedCompanyName() {
    if (company === "Subcontractor") return subcontractor === "Others" ? subcontractorOther.trim() : subcontractor;
    if (company === "Visitor") return visitorName.trim();
    return company;
  }

  async function handleContinue() {
    const finalCompany = resolvedCompanyName();
    if (!position.trim() || !finalCompany || !site || !distributionList.trim()) {
      showToast("Please fill in your role, company, site and at least one distribution email");
      return;
    }
    setSaving(true);
    await updateMyProfile({
      my_position: position.trim(),
      my_company: finalCompany,
      assigned_project: project,
      assigned_site: site,
      assigned_building: building,
      distribution_list: distributionList,
    });
    setSaving(false);
    setView("home");
  }

  return (
    <div className="min-h-screen bg-[#08131D] font-sans flex flex-col relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-6 py-10 relative z-10">
        <div className="text-center mb-6">
          <MinerviumLogo size={64} />
          <h1 className="text-xl font-bold text-white mt-4">Welcome to MINERVIUM</h1>
          <p className="text-slate-400 text-sm mt-2 px-4">
            Let's set up your profile and site assignment before your first report.
          </p>
        </div>

        <div className="bg-[#0d1b26] border border-teal-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
            <User size={16} className="text-teal-400" /> About you
          </div>
          <div>
            <label className={labelClass}>Position / Role</label>
            <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Senior Superintendent" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            {companyOptions.length > 0 ? (
              <select value={company} onChange={(e) => { setCompany(e.target.value); setSubcontractor(""); setSubcontractorOther(""); setVisitorName(""); }} className={fieldClass}>
                <option value="">Select company…</option>
                {companyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Webuild" className={fieldClass} />
            )}
          </div>

          {company === "Subcontractor" && (
            <div>
              <label className={labelClass}>Subcontractor</label>
              <select value={subcontractor} onChange={(e) => { setSubcontractor(e.target.value); setSubcontractorOther(""); }} className={fieldClass}>
                <option value="">Select subcontractor…</option>
                {SUBCONTRACTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {company === "Subcontractor" && subcontractor === "Others" && (
            <div>
              <label className={labelClass}>Subcontractor Name</label>
              <input type="text" value={subcontractorOther} onChange={(e) => setSubcontractorOther(e.target.value)} placeholder="Enter subcontractor name" className={fieldClass} />
            </div>
          )}
          {company === "Visitor" && (
            <div>
              <label className={labelClass}>Visitor Company Name</label>
              <input type="text" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Enter visitor's company name" className={fieldClass} />
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold pt-2">
            <Building2 size={16} className="text-teal-400" /> Your site assignment
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <select value={project} onChange={(e) => setProject(e.target.value)} className={fieldClass}>
              {PROJECT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Site</label>
            <select
              value={site}
              onChange={(e) => {
                const newSite = e.target.value;
                setSite(newSite);
                setBuilding("");
                // Pre-fill the distribution list with this site's default
                // safety managers — only if the user hasn't typed anything
                // yet, so we never overwrite their own edits.
                if (!distributionList.trim() && DEFAULT_DISTRIBUTION_LIST_BY_SITE[newSite]?.length) {
                  setDistributionList(DEFAULT_DISTRIBUTION_LIST_BY_SITE[newSite].join(", "));
                }
              }}
              className={fieldClass}
            >
              <option value="">Select site…</option>
              {SITE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {buildingOptions.length > 0 && (
            <div>
              <label className={labelClass}>Building / Area</label>
              <select value={building} onChange={(e) => setBuilding(e.target.value)} className={fieldClass}>
                <option value="">Select building…</option>
                {buildingOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold pt-2">
            <Send size={16} className="text-teal-400" /> Base Distribution List
          </div>
          <textarea
            value={distributionList}
            onChange={(e) => setDistributionList(e.target.value)}
            placeholder="safety.manager@company.com, hse.team@company.com"
            rows={3}
            className={fieldClass + " resize-none"}
          />
          <p className="text-xs text-slate-400">
            Every report you submit will go to these emails by default. You can add specific subcontractor contacts later in Settings.
            {site && DEFAULT_DISTRIBUTION_LIST_BY_SITE[site]?.length > 0 && (
              <span className="block mt-1 text-amber-400/80">
                Pre-filled with placeholder safety manager emails for {site} — replace with the real addresses.
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full mt-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-60 text-white font-bold tracking-wide py-3.5 rounded-xl flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          Save & Continue
        </button>
      </div>
    </div>
  );
}
