import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import LoginScreen from "./components/LoginScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import LogView from "./components/LogView";
import HomeView from "./components/HomeView";
import DesktopDashboardPage from "./components/desktop/DesktopDashboardPage";
import DashboardObservationsPage from "./components/desktop/DashboardObservationsPage";
import DashboardActionsPage from "./components/desktop/DashboardActionsPage";
import DashboardInspectionsPage from "./components/desktop/DashboardInspectionsPage";
import FormView from "./components/FormView";
import DetailView from "./components/DetailView";
import SettingsView from "./components/SettingsView";
import StatsView from "./components/StatsView";
import NewObservationPage from "./components/desktop/NewObservationPage";
import NewObservationDetailsPage from "./components/desktop/NewObservationDetailsPage";
import NewObservationMediaPage from "./components/desktop/NewObservationMediaPage";
import NewObservationReviewPage from "./components/desktop/NewObservationReviewPage";
import SendPromptView from "./components/SendPromptView";
import ContactsView from "./components/ContactsView";
import OnboardingView from "./components/OnboardingView";
import { Loader2 } from "lucide-react";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("home");
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [siteMapUrl, setSiteMapUrl] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [pendingSendReport, setPendingSendReport] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState(null);
  const [authScreen, setAuthScreen] = useState("welcome"); // "welcome" | "login" | "signup" (pre-session only)
  const [observationDraft, setObservationDraft] = useState(null); // carries data between desktop New Observation steps
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 1024);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // Watch auth state — this is what makes cross-device login work:
  // Supabase handles the session token, refresh, everything.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Once logged in, load profile + shared data
  useEffect(() => {
    if (!session) return;
    (async () => {
      setLoadingData(true);
      const myProfile = await loadMyProfile();
      await Promise.all([loadAllProfiles(), loadReports(), loadSiteMap(), loadSubcontractors()]);
      setLoadingData(false);
      // First-time onboarding: every user needs their role, company,
      // project/site assignment and a base distribution list set up
      // so the app knows who they are and where their reports go.
      if (myProfile && (!myProfile.distribution_list || !myProfile.my_position || !myProfile.my_company || !myProfile.assigned_project)) {
        setView("onboarding");
      }
    })();
  }, [session]);

  async function loadMyProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (!error) {
      setProfile(data);
      return data;
    }
    return null;
  }

  async function loadAllProfiles() {
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error) setProfiles(data || []);
  }

  async function loadReports() {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setReports(data || []);
  }

  async function loadSiteMap() {
    const { data, error } = await supabase.from("site_map").select("*").eq("id", 1).single();
    // Fall back to the bundled OMSF Maintenance Building floor plan until
    // the team uploads their own map(s) from Settings. More maps (per
    // area/site) can be added later — this is just the first one.
    if (!error && data?.image_data_url) {
      setSiteMapUrl(data.image_data_url);
    } else {
      setSiteMapUrl("/site-map-omsf-default.jpg");
    }
  }

  async function loadSubcontractors() {
    const { data, error } = await supabase.from("subcontractors").select("*").order("name");
    if (!error) setSubcontractors(data || []);
  }

  async function addSubcontractor(name, contactEmails) {
    const { error } = await supabase.from("subcontractors").insert({ name, contact_emails: contactEmails });
    if (!error) {
      await loadSubcontractors();
      showToast("Contact added");
    } else {
      showToast("Failed to add contact");
    }
  }

  async function updateSubcontractor(id, updates) {
    const { error } = await supabase.from("subcontractors").update(updates).eq("id", id);
    if (!error) {
      await loadSubcontractors();
      showToast("Contact updated");
    } else {
      showToast("Failed to update contact");
    }
  }

  async function deleteSubcontractor(id) {
    const { error } = await supabase.from("subcontractors").delete().eq("id", id);
    if (!error) {
      await loadSubcontractors();
      showToast("Contact removed");
    }
  }

  async function handleUploadSiteMap(dataUrl) {
    const { error } = await supabase.from("site_map").upsert({ id: 1, image_data_url: dataUrl, updated_at: new Date().toISOString() });
    if (!error) {
      setSiteMapUrl(dataUrl);
      showToast("Site map updated for the whole team");
    } else {
      showToast("Failed to save site map");
    }
  }

  async function saveReport(reportData) {
    const payload = { ...reportData, author_id: session.user.id };
    const { data, error } = await supabase.from("reports").insert(payload).select().single();
    if (error) {
      showToast("Failed to save report: " + error.message);
      return null;
    }
    await createActionItemsForReport(data);
    await loadReports();
    return data;
  }

  // Turns a report's Corrective Action and/or Preventative Action into
  // their own trackable rows in action_items, so each can be closed out
  // independently (with proof) and reminded on its own schedule —
  // instead of only living as free text inside the report.
  async function createActionItemsForReport(report) {
    const items = [];
    const subName = report.subcontractor === "Others" ? report.subcontractor_other : report.subcontractor;
    if (report.corrective_action?.trim()) {
      items.push({
        report_id: report.id,
        kind: "Corrective",
        description: report.corrective_action,
        owner: report.corrective_action_owner || "",
        subcontractor: subName || "",
        location: report.location || "",
        due_date: report.corrective_close_out_date || null,
      });
    }
    if (report.preventative_action?.trim()) {
      items.push({
        report_id: report.id,
        kind: "Preventative",
        description: report.preventative_action,
        owner: report.preventative_action_owner || "",
        subcontractor: subName || "",
        location: report.location || "",
        due_date: report.preventative_close_out_date || null,
      });
    }
    if (items.length > 0) {
      const { error } = await supabase.from("action_items").insert(items);
      if (error) console.error("Failed to create action items:", error.message);
    }
  }

  async function deleteReport(id) {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (!error) {
      await loadReports();
      showToast("Report deleted");
    }
  }

  async function updateMyProfile(updates) {
    const { error } = await supabase.from("profiles").update(updates).eq("id", session.user.id);
    if (!error) {
      await loadMyProfile();
      await loadAllProfiles();
      showToast("Profile saved");
    } else {
      showToast("Failed to save profile");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setView("log");
  }

  // ---------------- render ----------------

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#08131D] flex items-center justify-center">
        <Loader2 size={28} className="text-teal-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (authScreen === "welcome") {
      return (
        <WelcomeScreen
          onGetStarted={() => setAuthScreen("signup")}
          onSignIn={() => setAuthScreen("login")}
        />
      );
    }
    return <LoginScreen initialMode={authScreen} onBack={() => setAuthScreen("welcome")} />;
  }

  if (loadingData || !profile) {
    return (
      <div className="min-h-screen bg-[#08131D] flex items-center justify-center">
        <Loader2 size={28} className="text-teal-400 animate-spin" />
      </div>
    );
  }

  const commonProps = {
    session, profile, profiles, reports, siteMapUrl, isDesktop,
    subcontractors, addSubcontractor, updateSubcontractor, deleteSubcontractor,
    showToast, setView, view,
    activeReport, setActiveReport,
    pendingSendReport, setPendingSendReport,
    saveReport, deleteReport, updateMyProfile, handleUploadSiteMap, handleLogout,
    reloadReports: loadReports,
  };

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#0d1b26] border border-teal-500/30 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
      {view === "onboarding" && <OnboardingView {...commonProps} />}
      {view === "home" && (isDesktop ? <DesktopDashboardPage {...commonProps} /> : <HomeView {...commonProps} />)}
      {view === "observations-desktop" && <DashboardObservationsPage {...commonProps} />}
      {view === "actions-desktop" && <DashboardActionsPage {...commonProps} />}
      {view === "inspections-desktop" && <DashboardInspectionsPage {...commonProps} />}
      {view === "log" && <LogView {...commonProps} />}
      {view === "form" && <FormView {...commonProps} />}
      {view === "detail" && <DetailView {...commonProps} />}
      {view === "settings" && <SettingsView {...commonProps} />}
      {view === "stats" && <StatsView {...commonProps} />}
      {view === "new-observation-desktop" && (
        <NewObservationPage
          initialDraft={observationDraft}
          onCancel={() => { setObservationDraft(null); setView("log"); }}
          onAdvance={(draft) => { setObservationDraft(draft); setView("new-observation-desktop-details"); }}
        />
      )}
      {view === "new-observation-desktop-details" && (
        <NewObservationDetailsPage
          initialDraft={observationDraft}
          onCancel={() => { setObservationDraft(null); setView("log"); }}
          onBack={(draft) => { setObservationDraft(draft); setView("new-observation-desktop"); }}
          onAdvance={(draft) => { setObservationDraft(draft); setView("new-observation-desktop-media"); }}
        />
      )}
      {view === "new-observation-desktop-media" && (
        <NewObservationMediaPage
          initialDraft={observationDraft}
          siteMapUrl={siteMapUrl}
          onCancel={() => { setObservationDraft(null); setView("log"); }}
          onBack={(draft) => { setObservationDraft(draft); setView("new-observation-desktop-details"); }}
          onAdvance={(draft) => { setObservationDraft(draft); setView("new-observation-desktop-review"); }}
        />
      )}
      {view === "new-observation-desktop-review" && (
        <NewObservationReviewPage
          draft={observationDraft || {}}
          onCancel={() => { setObservationDraft(null); setView("log"); }}
          onBack={(draft) => { setObservationDraft(draft); setView("new-observation-desktop-media"); }}
          onSubmit={async (draft) => {
            const TYPE_TO_REPORT_TYPE = {
              "good-spot": "Good Spot",
              "hazard": "Hazard",
              "close-call": "Closecall",
              "ofi": "OFI",
            };
            const payload = {
              project: "RSSOM Project",
              report_date: new Date().toISOString().slice(0, 10),
              respondent: profile.my_name || "",
              company: profile.my_company || "",
              report_type: TYPE_TO_REPORT_TYPE[draft.type] || "Hazard",
              location: draft.location || draft.mediaLocation || "",
              photo_data_url: draft.photos && draft.photos[0] ? draft.photos[0] : null,
              description: draft.description || "",
              safety_concern: "",
              hazard_classes: draft.hazardClass ? [draft.hazardClass] : [],
              tracking_types: draft.trackingType ? [draft.trackingType] : [],
              risk_rating: "",
              contributing_factors: [],
              corrective_action: "",
              preventative_action: "",
              map_pin: draft.mapPin || null,
              site_map_snapshot: draft.mapPin ? siteMapUrl : null,
              ai_generated: false,
            };
            const saved = await saveReport(payload);
            if (saved) {
              showToast("Observation submitted");
              setObservationDraft(null);
              setView("log");
            }
          }}
        />
      )}
      {view === "send" && <SendPromptView {...commonProps} />}
      {view === "contacts" && <ContactsView {...commonProps} />}
    </>
  );
}
