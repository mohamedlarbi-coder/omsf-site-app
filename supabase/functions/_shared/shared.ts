// Shared helpers for the corrective-action loop (copied next to each function that uses them).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const APP = "https://omsf-site-app.vercel.app";
export const SENDER = "MINERVIUM <reports@minerviumlabs.com>";
export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const jsonRes = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

export const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

export const esc = (v: unknown) =>
  String(v ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- Dates (Mon–Fri business days, Toronto time; holidays not considered) ---------- */
export const torontoToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
const toUtc = (s: string) => new Date(s + "T00:00:00Z");
const fmt = (d: Date) => d.toISOString().slice(0, 10);
export function addBusinessDays(s: string, n: number) {
  const d = toUtc(s); let k = 0;
  while (k < n) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) k++; }
  return fmt(d);
}
/** Business days after `due` up to and including `today` (0 if not overdue). */
export function businessDaysOverdue(due: string, today: string) {
  const d = toUtc(due), t = toUtc(today); let n = 0;
  while (d < t) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}
export const prettyDate = (s?: string | null) =>
  s ? toUtc(s).toLocaleDateString("en-CA", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }) : "—";

/* ---------- Personal links ---------- */
export const linkUrl = (token: string) => `${APP}/a/${token}`;
// deno-lint-ignore no-explicit-any
export async function ensureLinks(sb: any, actionId: string): Promise<{ sub: string; safety: string }> {
  const { data: existing } = await sb.from("action_links").select("token, role").eq("action_id", actionId);
  const out: Record<string, string> = {};
  for (const r of existing || []) out[r.role] = r.token;
  for (const role of ["sub", "safety"]) {
    if (!out[role]) {
      const { data, error } = await sb.from("action_links").insert({ action_id: actionId, role }).select("token").single();
      if (error) throw error;
      out[role] = data.token;
    }
  }
  return { sub: out.sub, safety: out.safety };
}

/* ---------- Email ---------- */
export async function sendEmail(p: { to: string[]; subject: string; text: string; html: string; attachments?: unknown[] }) {
  const to = [...new Set(p.to.map((e) => e.trim()).filter(Boolean))];
  if (!to.length) return { ok: false, skipped: true };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: SENDER, to, subject: p.subject, text: p.text, html: p.html, ...(p.attachments?.length ? { attachments: p.attachments } : {}) }),
  });
  if (!res.ok) console.error("Resend error:", await res.text());
  return { ok: res.ok };
}

const TONES: Record<string, [string, string, string]> = {
  red: ["#FDECEC", "#F5C2C2", "#B42318"],
  amber: ["#FFF6E0", "#F1D58C", "#8A5A00"],
  green: ["#E7F7EE", "#B5E3C8", "#1B7A47"],
  teal: ["#E6F7F7", "#B7E4E5", "#117F81"],
};

export function emailHtml(o: {
  banner?: { label: string; text: string; tone: "red" | "amber" | "green" | "teal" };
  intro: string; // HTML allowed (already escaped by caller where needed)
  rows?: [string, string][];
  quote?: { label: string; text: string };
  imageUrl?: string;
  button?: { label: string; url: string; note?: string };
  after?: string[]; // paragraphs (HTML)
  footnote?: string;
}) {
  const b = o.banner;
  const t = b ? TONES[b.tone] : null;
  const rows = (o.rows || []).map(([k, v]) =>
    `<tr><td style="padding:7px 12px 7px 0;color:#5C6870;font-size:14px;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:7px 0;color:#0d1b26;font-size:14px;font-weight:600;">${esc(v)}</td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#EEF2F4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F4;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<tr><td align="center" style="background:#08131D;padding:22px 16px 16px;"><img src="${APP}/branding/email/lockup.png" width="170" alt="MINERVIUM" style="display:block;border:0;height:auto;max-width:170px;"></td></tr>
<tr><td style="height:3px;background:#18C9CB;line-height:3px;font-size:3px;">&nbsp;</td></tr>
${b ? `<tr><td style="background:${t![0]};border-bottom:1px solid ${t![1]};padding:14px 28px;"><div style="font-size:12px;font-weight:800;letter-spacing:0.09em;text-transform:uppercase;color:${t![2]};">${esc(b.label)}</div><div style="font-size:15px;color:#0d1b26;margin-top:3px;">${b.text}</div></td></tr>` : ""}
<tr><td style="padding:26px 28px 6px;color:#0d1b26;font-size:15px;line-height:1.6;">
<p style="margin:0 0 12px;">Hello,</p>
<p style="margin:0 0 18px;">${o.intro}</p>
${rows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="border-top:1px solid #E3E8EB;width:100%;">${rows}</table>` : ""}
${o.quote ? `<p style="margin:18px 0 4px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#18A7A9;">${esc(o.quote.label)}</p><p style="margin:0 0 8px;padding:10px 14px;background:#F4F7F8;border-left:3px solid #18C9CB;border-radius:6px;">${esc(o.quote.text)}</p>` : ""}
${o.imageUrl ? `<p style="margin:10px 0;"><img src="${o.imageUrl}" alt="Photo" style="max-width:100%;border-radius:10px;border:1px solid #E3E8EB;"></p>` : ""}
${o.button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 8px;"><tr><td align="center" style="background:#18C9CB;border-radius:10px;"><a href="${o.button.url}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:800;color:#06222A;text-decoration:none;">${esc(o.button.label)}</a></td></tr></table>${o.button.note ? `<p style="margin:0 0 18px;text-align:center;color:#73828B;font-size:12.5px;">${esc(o.button.note)}</p>` : ""}` : ""}
${(o.after || []).map((p) => `<p style="margin:0 0 10px;">${p}</p>`).join("")}
<p style="margin:10px 0 4px;color:#73828B;font-size:12.5px;">${esc(o.footnote || "This is an automated notification generated by the MINERVIUM Safety Application.")}</p>
</td></tr>
<tr><td style="padding:10px 28px 26px;"><table role="presentation" cellpadding="0" cellspacing="0" style="border-top:1px solid #E3E8EB;width:100%;"><tr>
<td style="padding-top:16px;width:64px;vertical-align:middle;"><img src="${APP}/branding/email/emblem.png" width="52" alt="" style="display:block;border:0;height:auto;"></td>
<td style="padding-top:16px;vertical-align:middle;font-size:13px;line-height:1.5;color:#0d1b26;"><b style="font-size:14px;">MINERVIUM Safety</b><br>Ontario Line RSSOM &middot; OMSF<br><span style="color:#18A7A9;font-weight:600;">Observe &bull; Share &bull; Prevent &bull; Improve</span></td>
</tr></table></td></tr>
</table></td></tr></table></body></html>`;
}

export function plain(lines: (string | false | undefined | null)[]) {
  return lines.filter((l) => l !== false && l !== undefined && l !== null).join("\n");
}
