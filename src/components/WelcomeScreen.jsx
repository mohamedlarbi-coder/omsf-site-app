import React from "react";
import { Eye, Share2, ShieldCheck, TrendingUp, Lock } from "lucide-react";
import MinerviumLogo from "./MinerviumLogo";

const PILLARS = [
  { icon: Eye, label: "SEE", sub: "Capture what matters." },
  { icon: Share2, label: "SHARE", sub: "Report in seconds." },
  { icon: ShieldCheck, label: "PREVENT", sub: "Stop incidents before they happen." },
  { icon: TrendingUp, label: "IMPROVE", sub: "Build a culture of excellence." },
];

export default function WelcomeScreen({ onGetStarted, onSignIn }) {
  return (
    <div className="min-h-screen bg-[#08131D] font-sans flex flex-col relative overflow-hidden">
      {/* subtle background texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #18D5D0 1px, transparent 0)", backgroundSize: "28px 28px" }} />

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col px-6 py-10 relative z-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <MinerviumLogo size={240} full />

          <div className="grid grid-cols-4 gap-3 mt-10 w-full">
            {PILLARS.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center">
                <div className="w-11 h-11 mx-auto rounded-2xl border border-[#18D5D0]/40 flex items-center justify-center mb-2">
                  <Icon size={20} className="text-[#18D5D0]" strokeWidth={1.75} />
                </div>
                <div className="text-white text-[11px] font-semibold tracking-wide">{label}</div>
                <div className="text-[#8A9198] text-[10px] mt-1 leading-tight">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pb-2">
          <button
            onClick={onGetStarted}
            className="w-full bg-[#18D5D0] hover:bg-[#3fe0dc] text-[#08131D] font-bold tracking-wide py-4 rounded-[14px] flex items-center justify-center gap-2 shadow-lg shadow-[#18D5D0]/20 transition-all"
          >
            GET STARTED <span className="text-lg">→</span>
          </button>
          <button
            onClick={onSignIn}
            className="w-full border border-[#18D5D0]/50 text-[#18D5D0] font-bold tracking-wide py-4 rounded-[14px] hover:bg-[#18D5D0]/5 transition-colors"
          >
            SIGN IN
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[#8A9198] text-[11px] tracking-wide mt-3">
            <Lock size={12} /> YOUR SAFETY. OUR PRIORITY.
          </p>
        </div>
      </div>
    </div>
  );
}
