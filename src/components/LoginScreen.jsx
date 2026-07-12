import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, ChevronLeft } from "lucide-react";
import SentiQLogo from "./SentiQLogo";
import BackgroundWatermark from "./BackgroundWatermark";

export default function LoginScreen({ initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password.trim()) {
      setError("Enter both email and password");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Enter your name");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { my_name: name.trim() } },
        });
        if (signUpError) {
          setError(signUpError.message);
        } else if (data.session === null) {
          setInfo("Account created. Check your email to confirm, then log in.");
          setMode("login");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) setError(signInError.message);
      }
    } catch (err) {
      setError("Something went wrong — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050b14] font-sans flex flex-col relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-6 py-10 relative z-10">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-teal-400 text-sm font-medium mb-4 -ml-1.5 transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
        )}
        <div className="text-center mb-8">
          <SentiQLogo size={84} />
          <h1 className="mt-4 text-2xl font-bold tracking-[0.12em] text-white">
            SENTI<span className="text-teal-400">Q</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 tracking-wide uppercase">Observe. Share. Prevent. Improve.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0b1522] border border-teal-500/20 rounded-2xl p-5 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mohamed Jabri"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#050b14] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#050b14] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#050b14] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          {info && <p className="text-emerald-400 text-xs text-center">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-60 text-white font-bold tracking-wide py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login" ? "LOG IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-slate-600 text-xs font-semibold uppercase tracking-wide">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }}
          className="w-full text-slate-300 font-semibold py-3 text-sm hover:text-teal-400 transition-colors"
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
