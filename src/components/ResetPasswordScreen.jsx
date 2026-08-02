import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, Check } from "lucide-react";
import MinerviumLogo from "./MinerviumLogo";
import BackgroundWatermark from "./BackgroundWatermark";

/* Shown when Supabase redirects the user back here after they click
   the "reset your password" link in their email (App.jsx detects the
   PASSWORD_RECOVERY auth event and routes here). Lets them set a new
   password for the account that's already authenticated via the
   one-time recovery token in the link. */
export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => onDone(), 1800);
  }

  return (
    <div className="min-h-screen bg-[#08131D] font-sans flex flex-col relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-6 py-10 relative z-10">
        <div className="text-center mb-8">
          <MinerviumLogo size={72} showWordmark={false} showTagline={false} />
          <h1 className="mt-4 text-xl font-bold text-white">Set a New Password</h1>
          <p className="text-[#8A9198] text-xs mt-2">Choose a new password for your account.</p>
        </div>

        {done ? (
          <div className="bg-[#0d1b26] border border-teal-500/30 rounded-2xl p-6 text-center">
            <Check size={28} className="text-teal-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Password updated</p>
            <p className="text-slate-400 text-sm mt-1">Taking you to the app…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0d1b26] border border-[#18D5D0]/20 rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#08131D] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type it again"
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#08131D] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-60 text-white font-bold tracking-wide py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              UPDATE PASSWORD
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
