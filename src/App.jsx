import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import LoginScreen from "./components/LoginScreen";
import LogView from "./components/LogView";
import FormView from "./components/FormView";
import DetailView from "./components/DetailView";
import SettingsView from "./components/SettingsView";
import StatsView from "./components/StatsView";
import { Loader2 } from "lucide-react";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("log");
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [siteMapUrl, setSiteMapUrl] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState(null);

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
      await Promise.all([loadMyProfile(), loadAllProfiles(), loadReports(), loadSiteMap()]);
      setLoadingData(false);
    })();
  }, [session]);

  async function loadMyProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (!error) setProfile(data);
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
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <Loader2 size={28} className="text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (loadingData || !profile) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <Loader2 size={28} className="text-violet-500 animate-spin" />
      </div>
    );
  }

  const commonProps = {
    session, profile, profiles, reports, siteMapUrl,
    showToast, setView, view,
    activeReport, setActiveReport,
    saveReport, deleteReport, updateMyProfile, handleUploadSiteMap, handleLogout,
    reloadReports: loadReports,
  };

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
      {view === "log" && <LogView {...commonProps} />}
      {view === "form" && <FormView {...commonProps} />}
      {view === "detail" && <DetailView {...commonProps} />}
      {view === "settings" && <SettingsView {...commonProps} />}
      {view === "stats" && <StatsView {...commonProps} />}
    </>
  );
}
