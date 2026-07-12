import React from "react";
import { Eye, Share2, ShieldCheck, TrendingUp, Lock } from "lucide-react";
import SentiQLogo from "./SentiQLogo";

const PILLARS = [
  { icon: Eye, label: "OBSERVE", sub: "Capture what matters." },
  { icon: Share2, label: "SHARE", sub: "Report in seconds." },
  { icon: ShieldCheck, label: "PREVENT", sub: "Stop incidents before they happen." },
  { icon: TrendingUp, label: "IMPROVE", sub: "Build a culture of excellence." },
];

export default function WelcomeScreen({ onGetStarted, onSignIn }) {
  return (
    <div className="min-h-screen bg-[#050b14] font-sans flex flex-col relative overflow-hidden">
      {/* subtle background texture */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #2dd4bf 1px, transparent 0)", backgroundSize: "28px 28px" }} />

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col px-6 py-10 relative z-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <SentiQLogo size={140} />

          <h1 className="mt-6 text-4xl font-bold tracking-[0.15em] text-white flex items-baseline">
            SENTI<span className="text-teal-400">Q</span>
          </h1>
          <p className="mt-3 text-teal-400 text-xs font-semibold tracking-[0.25em] uppercase">
            Observe. Share. Prevent. Improve.
          </p>
          <div className="w-40 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent mt-5" />
          <p className="mt-5 text-slate-400 text-sm tracking-wide uppercase">
            Smart observations. Safer futures.
          </p>

          <div className="grid grid-cols-4 gap-3 mt-10 w-full">
            {PILLARS.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center">
                <div className="w-11 h-11 mx-auto rounded-lg border border-teal-500/40 flex items-center justify-center mb-2">
                  <Icon size={20} className="text-teal-400" strokeWidth={1.75} />
                </div>
                <div className="text-white text-[11px] font-bold tracking-wide">{label}</div>
                <div className="text-slate-500 text-[10px] mt-1 leading-tight">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pb-2">
          <button
            onClick={onGetStarted}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all"
          >
            GET STARTED <span className="text-lg">→</span>
          </button>
          <button
            onClick={onSignIn}
            className="w-full border border-teal-500/50 text-teal-400 font-bold tracking-wide py-4 rounded-xl hover:bg-teal-500/5 transition-colors"
          >
            SIGN IN
          </button>
          <p className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px] tracking-wide mt-3">
            <Lock size={12} /> YOUR SAFETY. OUR PRIORITY.
          </p>
        </div>
      </div>
    </div>
  );
}
