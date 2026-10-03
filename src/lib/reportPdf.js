/* ---------------------------------------------------------------------------
   MINERVIUM — Report PDF builder.

   Builds the same "Good Spot / Hazard Report Form" layout as the official
   Connect 6ix HS Internal FORM 2.0 / the existing Word export, as a real
   vector PDF (jsPDF — no headless browser, no screenshot rasterization).

   One function builds the jsPDF document; everything else (preview, download,
   base64 for email attachment) just reads the result back in a different
   format, so there is exactly one layout to keep in sync.
--------------------------------------------------------------------------- */

import { jsPDF } from "jspdf";
import {
  REPORT_TYPES, HAZARD_CLASSES, TRACKING_TYPES, CONTRIBUTING_FACTORS,
  RISK_RATINGS, riskBarInfo,
} from "./constants";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TAN = [242, 233, 216];
const BORDER = [153, 153, 153];
const TEXT = [26, 26, 26];
const MUTED = [102, 102, 102];

/* jsPDF's core fonts (Helvetica) only support WinAnsi encoding — there is no
   ☐/☒ glyph to draw as text. Checkboxes are drawn as real little squares
   instead, with the label placed after each one, wrapping to a new line
   when a row runs out of width. */
function drawCheckRow(doc, items, x, y, maxWidth, { fontSize = 9.5, bold = false } = {}) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  const boxSize = fontSize * 0.8;
  const gapAfterBox = 4;
  const itemGap = 14;
  const lineH = fontSize + 6;
  let cx = x;
  let cy = y + fontSize;

  for (const { label, checked } of items) {
    const textW = doc.getTextWidth(label);
    const itemW = boxSize + gapAfterBox + textW;
    if (cx !== x && cx + itemW > x + maxWidth) {
      cx = x;
      cy += lineH;
    }
    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.75);
    doc.rect(cx, cy - boxSize, boxSize, boxSize);
    if (checked) {
      doc.setFillColor(40, 40, 40);
      doc.rect(cx + 1, cy - boxSize + 1, boxSize - 2, boxSize - 2, "F");
    }
    doc.setTextColor(...TEXT);
    doc.text(label, cx + boxSize + gapAfterBox, cy);
    cx += itemW + itemGap;
  }
  return cy + lineH - fontSize;
}

export async function buildReportPdf(report, profile) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  let y = MARGIN;

  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Good Spot / Hazard Report Form", MARGIN, y + 6);
  y += 26;

  /* --- Header table ------------------------------------------------- */
  const col1 = 115, col2 = 225, col3 = CONTENT_W - col1 - col2;
  const row1H = 20;
  const row2H = 32;

  drawCell(doc, MARGIN, y, col1, row1H, { fill: TAN, bold: true, text: "Project:" });
  drawCell(doc, MARGIN + col1, y, col2, row1H, { text: report.project || "" });
  drawCell(doc, MARGIN + col1 + col2, y, col3, row1H, { text: "Report Date: " + (report.report_date || "") });
  y += row1H;

  drawCell(doc, MARGIN, y, col1, row2H, { fill: TAN, bold: true, text: "Action Report to:" });
  drawCell(doc, MARGIN + col1, y, col2, row2H, { text: report.action_report_to || "" });
  drawCell(doc, MARGIN + col1 + col2, y, col3, row2H, {
    lines: [`Respondent: ${report.respondent || ""}`, `Company: ${report.company || ""}`],
  });
  y += row2H + 10;

  /* --- Report type row ------------------------------------------------ */
  y = drawCheckRow(
    doc,
    REPORT_TYPES.map((t) => ({ label: t, checked: report.report_type === t })),
    MARGIN, y, CONTENT_W, { fontSize: 10.5, bold: true }
  );
  y += 8;

  /* --- Risk bar --------------------------------------------------------- */
  if (report.risk_rating) {
    const info = riskBarInfo(report.risk_rating);
    doc.setFillColor(...hexToRgb(info.color));
    doc.rect(MARGIN, y, CONTENT_W, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(info.barLabel, MARGIN + 12, y + 16);
    doc.setFontSize(10);
    doc.text(report.risk_rating, MARGIN + CONTENT_W - 12, y + 16, { align: "right" });
    doc.setTextColor(...TEXT);
    y += 24 + 10;
  }

  /* --- Location / Description / Safety Concern + photo ----------------- */
  const leftW = CONTENT_W * 0.68;
  const rightW = CONTENT_W - leftW;
  const locH = 20;
  doc.setFontSize(9.5);
  const descLines = doc.splitTextToSize(report.description || "—", leftW - 16);
  const concernLines = doc.splitTextToSize(report.safety_concern || "—", leftW - 16);
  const descH = Math.max(32, 18 + descLines.length * 11.5);
  const concernH = Math.max(32, 18 + concernLines.length * 11.5);
  const totalBoxH = locH + descH + concernH;

  const locationText = `Location / Area: ${report.site ? report.site + " — " : ""}${report.location || ""}`;
  drawCell(doc, MARGIN, y, leftW, locH, { fill: TAN, bold: true, text: locationText });
  drawCell(doc, MARGIN, y + locH, leftW, descH, { boldLabel: "Description:", lines: descLines });
  drawCell(doc, MARGIN, y + locH + descH, leftW, concernH, { boldLabel: "Safety Concern:", lines: concernLines });

  // Photo box spans the full right-hand height
  doc.setDrawColor(...BORDER);
  doc.rect(MARGIN + leftW, y, rightW, totalBoxH);
  if (report.photo_data_url) {
    try {
      const fmt = report.photo_data_url.includes("image/png") ? "PNG" : "JPEG";
      const pad = 8;
      const maxW = rightW - pad * 2;
      const maxH = totalBoxH - pad * 2;
      const dim = doc.getImageProperties(report.photo_data_url);
      const ratio = Math.min(maxW / dim.width, maxH / dim.height);
      const w = dim.width * ratio;
      const h = dim.height * ratio;
      doc.addImage(
        report.photo_data_url, fmt,
        MARGIN + leftW + (rightW - w) / 2, y + (totalBoxH - h) / 2, w, h
      );
    } catch (e) {
      photoPlaceholder(doc, MARGIN + leftW, y, rightW, totalBoxH);
    }
  } else {
    photoPlaceholder(doc, MARGIN + leftW, y, rightW, totalBoxH);
  }
  y += totalBoxH + 14;

  /* --- Checklists -------------------------------------------------------- */
  y = drawChecklistSection(doc, y, "Hazard Classification", HAZARD_CLASSES, report.hazard_classes || [], report.hazard_class_other);
  y = drawChecklistSection(doc, y, "Tracking Type", TRACKING_TYPES, report.tracking_types || [], report.tracking_type_other);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text("Risk Rating", MARGIN, y);
  y += 14;
  y = drawCheckRow(
    doc,
    RISK_RATINGS.map((r) => ({ label: r.label, checked: report.risk_rating === r.key })),
    MARGIN, y, CONTENT_W, { fontSize: 9.5, bold: true }
  );
  y += 10;

  y = drawChecklistSection(doc, y, "Contributing Factors", CONTRIBUTING_FACTORS, report.contributing_factors || [], report.contributing_factor_other);
  y += 6;

  /* --- Corrective action -------------------------------------------------- */
  y = drawActionBlock(doc, y, "Corrective Action:", report.corrective_action, report.corrective_action_owner, report.corrective_close_out_date);

  /* --- Page 2: preventative action + footer -------------------------------- */
  doc.addPage();
  y = MARGIN;
  y = drawActionBlock(doc, y, "Preventative Action:", report.preventative_action, report.preventative_action_owner, report.preventative_close_out_date);
  y += 16;

  const fcol1 = 150;
  drawCell(doc, MARGIN, y, fcol1, 20, { fill: TAN, bold: true, text: "Reviewed by:" });
  drawCell(doc, MARGIN + fcol1, y, CONTENT_W - fcol1, 20, { text: report.reviewed_by || "" });
  y += 20;
  drawCell(doc, MARGIN, y, fcol1, 20, { fill: TAN, bold: true, text: "EcoOnline #:" });
  drawCell(doc, MARGIN + fcol1, y, CONTENT_W - fcol1, 20, { text: report.eco_online_num || "" });
  y += 32;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  const defs = "OFI: a situation where a process or system can be enhanced but is not necessarily non-compliant with current standards. " +
    "Good Spot: an optimal workplace environment where safety measures are effectively implemented. " +
    "Hazard: any source of potential damage, harm or adverse health effects. " +
    "Closecall: an unplanned event that could have resulted in injury, damage, or harm but did not, due to chance or timely intervention.";
  const defLines = doc.splitTextToSize(defs, CONTENT_W);
  doc.text(defLines, MARGIN, y);
  y += defLines.length * 9.5 + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT);
  doc.text("Connect 6ix – HS Internal FORM – 2.0", MARGIN, y);
  y += 12;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Generated with the MINERVIUM app", MARGIN, y);

  return doc;
}

/* --- drawing helpers ------------------------------------------------------- */

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function photoPlaceholder(doc, x, y, w, h) {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(136, 136, 136);
  doc.text("No photo attached", x + w / 2, y + h / 2, { align: "center" });
  doc.setTextColor(...TEXT);
}

function drawCell(doc, x, y, w, h, opts) {
  doc.setDrawColor(...BORDER);
  if (opts.fill) {
    doc.setFillColor(...opts.fill);
    doc.rect(x, y, w, h, "FD");
  } else {
    doc.rect(x, y, w, h);
  }
  doc.setTextColor(...TEXT);
  const padX = 8;
  let ty = y + 13;
  doc.setFontSize(9.5);
  if (opts.lines) {
    if (opts.boldLabel) {
      doc.setFont("helvetica", "bold");
      doc.text(opts.boldLabel, x + padX, ty);
      ty += 11.5;
    }
    doc.setFont("helvetica", "normal");
    doc.text(opts.lines, x + padX, ty);
  } else {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.text(opts.text || "", x + padX, y + h / 2 + 3.5);
  }
}

function drawChecklistSection(doc, y, title, items, selected, otherVal) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text(title, MARGIN, y);
  y += 14;

  const rowItems = items.map((it) => ({
    label: it === "Others" ? `Others: ${otherVal || "___________"}` : it,
    checked: selected.includes(it),
  }));
  y = drawCheckRow(doc, rowItems, MARGIN, y, CONTENT_W, { fontSize: 9.5 });
  return y + 12;
}

function drawActionBlock(doc, y, label, text, owner, closeDate) {
  const col1 = CONTENT_W * 0.56, col2 = CONTENT_W * 0.22, col3 = CONTENT_W - col1 - col2;
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(text || "—", col1 - 16);
  const rowH = Math.max(34, 18 + lines.length * 11.5);

  drawCell(doc, MARGIN, y, col1, rowH, { boldLabel: label, lines });
  drawCell(doc, MARGIN + col1, y, col2, rowH, { bold: true, text: "Photo: (as required)" });
  drawCell(doc, MARGIN + col1 + col2, y, col3, rowH, { bold: true, text: "Close Out: " + (closeDate || "") });
  y += rowH;
  drawCell(doc, MARGIN, y, CONTENT_W, 20, { fill: TAN, bold: true, text: "Action Owner: " + (owner || "") });
  return y + 20;
}

/* --- public helpers --------------------------------------------------------- */

export async function downloadReportPdf(report, profile) {
  const doc = await buildReportPdf(report, profile);
  const safeLoc = (report.location || "report").replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
  doc.save(`Hazard_Report_${safeLoc}_${report.report_date}.pdf`);
}

export async function previewReportPdf(report, profile) {
  const doc = await buildReportPdf(report, profile);
  const url = doc.output("bloburl");
  window.open(url, "_blank");
}

/** Base64 (no data: prefix) — what the send-report-email Edge Function attaches. */
export async function reportPdfBase64(report, profile) {
  const doc = await buildReportPdf(report, profile);
  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1];
}
