import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import LoginScreen from "./components/LoginScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import LogView from "./components/LogView";
import FormView from "./components/FormView";
import DetailView from "./components/DetailView";
import SettingsView from "./components/SettingsView";
import StatsView from "./components/StatsView";
import SendPromptView from "./components/SendPromptView";
import ContactsView from "./components/ContactsView";
import OnboardingView from "./components/OnboardingView";
import { Loader2 } from "lucide-react";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("log");
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [siteMapUrl, setSiteMapUrl] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [pendingSendReport, setPendingSendReport] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState(null);
  const [authScreen, setAuthScreen] = useState("welcome"); // "welcome" | "login" | "signup" (pre-session only)

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
      // First-time onboarding: every user needs a base distribution list
      // set up so the app knows where their reports should be routed.
      if (myProfile && !myProfile.distribution_list) {
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
    if (!error) setSiteMapUrl(data?.image_data_url || null);
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
    await loadReports();
    return data;
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
      <div className="min-h-screen bg-[#050b14] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#050b14] flex items-center justify-center">
        <Loader2 size={28} className="text-teal-400 animate-spin" />
      </div>
    );
  }

  const commonProps = {
    session, profile, profiles, reports, siteMapUrl,
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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#0b1522] border border-teal-500/30 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
      {view === "onboarding" && <OnboardingView {...commonProps} />}
      {view === "log" && <LogView {...commonProps} />}
      {view === "form" && <FormView {...commonProps} />}
      {view === "detail" && <DetailView {...commonProps} />}
      {view === "settings" && <SettingsView {...commonProps} />}
      {view === "stats" && <StatsView {...commonProps} />}
      {view === "send" && <SendPromptView {...commonProps} />}
      {view === "contacts" && <ContactsView {...commonProps} />}
    </>
  );
}
