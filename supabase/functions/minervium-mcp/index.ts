// minervium-mcp: MINERVIUM as a connector for Claude (Model Context Protocol, Streamable HTTP, stateless JSON).
//
// AUTH: every tool call needs a Supabase-issued access token for a signed-in MINERVIUM user
// (OAuth 2.1 via Supabase Auth's OAuth server; Claude discovers it from /.well-known/oauth-protected-resource).
// The token is verified with auth.getUser(); the report is inserted with a client acting AS THAT USER,
// so RLS enforces author_id = auth.uid(). No token / bad token => 401, nothing else happens.
// Deployed with verify_jwt=false ONLY so that the unauthenticated discovery request can receive the
// 401 + WWW-Authenticate header the MCP spec requires; all real checks are done below.
//
// SAFETY: create_report only ever writes a DRAFT (table mcp_report_drafts). A report is inserted only when
// called again with confirm=true + draft_id + the draft_hash of the exact draft the user was shown.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FN_URL = `${SB_URL}/functions/v1/minervium-mcp`;
const adm = createClient(SB_URL, SRV, { auth: { persistSession: false, autoRefreshToken: false } });

/* ---- allowed values (mirror of src/lib/constants.js) ---- */
const REPORT_TYPES = ["OFI", "Good Spot", "Hazard", "Closecall"];
const PROJECT_OPTIONS = ["RSSOM Project"];
const COMPANY_OPTIONS = ["Connect6ix", "Metrolinx", "Subcontractor", "Visitor"];
const SUBCONTRACTOR_OPTIONS = ["GIP", "Outspan", "Structform", "Sylvan", "Smith & Long", "Others"];
const SITE_OPTIONS = ["OMSF", "SUSS"];
const BUILDINGS: Record<string, string[]> = { OMSF: ["OMSF Building", "TPSS Building", "MOW Building", "Gate House Building", "Yard"] };
const HAZARD_CLASSES = ["Physical", "Chemical", "Biological", "Ergonomic", "Safety", "Life-Saving Rule", "Legislative", "Environmental", "Psychosocial", "Others"];
const LIFE_SAVING = ["Electrical Safety", "Stored Energy", "Work at Height", "Lifting", "Rail and Road Vehicles", "Driving", "Confined Spaces", "Fire and Explosion", "Plant and Machinery", "Remote and Lone Working", "Mental Health"];
const TRACKING = ["Fall hazard", "PPE", "Housekeeping", "Access Egress/Control Zone", "Moving Objects", "Drop Objects", "Mobile Equip", "Doc/Policy", "Tools", "Others"];
const RISKS = ["Very High/High", "Medium", "Low", "No Risk"];
const FACTORS = ["Communication", "Complacency", "Lack of Knowledge", "Lack of Teamwork", "Time pressure", "Distraction", "Fatigue", "Lack of Resources", "Lack of Assertiveness", "Others"];
const PHOTO_REQUIRED = ["Hazard", "Closecall"];
const MAX_PHOTO_BYTES = 2_000_000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-session-id, mcp-protocol-version, x-client-info, apikey",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "WWW-Authenticate",
};
const json = (o: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } });

/* ---- auth ---- */
type Ctx = { user: { id: string; email?: string }; token: string; sb: ReturnType<typeof createClient> };
async function authenticate(req: Request): Promise<Ctx | null> {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1].trim();
  const sb = createClient(SB_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return { user: { id: data.user.id, email: data.user.email }, token, sb };
}
const unauthorized = () =>
  json({ error: "unauthorized", error_description: "Sign in to MINERVIUM to use this connector." }, 401, {
    "WWW-Authenticate": `Bearer resource_metadata="${FN_URL}/.well-known/oauth-protected-resource"`,
  });

/* ---- helpers ---- */
const str = (v: unknown, n = 2000) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const sha = async (s: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const canon = (o: Record<string, unknown>) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

const STR_FIELDS = ["project", "report_date", "action_report_to", "respondent", "company", "company_subcontractor", "company_subcontractor_other", "company_visitor_name",
  "subcontractor", "subcontractor_other", "site", "report_type", "location", "description", "safety_concern", "hazard_class_other", "tracking_type_other",
  "risk_rating", "contributing_factor_other", "corrective_action", "corrective_action_owner", "corrective_close_out_date", "preventative_action",
  "preventative_action_owner", "preventative_close_out_date"];
const ARR_FIELDS: Record<string, string[]> = { hazard_classes: HAZARD_CLASSES, life_saving_rules: LIFE_SAVING, tracking_types: TRACKING, contributing_factors: FACTORS };

function validate(p: Record<string, any>, hasPhoto: boolean) {
  const errors: string[] = [], warnings: string[] = [];
  const need = (ok: boolean, msg: string) => { if (!ok) errors.push(msg); };
  need(REPORT_TYPES.includes(p.report_type), `report_type must be one of: ${REPORT_TYPES.join(", ")}`);
  need(PROJECT_OPTIONS.includes(p.project), `project must be one of: ${PROJECT_OPTIONS.join(", ")}`);
  need(COMPANY_OPTIONS.includes(p.company), `company must be one of: ${COMPANY_OPTIONS.join(", ")}`);
  if (p.company === "Subcontractor") {
    need(SUBCONTRACTOR_OPTIONS.includes(p.company_subcontractor), `company_subcontractor is required when company is Subcontractor: ${SUBCONTRACTOR_OPTIONS.join(", ")}`);
    if (p.company_subcontractor === "Others") need(!!p.company_subcontractor_other, "company_subcontractor_other (name) is required when company_subcontractor is Others");
  }
  if (p.company === "Visitor") need(!!p.company_visitor_name, "company_visitor_name is required when company is Visitor");
  need(SITE_OPTIONS.includes(p.site), `site must be one of: ${SITE_OPTIONS.join(", ")}`);
  need(!!p.location, "location is required");
  if (BUILDINGS[p.site] && p.location) need(BUILDINGS[p.site].includes(p.location), `For site ${p.site}, location must be one of: ${BUILDINGS[p.site].join(", ")}`);
  need(!!p.description, "description is required");
  if (p.subcontractor) need(SUBCONTRACTOR_OPTIONS.includes(p.subcontractor), `subcontractor must be one of: ${SUBCONTRACTOR_OPTIONS.join(", ")}`);
  if (p.subcontractor === "Others") need(!!p.subcontractor_other, "subcontractor_other (name) is required when subcontractor is Others");
  if (p.risk_rating) need(RISKS.includes(p.risk_rating), `risk_rating must be one of: ${RISKS.join(", ")}`);
  else if (p.report_type && p.report_type !== "Good Spot") warnings.push("risk_rating is not set - ask the user for one (Very High/High, Medium, Low, No Risk).");
  need(!p.report_date || isDate(p.report_date), "report_date must be YYYY-MM-DD");
  for (const k of ["corrective_close_out_date", "preventative_close_out_date"]) need(!p[k] || isDate(p[k]), `${k} must be YYYY-MM-DD`);
  if (PHOTO_REQUIRED.includes(p.report_type) && !hasPhoto) errors.push(`A photo is required for ${p.report_type} reports - use attach_photo with this draft_id.`);
  if (p.hazard_classes?.includes("Life-Saving Rule") && !p.life_saving_rules?.length) warnings.push("Hazard class 'Life-Saving Rule' is selected but no life_saving_rules are set.");
  return { errors, warnings };
}

function resolveCompany(p: Record<string, any>) {
  if (p.company === "Subcontractor") return p.company_subcontractor === "Others" ? p.company_subcontractor_other : p.company_subcontractor;
  if (p.company === "Visitor") return p.company_visitor_name;
  return p.company;
}
const subName = (r: Record<string, any>) => (r.subcontractor === "Others" ? r.subcontractor_other : r.subcontractor);

async function recipients(ctx: Ctx, profile: any, report: Record<string, any>) {
  const { data: subs } = await ctx.sb.from("subcontractors").select("name, contact_emails");
  const names = [report.action_report_to, subName(report)].filter(Boolean).map((n: string) => n.trim().toLowerCase());
  const matched = (subs || []).filter((s: any) => names.includes(String(s.name).trim().toLowerCase()));
  const subTo = [...new Set(matched.flatMap((s: any) => s.contact_emails || []).map((e: string) => e.trim()).filter(Boolean))] as string[];
  const base = String(profile?.distribution_list || "").split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const self = ctx.user.email ? [ctx.user.email.trim()] : [];
  const all = [...new Set([...base, ...subTo, ...self])];
  const subSet = new Set(subTo.map((e) => e.toLowerCase()));
  let safetyTo = all.filter((e) => !subSet.has(e.toLowerCase()));
  let sub = subTo;
  // Test safety valve: a report whose description starts with TEST only ever emails the author.
  if (/^test\b/i.test(report.description || "")) { safetyTo = self; sub = []; }
  return { safetyTo, subTo: sub };
}

function buildRow(p: Record<string, any>, profile: any, photo: string | null, userId: string) {
  const row: Record<string, any> = {
    project: p.project, report_date: p.report_date || new Date().toISOString().slice(0, 10),
    action_report_to: p.action_report_to || "", respondent: p.respondent || profile?.my_name || "",
    company: resolveCompany(p), report_type: p.report_type, site: p.site, location: p.location,
    subcontractor: p.subcontractor || "", subcontractor_other: p.subcontractor_other || "",
    photo_data_url: photo, description: p.description, safety_concern: p.safety_concern || "",
    hazard_classes: p.hazard_classes || [], hazard_class_other: p.hazard_class_other || "",
    life_saving_rules: p.life_saving_rules || [], tracking_types: p.tracking_types || [], tracking_type_other: p.tracking_type_other || "",
    risk_rating: p.risk_rating || (p.report_type === "Good Spot" ? "No Risk" : ""),
    contributing_factors: p.contributing_factors || [], contributing_factor_other: p.contributing_factor_other || "",
    corrective_action: p.corrective_action || "", corrective_action_owner: p.corrective_action_owner || "",
    corrective_close_out_date: p.corrective_close_out_date || null,
    preventative_action: p.preventative_action || "", preventative_action_owner: p.preventative_action_owner || "",
    preventative_close_out_date: p.preventative_close_out_date || null,
    ai_generated: false, map_pin: null, building_pin: null, gps: null, site_map_snapshot: null,
    author_id: userId, // always the verified signed-in user
  };
  return row;
}

function showDraft(d: any, p: Record<string, any>, hasPhoto: boolean, photoKB: number, v: { errors: string[]; warnings: string[] }, rcpt: { safetyTo: string[]; subTo: string[] } | null) {
  const L: string[] = [];
  L.push(`DRAFT (not submitted) - draft_id: ${d.id}`);
  L.push(`Report type: ${p.report_type || "-"} | Date: ${p.report_date}`);
  L.push(`Project: ${p.project} | Site: ${p.site || "-"} | Location: ${p.location || "-"}`);
  L.push(`Company: ${resolveCompany(p) || "-"} | Respondent: ${p.respondent || "-"}`);
  L.push(`Subcontractor involved: ${subName(p) || "-"} | Action report to: ${p.action_report_to || "-"}`);
  L.push(`Description: ${p.description || "-"}`);
  L.push(`Safety concern: ${p.safety_concern || "-"}`);
  L.push(`Hazard classes: ${(p.hazard_classes || []).join(", ") || "-"}${p.hazard_class_other ? ` (${p.hazard_class_other})` : ""}`);
  L.push(`Life-saving rules: ${(p.life_saving_rules || []).join(", ") || "-"}`);
  L.push(`Hazard types: ${(p.tracking_types || []).join(", ") || "-"}${p.tracking_type_other ? ` (${p.tracking_type_other})` : ""}`);
  L.push(`Risk rating: ${p.risk_rating || "-"}`);
  L.push(`Contributing factors: ${(p.contributing_factors || []).join(", ") || "-"}${p.contributing_factor_other ? ` (${p.contributing_factor_other})` : ""}`);
  L.push(`Corrective action: ${p.corrective_action || "-"} | owner: ${p.corrective_action_owner || "-"} | due: ${p.corrective_close_out_date || "auto (set by MINERVIUM from risk rating)"}`);
  L.push(`Preventative action: ${p.preventative_action || "-"} | owner: ${p.preventative_action_owner || "-"} | due: ${p.preventative_close_out_date || "-"}`);
  L.push(`Photo: ${hasPhoto ? `attached (${photoKB} KB)` : "NONE"}`);
  if (rcpt) L.push(`On submit this will be emailed to: ${[...rcpt.safetyTo, ...rcpt.subTo].join(", ") || "nobody"}${rcpt.subTo.length ? ` (subcontractor contacts: ${rcpt.subTo.join(", ")})` : ""}. No PDF is attached to emails sent from this connector.`);
  L.push("");
  if (v.errors.length) L.push("BLOCKING PROBLEMS (fix with create_report + draft_id):\n- " + v.errors.join("\n- "));
  if (v.warnings.length) L.push("Warnings:\n- " + v.warnings.join("\n- "));
  if (!v.errors.length) {
    L.push(`draft_hash: ${d.hash}`);
    L.push("NEXT: show this ENTIRE draft to the user and ask them to confirm. Only after they clearly say yes, call create_report again with ONLY {confirm: true, draft_id, draft_hash}. Never confirm on the user's behalf.");
  }
  return L.join("\n");
}

const textResult = (t: string, isError = false) => ({ content: [{ type: "text", text: t }], ...(isError ? { isError: true } : {}) });

async function loadDraft(id: unknown, ctx: Ctx) {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await adm.from("mcp_report_drafts").select("*").eq("id", id).eq("user_id", ctx.user.id).maybeSingle();
  return data;
}
async function getProfile(ctx: Ctx) {
  const { data } = await ctx.sb.from("profiles").select("*").eq("id", ctx.user.id).maybeSingle();
  return data;
}

/* ---- tools ---- */
async function createReport(a: Record<string, any>, ctx: Ctx) {
  const profile = await getProfile(ctx);
  if (!profile) return textResult("No MINERVIUM profile found for this account. Open MINERVIUM and finish onboarding first.", true);

  /* ---------- confirmed submit ---------- */
  if (a.confirm !== undefined && a.confirm !== true && a.confirm !== false) return textResult("confirm must be true or false.", true);
  if (a.confirm === true) {
    const extra = Object.keys(a).filter((k) => !["confirm", "draft_id", "draft_hash"].includes(k));
    if (extra.length) return textResult(`Nothing submitted. When confirming, send ONLY confirm, draft_id and draft_hash (got extra: ${extra.join(", ")}). To change the draft, call create_report without confirm, show the new draft and ask again.`, true);
    const d = await loadDraft(a.draft_id, ctx);
    if (!d) return textResult("Draft not found for this user.", true);
    if (d.status !== "draft") return textResult(`This draft was already ${d.status}${d.report_id ? ` (report ${d.report_id})` : ""}. Nothing new was submitted.`, true);
    if (new Date(d.expires_at) < new Date()) return textResult("This draft expired. Create a new draft.", true);
    if (!a.draft_hash || a.draft_hash !== d.hash) return textResult("draft_hash does not match the current draft, so nothing was submitted. Show the user the latest draft and use its draft_hash.", true);
    const p = d.payload as Record<string, any>;
    const v = validate(p, !!d.photo_data_url);
    if (v.errors.length) return textResult("Not submitted - validation failed:\n- " + v.errors.join("\n- "), true);

    // claim the draft atomically (prevents double submit)
    const { data: claimed } = await adm.from("mcp_report_drafts").update({ status: "submitting" }).eq("id", d.id).eq("user_id", ctx.user.id).eq("status", "draft").eq("hash", d.hash).select("id");
    if (!claimed?.length) return textResult("This draft is already being submitted. Nothing new was submitted.", true);

    const row = buildRow(p, profile, d.photo_data_url, ctx.user.id);
    const { data: report, error } = await ctx.sb.from("reports").insert(row).select().single();
    if (error || !report) {
      await adm.from("mcp_report_drafts").update({ status: "draft" }).eq("id", d.id);
      return textResult(`Report was NOT saved: ${error?.message || "unknown error"}`, true);
    }
    await adm.from("mcp_report_drafts").update({ status: "submitted", report_id: report.id }).eq("id", d.id);
    const isTest = /^test\b/i.test(report.description || "");

    // same rules as App.jsx createActionItemsForReport
    const items: Record<string, unknown>[] = [];
    const needsLoop = report.report_type !== "Good Spot" && !/^no risk$/i.test((report.risk_rating || "").trim());
    if (report.corrective_action?.trim() || needsLoop) {
      items.push({ report_id: report.id, kind: "Corrective", description: report.corrective_action?.trim() || report.description || "Corrective action required",
        owner: report.corrective_action_owner || "", subcontractor: subName(report) || "", location: report.location || "", due_date: report.corrective_close_out_date || null });
    }
    if (report.preventative_action?.trim()) {
      items.push({ report_id: report.id, kind: "Preventative", description: report.preventative_action, owner: report.preventative_action_owner || "",
        subcontractor: subName(report) || "", location: report.location || "", due_date: report.preventative_close_out_date || null });
    }
    let actionNote = "no action item needed";
    if (items.length) {
      const { error: aerr } = await ctx.sb.from("action_items").insert(items);
      actionNote = aerr ? `ACTION ITEM FAILED: ${aerr.message}` : `${items.length} action item(s) created`;
    }

    // email, exactly like SendPromptView.sendNow (no PDF: it is built in the browser app)
    let emailNote = "no recipients";
    const rc = await recipients(ctx, profile, report);
    if (rc.safetyTo.length || rc.subTo.length) {
      try {
        const res = await fetch(`${SB_URL}/functions/v1/send-report-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${ctx.token}`, apikey: ANON },
          body: JSON.stringify({ to: [...rc.safetyTo, ...rc.subTo], safetyTo: rc.safetyTo, subTo: rc.subTo, report, profile: { ...profile, email: ctx.user.email } }),
        });
        emailNote = res.ok ? `emailed to ${[...rc.safetyTo, ...rc.subTo].join(", ")}` : `EMAIL FAILED (${res.status}) - the report is saved; the user can send it from the MINERVIUM app`;
      } catch (e) { emailNote = `EMAIL FAILED (${String(e)}) - the report is saved`; }
    }
    if (isTest) await ctx.sb.from("action_items").update({ loop_enabled: false, safety_emails: [], sub_emails: [] }).eq("report_id", report.id);
    return textResult(`SUBMITTED. Report id: ${report.id}\nAuthor: you (${ctx.user.email}). Action items: ${actionNote}. Email: ${emailNote}.`);
  }

  /* ---------- draft (no write to reports) ---------- */
  let existing: any = null;
  if (a.draft_id) {
    existing = await loadDraft(a.draft_id, ctx);
    if (!existing) return textResult("Draft not found for this user.", true);
    if (existing.status !== "draft") return textResult(`That draft is already ${existing.status}. Start a new draft.`, true);
  }
  const p: Record<string, any> = { ...(existing?.payload || {}) };
  for (const k of STR_FIELDS) if (a[k] !== undefined) p[k] = str(a[k], k === "description" || k === "safety_concern" ? 3000 : 500);
  for (const [k, allowed] of Object.entries(ARR_FIELDS)) {
    if (a[k] === undefined) continue;
    const arr = Array.isArray(a[k]) ? a[k].map((x: unknown) => str(x, 80)) : [];
    const bad = arr.filter((x: string) => !allowed.includes(x));
    if (bad.length) return textResult(`${k}: invalid value(s) ${bad.join(", ")}. Allowed: ${allowed.join(", ")}`, true);
    p[k] = arr;
  }
  if (!existing) { p.project ||= "RSSOM Project"; p.report_date ||= new Date().toISOString().slice(0, 10); p.respondent ||= profile.my_name || ""; if (!p.company && profile.my_company && COMPANY_OPTIONS.includes(profile.my_company)) p.company = profile.my_company; }
  if (p.report_type === "Good Spot" && !p.risk_rating) p.risk_rating = "No Risk";
  const photo: string | null = existing?.photo_data_url || null;
  const v = validate(p, !!photo);
  const hash = await sha(canon(p) + "|" + (photo ? await sha(photo) : "nophoto"));
  let d: any;
  if (existing) {
    const { data } = await adm.from("mcp_report_drafts").update({ payload: p, hash, expires_at: new Date(Date.now() + 864e5).toISOString() }).eq("id", existing.id).eq("user_id", ctx.user.id).select().single();
    d = data;
  } else {
    const { data } = await adm.from("mcp_report_drafts").insert({ user_id: ctx.user.id, payload: p, hash }).select().single();
    d = data;
  }
  if (!d) return textResult("Could not save the draft.", true);
  const rc = v.errors.length ? null : await recipients(ctx, profile, { ...p, description: p.description });
  return textResult(showDraft(d, p, !!photo, photo ? Math.round(photo.length * 0.75 / 1024) : 0, v, rc));
}

async function attachPhoto(a: Record<string, any>, ctx: Ctx) {
  const d = await loadDraft(a.draft_id, ctx);
  if (!d) return textResult("Draft not found for this user.", true);
  if (d.status !== "draft") return textResult(`That draft is already ${d.status}.`, true);
  let bytes: Uint8Array;
  try {
    if (typeof a.image_base64 === "string" && a.image_base64) {
      const b64 = a.image_base64.replace(/^data:[^,]*,/, "").replace(/\s/g, "");
      if (b64.length > MAX_PHOTO_BYTES * 1.4) return textResult("Image too large (max about 2 MB). Send a smaller/compressed photo.", true);
      bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } else if (typeof a.image_url === "string" && a.image_url) {
      const u = new URL(a.image_url);
      if (u.protocol !== "https:" || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/i.test(u.hostname) || /\.(internal|local)$/i.test(u.hostname)) return textResult("image_url must be a public https URL.", true);
      const r = await fetch(u, { signal: AbortSignal.timeout(8000), redirect: "error" });
      if (!r.ok) return textResult(`Could not download the image (${r.status}).`, true);
      const buf = new Uint8Array(await r.arrayBuffer());
      if (buf.length > MAX_PHOTO_BYTES) return textResult("Image too large (max about 2 MB).", true);
      bytes = buf;
    } else return textResult("Provide image_base64 or image_url.", true);
  } catch { return textResult("Could not read the image data.", true); }
  if (bytes.length > MAX_PHOTO_BYTES) return textResult("Image too large (max about 2 MB).", true);
  const mime = bytes[0] === 0xff && bytes[1] === 0xd8 ? "image/jpeg" : bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 ? "image/webp" : null;
  if (!mime) return textResult("Only JPEG, PNG or WebP photos are accepted.", true);
  let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const dataUrl = `data:${mime};base64,${btoa(bin)}`;
  const hash = await sha(canon(d.payload) + "|" + (await sha(dataUrl)));
  await adm.from("mcp_report_drafts").update({ photo_data_url: dataUrl, hash }).eq("id", d.id).eq("user_id", ctx.user.id);
  return textResult(`Photo attached to draft ${d.id} (${Math.round(bytes.length / 1024)} KB, ${mime}). The draft changed: call create_report with draft_id (no confirm) to get the refreshed draft and new draft_hash, show it to the user, and ask them to confirm.`);
}

async function listRecent(a: Record<string, any>, ctx: Ctx) {
  const limit = Math.min(Math.max(parseInt(a.limit) || 10, 1), 25);
  let q = ctx.sb.from("reports").select("id, report_date, report_type, site, location, company, risk_rating, description, created_at, author_id").order("created_at", { ascending: false }).limit(limit);
  if (a.mine_only !== false) q = q.eq("author_id", ctx.user.id);
  const { data, error } = await q;
  if (error) return textResult(`Error: ${error.message}`, true);
  if (!data?.length) return textResult("No reports found.");
  return textResult(data.map((r: any) => `${r.id} | ${r.report_date} | ${r.report_type} | ${r.site || "-"} / ${r.location || "-"} | ${r.company || "-"} | risk: ${r.risk_rating || "-"} | ${String(r.description || "").slice(0, 100)}`).join("\n"));
}

async function reportStatus(a: Record<string, any>, ctx: Ctx) {
  if (typeof a.report_id !== "string" || !/^[0-9a-f-]{36}$/i.test(a.report_id)) return textResult("report_id must be a report UUID (see list_recent_reports).", true);
  const { data: r } = await ctx.sb.from("reports").select("id, report_date, report_type, site, location, company, risk_rating, description, created_at").eq("id", a.report_id).maybeSingle();
  if (!r) return textResult("Report not found.", true);
  const { data: items } = await ctx.sb.from("action_items").select("kind, status, owner, due_date, reviewed_at, correction_submitted_at, closed_at, reminder_count, loop_enabled").eq("report_id", r.id);
  const L = [`Report ${r.id}: ${r.report_type} on ${r.report_date} at ${r.site || "-"} / ${r.location || "-"} (risk: ${r.risk_rating || "-"})`, `Description: ${r.description}`];
  if (!items?.length) L.push("No action items.");
  for (const i of items || []) L.push(`- ${i.kind}: ${i.status} | owner: ${i.owner || "-"} | due: ${i.due_date || "-"} | reviewed: ${i.reviewed_at || "no"} | correction submitted: ${i.correction_submitted_at || "no"} | closed: ${i.closed_at || "no"} | reminders sent: ${i.reminder_count}`);
  return textResult(L.join("\n"));
}

/* ---- tool catalogue ---- */
const S = (description: string, extra: Record<string, unknown> = {}) => ({ type: "string", description, ...extra });
const TOOLS = [
  {
    name: "create_report",
    description: "Draft a MINERVIUM health & safety observation report for the signed-in user, and (only after their explicit confirmation) submit it. STEP 1: call with the fields you gathered (no confirm) -> returns a DRAFT, nothing is saved as a report. To revise, call again with draft_id plus changed fields. Hazard and Closecall reports need a photo (attach_photo). STEP 2: show the user the ENTIRE draft and ask if they want to submit; only if they clearly say yes, call with {confirm:true, draft_id, draft_hash} and nothing else. Never set confirm without the user's explicit yes to the exact draft. Submitting creates the corrective action item and emails the distribution list. Write report text in English unless the user asks otherwise; use only facts the user gave you.",
    annotations: { title: "Draft / submit MINERVIUM report", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    inputSchema: { type: "object", additionalProperties: false, properties: {
      draft_id: S("Existing draft to revise or confirm."),
      confirm: { type: "boolean", description: "true ONLY after the user explicitly approved the full draft. Send with draft_id and draft_hash only." },
      draft_hash: S("The draft_hash from the latest draft shown to the user (required with confirm)."),
      report_type: S("Type of report", { enum: REPORT_TYPES }),
      project: S("Project", { enum: PROJECT_OPTIONS }),
      site: S("Site", { enum: SITE_OPTIONS }),
      location: S(`Location. For OMSF it must be one of: ${BUILDINGS.OMSF.join(", ")}. For SUSS free text (area).`),
      company: S("Reporter's company", { enum: COMPANY_OPTIONS }),
      company_subcontractor: S("Required if company=Subcontractor", { enum: SUBCONTRACTOR_OPTIONS }),
      company_subcontractor_other: S("Subcontractor name if company_subcontractor=Others"),
      company_visitor_name: S("Visitor company name if company=Visitor"),
      respondent: S("Reporter name (defaults to the user's profile name)"),
      subcontractor: S("Subcontractor involved in the observation", { enum: SUBCONTRACTOR_OPTIONS }),
      subcontractor_other: S("Name if subcontractor=Others"),
      action_report_to: S("Subcontractor/party the action report goes to (matches contacts in MINERVIUM)"),
      report_date: S("YYYY-MM-DD, defaults to today"),
      description: S("What was observed (factual, from the user)"),
      safety_concern: S("Why it is a safety concern"),
      hazard_classes: { type: "array", items: { type: "string", enum: HAZARD_CLASSES } },
      hazard_class_other: S("Detail if Others"),
      life_saving_rules: { type: "array", items: { type: "string", enum: LIFE_SAVING } },
      tracking_types: { type: "array", items: { type: "string", enum: TRACKING } },
      tracking_type_other: S("Detail if Others"),
      risk_rating: S("Risk rating (Good Spot defaults to No Risk)", { enum: RISKS }),
      contributing_factors: { type: "array", items: { type: "string", enum: FACTORS } },
      contributing_factor_other: S("Detail if Others"),
      corrective_action: S("Corrective action"), corrective_action_owner: S("Owner"), corrective_close_out_date: S("YYYY-MM-DD (optional; otherwise set automatically)"),
      preventative_action: S("Preventative action"), preventative_action_owner: S("Owner"), preventative_close_out_date: S("YYYY-MM-DD"),
    } },
  },
  {
    name: "attach_photo",
    description: "Attach a photo (JPEG/PNG/WebP, max ~2 MB) to a report DRAFT. Required for Hazard and Closecall reports. Provide image_base64 (raw base64 or data URL) or a public https image_url. After attaching, call create_report with draft_id to get the refreshed draft and hash.",
    annotations: { title: "Attach photo to draft", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: { type: "object", additionalProperties: false, required: ["draft_id"], properties: { draft_id: S("Draft id from create_report"), image_base64: S("Base64 image or data URL"), image_url: S("Public https URL of the image") } },
  },
  {
    name: "list_recent_reports",
    description: "List recent MINERVIUM reports (id, date, type, location, risk). Defaults to the signed-in user's own reports.",
    annotations: { title: "List recent reports", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: "object", additionalProperties: false, properties: { limit: { type: "integer", minimum: 1, maximum: 25 }, mine_only: { type: "boolean", description: "Default true. false = whole team." } } },
  },
  {
    name: "get_report_status",
    description: "Get the status of a report and its corrective/preventative action items (due date, reviewed, correction submitted, closed).",
    annotations: { title: "Report status", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: "object", additionalProperties: false, required: ["report_id"], properties: { report_id: S("Report UUID") } },
  },
];

const HANDLERS: Record<string, (a: Record<string, any>, c: Ctx) => Promise<unknown>> = {
  create_report: createReport, attach_photo: attachPhoto, list_recent_reports: listRecent, get_report_status: reportStatus,
};
const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

async function rpc(msg: any, ctx: Ctx) {
  const { id, method, params } = msg;
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const err = (code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });
  if (method === "initialize") {
    const v = SUPPORTED.includes(params?.protocolVersion) ? params.protocolVersion : SUPPORTED[0];
    return ok({ protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: { name: "minervium", version: "1.0.0" },
      instructions: "MINERVIUM health & safety reporting. Always show the user the full draft and get an explicit yes before calling create_report with confirm=true." });
  }
  if (method === "ping") return ok({});
  if (method === "tools/list") return ok({ tools: TOOLS });
  if (method === "tools/call") {
    const h = HANDLERS[params?.name];
    if (!h) return err(-32602, "Unknown tool");
    try { return ok(await h(params?.arguments || {}, ctx)); }
    catch (e) { console.error(e); return ok(textResult("Internal error: " + String(e), true)); }
  }
  return err(-32601, "Method not found");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const path = new URL(req.url).pathname;
  if (path.endsWith("/.well-known/oauth-protected-resource")) {
    return json({ resource: FN_URL, authorization_servers: [`${SB_URL}/auth/v1`], bearer_methods_supported: ["header"], resource_name: "MINERVIUM" });
  }
  const ctx = await authenticate(req);
  if (!ctx) return unauthorized();
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { ...cors, Allow: "POST" } });
  let body: any;
  try { body = await req.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.filter((m) => m.id !== undefined).map((m) => rpc(m, ctx))));
    return out.length ? json(out) : new Response(null, { status: 202, headers: cors });
  }
  if (body.id === undefined) return new Response(null, { status: 202, headers: cors }); // notification
  return json(await rpc(body, ctx));
});
