import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Building2, Loader2 } from "lucide-react";

export default function LoginScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
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
        // If email confirmation is off, data.session will be set and
        // the App's onAuthStateChange listener will pick it up automatically.
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
    <div className="min-h-screen bg-stone-900 font-sans flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-6 py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-600 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">OMSF Site</h1>
          <p className="text-stone-400 text-sm mt-1">Good Spot / Hazard Reporting</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-800 border border-stone-700 rounded-2xl p-5 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mohamed Jabri"
                className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-900 text-white px-3 py-2.5 text-[15px] placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-900 text-white px-3 py-2.5 text-[15px] placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="mt-1 w-full rounded-lg border border-stone-600 bg-stone-900 text-white px-3 py-2.5 text-[15px] placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          {info && <p className="text-emerald-400 text-xs text-center">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-stone-700" />
          <span className="text-stone-500 text-xs font-semibold uppercase tracking-wide">or</span>
          <div className="h-px flex-1 bg-stone-700" />
        </div>

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }}
          className="w-full text-stone-300 font-semibold py-3 text-sm hover:text-white transition-colors"
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
