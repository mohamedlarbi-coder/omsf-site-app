import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

// Public, no-login page opened from the personal email link (/a/<token>).
// Role "sub" (subcontractor): see the issue, add a correction photo + note.
// Role "safety": review the correction — Verify & close, or send back.

const EVENT_LABEL = {
  reported: "Reported",
  reviewed: "Reviewed by safety",
  correction_submitted: "Correction submitted",
  sent_back: "Sent back",
  closed: "Closed · verified",
  closed_in_person: "Closed in person · verified on site",
  reminder: "Reminder sent",
  escalation_pending: "Escalation flagged",
};

const fmt = (d) => (d ? new Date(d).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "");
const prettyDue = (s) => (s ? new Date(s + "T00:00:00Z").toLocaleDateString("en-CA", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }) : "—");

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
async function fileToDataUrl(file, max = 1400) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } finally { URL.revokeObjectURL(url); }
}

/* ---- Photo with optional circle / arrow markup ---- */
function Markup({ src, onChange }) {
  const cv = useRef(null);
  const imgRef = useRef(null);
  const shapes = useRef([]);
  const [tool, setTool] = useState("none");
  const start = useRef(null);

  const draw = (extra) => {
    const c = cv.current, img = imgRef.current;
    if (!c || !img) return;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, c.width, c.height);
    ctx.strokeStyle = "#ff3b30"; ctx.fillStyle = "#ff3b30";
    ctx.lineWidth = Math.max(4, c.width / 140); ctx.lineCap = "round";
    [...shapes.current, ...(extra ? [extra] : [])].forEach((s) => {
      if (s.t === "circle") {
        const r = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        ctx.beginPath(); ctx.arc(s.x1, s.y1, r, 0, Math.PI * 2); ctx.stroke();
      } else {
        const a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1), h = ctx.lineWidth * 4;
        ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.x2, s.y2);
        ctx.lineTo(s.x2 - h * Math.cos(a - 0.45), s.y2 - h * Math.sin(a - 0.45));
        ctx.lineTo(s.x2 - h * Math.cos(a + 0.45), s.y2 - h * Math.sin(a + 0.45));
        ctx.closePath(); ctx.fill();
      }
    });
  };
  const emit = () => onChange(cv.current.toDataURL("image/jpeg", 0.85));

  useEffect(() => {
    shapes.current = [];
    loadImage(src).then((img) => {
      imgRef.current = img;
      cv.current.width = img.width; cv.current.height = img.height;
      draw(); emit();
    });
    // eslint-disable-next-line
  }, [src]);

  const pos = (e) => {
    const r = cv.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * cv.current.width, y: ((e.clientY - r.top) / r.height) * cv.current.height };
  };
  const down = (e) => { if (tool === "none") return; cv.current.setPointerCapture(e.pointerId); start.current = pos(e); };
  const move = (e) => { if (!start.current) return; const p = pos(e); draw({ t: tool, x1: start.current.x, y1: start.current.y, x2: p.x, y2: p.y }); };
  const up = (e) => {
    if (!start.current) return;
    const p = pos(e);
    if (Math.hypot(p.x - start.current.x, p.y - start.current.y) > 8) shapes.current.push({ t: tool, x1: start.current.x, y1: start.current.y, x2: p.x, y2: p.y });
    start.current = null; draw(); emit();
  };
  const undo = () => { shapes.current.pop(); draw(); emit(); };

  const Btn = ({ id, children }) => (
    <button type="button" onClick={() => setTool(tool === id ? "none" : id)}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${tool === id ? "bg-teal-500 text-slate-900 border-teal-500" : "border-slate-600 text-slate-300"}`}>{children}</button>
  );
  return (
    <div>
      <canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={up}
        className="w-full rounded-xl border border-slate-700" style={{ touchAction: tool === "none" ? "auto" : "none" }} />
      <div className="flex gap-2 mt-2 items-center flex-wrap">
        <span className="text-xs text-slate-400">Mark the fix (optional):</span>
        <Btn id="circle">◯ Circle</Btn><Btn id="arrow">➜ Arrow</Btn>
        <button type="button" onClick={undo} className="px-3 py-1.5 rounded-lg text-sm border border-slate-600 text-slate-300">Undo</button>
      </div>
    </div>
  );
}

function Shell({ children, onBack }) {
  return (
    <div className="min-h-screen bg-[#08131D] text-slate-100 font-sans">
      <div className="bg-[#08131D] border-b-[3px] border-[#18C9CB] py-4 flex justify-center">
        <img src="/branding/email/lockup.png" alt="MINERVIUM" className="h-9" onError={(e) => (e.currentTarget.style.display = "none")} />
      </div>
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {onBack && <button onClick={onBack} className="text-sm font-semibold text-teal-300">← Back to report</button>}
        {children}
      </div>
    </div>
  );
}
const Card = ({ children, className = "" }) => <div className={`bg-[#0d1b26] border border-slate-800 rounded-2xl p-4 ${className}`}>{children}</div>;
const Row = ({ k, v }) => (
  <div className="flex gap-3 py-1.5 text-sm"><div className="w-28 shrink-0 text-slate-400">{k}</div><div className="font-semibold break-words min-w-0">{v || "—"}</div></div>
);

function Trail({ events }) {
  const list = events.filter((e) => e.kind !== "reminder");
  return (
    <Card>
      <div className="text-xs font-bold uppercase tracking-wide text-teal-400 mb-2">Status trail</div>
      <div className="space-y-3">
        {list.map((e, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">{EVENT_LABEL[e.kind] || e.kind}</div>
              <div className="text-xs text-slate-500">{[e.actor, fmt(e.created_at)].filter(Boolean).join(" · ")}</div>
              {e.note && <div className="text-sm text-slate-300 mt-1 break-words">{e.note}</div>}
              {e.photo_url && <img src={e.photo_url} alt="" className="mt-2 rounded-lg border border-slate-700 max-h-56" />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ActionPage({ token, actionId, onBack }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [rawPhoto, setRawPhoto] = useState(null);
  const [markedPhoto, setMarkedPhoto] = useState(null);
  const [comment, setComment] = useState("");
  const [sendBack, setSendBack] = useState(false);
  const [newDue, setNewDue] = useState("");
  const [msg, setMsg] = useState("");

  async function call(payload) {
    const { data: d, error } = await supabase.functions.invoke("action-public", { body: token ? { token, ...payload } : { action_id: actionId, ...payload } });
    if (error) {
      let code = "server_error";
      try { code = (await error.context.json()).error || code; } catch { /* ignore */ }
      throw new Error(code);
    }
    return d;
  }
  const load = async () => {
    try { setData(await call({ op: "get" })); }
    catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token, actionId]);

  if (err) {
    const text = err === "expired" ? "This link has expired." : err === "invalid_link" ? "This link isn't valid." : "Something went wrong. Please try again.";
    return <Shell onBack={onBack}><Card><div className="font-bold mb-1">{text}</div><div className="text-sm text-slate-400">Ask the safety team to resend the link.</div></Card></Shell>;
  }
  if (!data) return <Shell onBack={onBack}><div className="text-center text-slate-400 py-10">Loading…</div></Shell>;

  const { role, action, report, events, photoRequired, canAct } = data;
  const closed = action.status === "Closed";
  const waiting = action.status === "Correction submitted";
  const loc = [report.site, report.location].filter(Boolean).join(" — ");

  async function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setRawPhoto(await fileToDataUrl(f));
  }
  async function run(payload, okMsg) {
    setBusy(true); setMsg("");
    try { await call(payload); setMsg(okMsg); setSendBack(false); setComment(""); setNote(""); setRawPhoto(null); setMarkedPhoto(null); await load(); window.scrollTo(0, 0); }
    catch (e) {
      setMsg({ needs_note: "Please add a short note.", needs_photo: "A photo is required.", needs_comment: "Please add a comment.", closed: "Already closed." }[e.message] || "Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  const summary = (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-bold">{report.report_type}</div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${closed ? "bg-emerald-500/20 text-emerald-300" : waiting ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>{action.status}</span>
      </div>
      {report.photo && <img src={report.photo} alt="Reported" className="w-full rounded-xl border border-slate-700 mb-3" />}
      <Row k="Location" v={loc} />
      <Row k="Risk" v={report.risk_rating} />
      <Row k="Reported" v={report.report_date} />
      <Row k={role === "sub" ? "Reported by" : "Submitted by"} v={report.by} />
      {!closed && <Row k="Due" v={prettyDue(action.due_date)} />}
      <Row k="Issue" v={report.description} />
    </Card>
  );

  const flash = msg && <div className="text-sm font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-3">{msg}</div>;

  const correctionForm = (
          <Card>
    <div className="font-bold mb-3">{canAct ? "Upload the correction" : "Your correction"}</div>
    {!rawPhoto ? (
      <label className="block w-full text-center py-8 rounded-xl border-2 border-dashed border-teal-500/50 text-teal-300 font-semibold cursor-pointer">
        📷 Take or choose a photo{photoRequired ? "" : " (optional)"}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      </label>
    ) : (
      <div>
        <Markup src={rawPhoto} onChange={setMarkedPhoto} />
        <button type="button" className="text-xs text-slate-400 underline mt-2" onClick={() => { setRawPhoto(null); setMarkedPhoto(null); }}>Remove photo</button>
      </div>
    )}
    <label className="block text-sm text-slate-400 mt-4 mb-1">What was done?</label>
    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Harness anchor point installed, crew briefed"
      className="w-full rounded-xl border border-slate-700 bg-[#08131D] px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500" />
    <button disabled={!canSubmit || busy} onClick={() => run({ op: "submit", note, photo: markedPhoto || rawPhoto || "" }, "Correction sent to the safety team.")}
      className="w-full mt-4 bg-teal-500 disabled:opacity-50 text-slate-900 font-extrabold py-3.5 rounded-xl">{busy ? "Sending…" : "Send to safety team"}</button>
  </Card>
  );

  /* ---------- Subcontractor ---------- */
  if (role === "sub") {
    const canSubmit = note.trim().length >= 3 && (!photoRequired || markedPhoto || rawPhoto);
    return (
      <Shell onBack={onBack}>
        {flash}
        {summary}
        {closed ? (
          <Card><div className="font-bold text-emerald-300">Closed · verified. Thank you.</div></Card>
        ) : waiting ? (
          <Card><div className="font-bold">Correction sent</div><div className="text-sm text-slate-400 mt-1">The safety team is reviewing it. You'll get an email if anything more is needed.</div></Card>
        ) : (
          correctionForm
        )}
        <Trail events={events} />
      </Shell>
    );
  }

  /* ---------- Safety ---------- */
  const lastCorrection = [...events].reverse().find((e) => e.kind === "correction_submitted");
  return (
    <Shell onBack={onBack}>
      {flash}
      {summary}
      {report.corrective_action && <Card><div className="text-xs font-bold uppercase tracking-wide text-teal-400 mb-1">Corrective action requested</div><div className="text-sm">{report.corrective_action}</div></Card>}
      {closed ? (
        <Card><div className="font-bold text-emerald-300">Closed · verified.</div></Card>
      ) : waiting && lastCorrection ? (
        <Card>
          <div className="font-bold mb-2">Review the correction</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {report.photo && <div><div className="text-xs text-slate-400 mb-1">Before</div><img src={report.photo} alt="" className="rounded-lg border border-slate-700" /></div>}
            {lastCorrection.photo_url && <div><div className="text-xs text-slate-400 mb-1">After</div><img src={lastCorrection.photo_url} alt="" className="rounded-lg border border-slate-700" /></div>}
          </div>
          <div className="text-sm text-slate-300 mb-4">{lastCorrection.note}</div>
          {sendBack ? (
            <div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="What still needs to be done?"
                className="w-full rounded-xl border border-slate-700 bg-[#08131D] px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <label className="block text-sm text-slate-400 mt-3 mb-1">New due date (optional — default next business day)</label>
              <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className="rounded-xl border border-slate-700 bg-[#08131D] px-3 py-2" />
              <button disabled={busy || comment.trim().length < 3} onClick={() => run({ op: "review", decision: "send_back", comment, new_due_date: newDue || undefined }, "Sent back to the subcontractor.")}
                className="w-full mt-4 bg-red-500 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl">Send back</button>
              <button className="w-full mt-2 text-slate-400 text-sm py-2" onClick={() => setSendBack(false)}>Cancel</button>
            </div>
          ) : (
            <div className="space-y-2">
              <button disabled={busy} onClick={() => run({ op: "review", decision: "close" }, "Closed and verified. Everyone was notified.")} className="w-full bg-teal-500 disabled:opacity-50 text-slate-900 font-extrabold py-3.5 rounded-xl">Verify &amp; close</button>
              <button disabled={busy} onClick={() => setSendBack(true)} className="w-full border border-red-400/60 text-red-300 font-bold py-3 rounded-xl">Send back with a comment</button>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="font-bold mb-1">{action.status === "Reviewed" ? "Reviewed — waiting for the subcontractor" : "Waiting for the subcontractor"}</div>
          <div className="text-sm text-slate-400 mb-3">{action.status === "Reviewed" ? "You marked this reviewed." : "Mark it reviewed so the team knows someone has seen it."}</div>
          {action.status === "Open" && (
            <button disabled={busy} onClick={() => run({ op: "review", decision: "reviewed" }, "Marked as reviewed.")} className="w-full bg-teal-500 disabled:opacity-50 text-slate-900 font-extrabold py-3.5 rounded-xl">I've reviewed this</button>
          )}
        </Card>
      )}
      {canAct && !closed && !waiting && (
        <>
          {correctionForm}
          <Card>
            <div className="font-bold mb-1">Already resolved on site?</div>
            <div className="text-sm text-slate-400 mb-3">Spoke with the subcontractor in person? Close it now with a short note.</div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="e.g. Verified on site with the foreman, harness anchor installed"
              className="w-full rounded-xl border border-slate-700 bg-[#08131D] px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button disabled={busy || comment.trim().length < 3} onClick={() => run({ op: "review", decision: "close", comment }, "Closed in person.")}
              className="w-full mt-3 border border-teal-500/60 text-teal-300 disabled:opacity-50 font-bold py-3 rounded-xl">Close in person</button>
          </Card>
        </>
      )}
      <Trail events={events} />
    </Shell>
  );
}
