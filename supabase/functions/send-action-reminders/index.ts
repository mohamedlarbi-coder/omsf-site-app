// supabase/functions/send-action-reminders/index.ts
//
// Sends a reminder email for every OPEN action item that hasn't had a
// reminder sent in the last 3 days (or has never had one, and is at
// least 3 days old). Meant to run once a day on a schedule — see the
// pg_cron setup in schema_add_action_reminders_cron.sql.
//
// SETUP REQUIRED before this does anything:
// 1. Sign up for an email-sending API (Resend is the easiest: resend.com,
//    free tier is plenty for this volume). Get an API key.
// 2. In the Supabase dashboard: Edge Functions -> Secrets, add:
//      RESEND_API_KEY = <your key>
//      REMINDER_FROM_EMAIL = alerts@yourdomain.com  (must be a domain
//      you've verified with Resend, or use their onboarding@resend.dev
//      sandbox address while testing)
// 3. Deploy this function:  supabase functions deploy send-action-reminders
// 4. Run schema_add_action_reminders_cron.sql to schedule it daily.
//
// I can't test this end-to-end from here -- it needs to run inside
// your actual Supabase project with real credentials.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REMINDER_INTERVAL_DAYS = 3;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cutoff = new Date(Date.now() - REMINDER_INTERVAL_DAYS * 86400000).toISOString();

    // Open items that either never got a reminder (and are old enough)
    // or haven't been reminded in 3+ days.
    const { data: items, error } = await supabase
      .from("action_items")
      .select("*, reports(location, action_report_to, project)")
      .eq("status", "Open")
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lte.${cutoff}`)
      .lte("created_at", cutoff);

    if (error) throw error;
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    const { data: subcontractors } = await supabase.from("subcontractors").select("*");

    let sent = 0;
    for (const item of items) {
      const emails = new Set();

      // Base distribution: whoever owns the underlying report's
      // distribution list. Simplification for v1 -- uses a fixed base
      // list rather than per-report distribution; adjust if your
      // reports table stores that differently.
      const { data: baseProfiles } = await supabase.from("profiles").select("distribution_list").not("distribution_list", "is", null);
      (baseProfiles || []).forEach((p) => {
        (p.distribution_list || "").split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).forEach((e: string) => emails.add(e));
      });

      // Add the assigned subcontractor's contacts, if any.
      const sub = (subcontractors || []).find(
        (s: any) => s.name.trim().toLowerCase() === (item.subcontractor || "").trim().toLowerCase()
      );
      (sub?.contact_emails || []).forEach((e: string) => emails.add(e));

      if (emails.size === 0) continue;

      const ageDays = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000);
      const subject = `[Reminder] Open ${item.kind} Action - ${item.location || "OMSF"} - ${ageDays} days old`;
      const body = `
This ${item.kind.toLowerCase()} action item is still open:

"${item.description}"

Location: ${item.location || "-"}
Assigned to: ${item.subcontractor || item.owner || "Unassigned"}
Open for: ${ageDays} day(s)
Due date: ${item.due_date || "Not set"}

Please take action and submit a closure photo in MINERVIUM once resolved.
This reminder repeats every ${REMINDER_INTERVAL_DAYS} days until the item is closed.
      `.trim();

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("REMINDER_FROM_EMAIL"),
          to: Array.from(emails),
          subject,
          text: body,
        }),
      });

      if (res.ok) {
        await supabase.from("action_items").update({ last_reminder_sent_at: new Date().toISOString() }).eq("id", item.id);
        sent++;
      } else {
        console.error("Email send failed for item", item.id, await res.text());
      }
    }

    return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
