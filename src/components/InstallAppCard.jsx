import React, { useEffect, useState } from "react";
import { Download, Share, Check, PlusSquare } from "lucide-react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Settings-screen card that lets every team member add MINERVIUM to
// their phone's home screen, so it opens like a native app. Chrome /
// Android support a real install prompt (captured via the
// beforeinstallprompt event); iOS Safari has no such API, so it gets
// plain step-by-step instructions instead.
export default function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const ios = isIOS();

  useEffect(() => {
    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (installed) {
    return (
      <div className="bg-[#0d1b26] rounded-xl border border-slate-800 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Check size={18} className="text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">App installed</div>
          <div className="text-xs text-slate-500 mt-0.5">MINERVIUM is on this device's home screen.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1b26] rounded-xl border border-slate-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Download size={18} className="text-teal-400" />
        <h2 className="text-[15px] font-semibold tracking-wide text-white uppercase">Get the App</h2>
      </div>
      <p className="text-xs text-slate-500 -mt-1">
        Add MINERVIUM to your home screen so it opens like a normal app — no browser bar, one tap to launch.
      </p>

      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold tracking-wide py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Download size={18} /> Install App
        </button>
      )}

      {!deferredPrompt && ios && (
        <ol className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 text-xs flex items-center justify-center text-teal-400 font-semibold">1</span>
            <span className="flex items-center gap-1.5">
              Tap the Share button <Share size={14} className="text-slate-400" /> in Safari's toolbar
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 text-xs flex items-center justify-center text-teal-400 font-semibold">2</span>
            <span className="flex items-center gap-1.5">
              Scroll down and tap <PlusSquare size={14} className="text-slate-400" /> "Add to Home Screen"
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 text-xs flex items-center justify-center text-teal-400 font-semibold">3</span>
            <span>Tap "Add" in the top-right corner</span>
          </li>
        </ol>
      )}

      {!deferredPrompt && !ios && (
        <p className="text-xs text-slate-500">
          Open this page in Chrome, then use the browser menu (⋮) and choose "Add to Home screen" or "Install app".
        </p>
      )}
    </div>
  );
}
