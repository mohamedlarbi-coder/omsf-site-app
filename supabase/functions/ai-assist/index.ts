// supabase/functions/ai-assist/index.ts
//
// Writing help for the report form: polishes the description, drafts a
// corrective action. Needs one secret in Supabase (Edge Functions -> Secrets):
//   ANTHROPIC_API_KEY = <key from console.anthropic.com>
// Requires a signed-in user (verify_jwt). Never saves anything itself — the
// app shows the suggestion and the person decides whether to use it.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "claude-sonnet-5-5";

const SYSTEM = `You help construction site staff write health & safety observation reports for the Ontario Line OMSF / RSSOM project in Ontario, Canada (OHSA context).
Rules:
- Use ONLY facts the person gave you. Never invent names, times, measurements, equipment, injuries or regulations. If something important is missing, leave it out rather than guess.
- Plain, factual, professional language. No blame, no speculation about who is at fault.
- Output ONLY the text to put in the form field: no preface, no quotes, no markdown headings.`;

const clip = (v: unknown, n = 1500) => String(v ?? "").slice(0, n);

function buildPrompt(mode: string, c: Record<string, unknown>) {
  const facts = [
    c.report_type && `Report type: ${clip(c.report_type, 60)}`,
    c.site && `Site: ${clip(c.site, 60)}`,
    c.location && `Location: ${clip(c.location, 120)}`,
    c.subcontractor && `Subcontractor involved: ${clip(c.subcontractor, 80)}`,
    Array.isArray(c.hazard_classes) && c.hazard_classes.length && `Hazard classification: ${c.hazard_classes.map((x) => clip(x, 40)).join(", ")}`,
    Array.isArray(c.life_saving_rules) && c.life_saving_rules.length && `Life-saving rule: ${c.life_saving_rules.map((x) => clip(x, 40)).join(", ")}`,
    Array.isArray(c.tracking_types) && c.tracking_types.length && `Hazard type: ${c.tracking_types.map((x) => clip(x, 40)).join(", ")}`,
    c.risk_rating && `Risk rating: ${clip(c.risk_rating, 40)}`,
    c.safety_concern && `Safety concern noted: ${clip(c.safety_concern)}`,
  ].filter(Boolean).join("\n");

  if (mode === "description") {
    return `${facts}\n\nThe person's rough notes for the description:\n"""${clip(c.description)}"""\n\nRewrite these notes as a clear, factual observation description of 2–5 sentences: what was observed, where, and why it is a concern (or, for a good spot, what was done well). Keep every fact; add none.`;
  }
  // corrective
  return `${facts}\n\nDescription of the observation:\n"""${clip(c.description)}"""\n${c.corrective_action ? `\nCorrective action already typed (improve it, keep its intent):\n"""${clip(c.corrective_action)}"""\n` : ""}\nWrite a corrective action as 2–5 short, specific, actionable steps (immediate control first, then follow-up), as plain lines starting with "- ". Only propose actions that follow directly from the observation. Do not invent owners or dates.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "not_configured" }, 503);

    const { mode, context } = await req.json();
    if (!["description", "corrective"].includes(mode) || typeof context !== "object" || !context) {
      return json({ error: "bad_request" }, 400);
    }
    if (mode === "description" && clip(context.description).trim().length < 5) {
      return json({ error: "needs_notes" }, 400);
    }
    if (mode === "corrective" && clip(context.description).trim().length < 5) {
      return json({ error: "needs_description" }, 400);
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: SYSTEM,
        messages: [{ role: "user", content: buildPrompt(mode, context) }],
      }),
    });
    if (!res.ok) {
      console.error("Anthropic error:", res.status, await res.text());
      return json({ error: "ai_unavailable" }, 502);
    }
    const data = await res.json();
    const text = (data.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("").trim();
    return json({ text });
  } catch (err) {
    console.error(err);
    return json({ error: "server_error" }, 500);
  }
});
