import React, { useState } from "react";
import { ChevronLeft, FileDown, Send, Trash2, Loader2, MapPin } from "lucide-react";
import { riskBarInfo, buildReportEmail, getDocxLib, compositePinOnMap, REPORT_TYPES, RISK_RATINGS, HAZARD_CLASSES, TRACKING_TYPES, CONTRIBUTING_FACTORS } from "../lib/constants";

function RiskBar({ riskRatingKey }) {
  if (!riskRatingKey) return null;
  const info = riskBarInfo(riskRatingKey);
  return (
    <div className="rounded-xl overflow-hidden border border-stone-200">
      <div className="px-4 py-2.5 flex items-center justify-between text-white font-bold text-sm tracking-wide" style={{ backgroundColor: info.color }}>
        <span>{info.barLabel}</span>
        <span className="font-semibold text-xs opacity-90">{riskRatingKey}</span>
      </div>
    </div>
  );
}

export default function DetailView({ profile, activeReport, setView, deleteReport, showToast, subcontractors = [] }) {
  const [exporting, setExporting] = useState(false);
  const r = activeReport;
  if (!r) {
    setView("log");
    return null;
  }

  function sendEmail() {
    const link = buildReportEmail(r, profile, subcontractors);
    window.open(link, "_blank");
  }

  async function exportDocx() {
    setExporting(true);
    try {
      const docxLib = await getDocxLib();
      const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        ImageRun, AlignmentType, WidthType, ShadingType, BorderStyle,
      } = docxLib;

      const border = { style: BorderStyle.SINGLE, size: 2, color: "999999" };
      const borders = { top: border, bottom: border, left: border, right: border };
      const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };
      const FULL_WIDTH = 9360;
      const checkbox = (label, checked) => `${checked ? "☒" : "☐"} ${label}`;

      function labelCell(text, opts = {}) {
        return new TableCell({
          borders, margins: cellMargins,
          width: { size: opts.width || FULL_WIDTH, type: WidthType.DXA },
          shading: { fill: "F2E9D8", type: ShadingType.CLEAR },
          columnSpan: opts.span,
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
        });
      }
      function valueCell(text, opts = {}) {
        return new TableCell({
          borders, margins: cellMargins,
          width: { size: opts.width || FULL_WIDTH, type: WidthType.DXA },
          columnSpan: opts.span,
          children: (Array.isArray(text) ? text : [text]).map((t) => new Paragraph({ children: [new TextRun({ text: t || "", size: 20 })] })),
        });
      }

      let photoParagraphChildren = [new TextRun({ text: "No photo attached", italics: true, size: 18, color: "888888" })];
      if (r.photo_data_url) {
        try {
          const base64 = r.photo_data_url.split(",")[1];
          const byteChars = atob(base64);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
          const byteArray = new Uint8Array(byteNumbers);
          photoParagraphChildren = [new ImageRun({ data: byteArray, transformation: { width: 260, height: 195 }, type: "jpg" })];
        } catch (e) { console.error(e); }
      }

      let siteMapParagraph = null;
      if (r.map_pin && r.site_map_snapshot) {
        try {
          const pinnedMapDataUrl = await compositePinOnMap(r.site_map_snapshot, r.map_pin);
          const base64 = pinnedMapDataUrl.split(",")[1];
          const byteChars = atob(base64);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
          const byteArray = new Uint8Array(byteNumbers);
          siteMapParagraph = new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [new ImageRun({ data: byteArray, transformation: { width: 460, height: 300 }, type: "jpg" })],
          });
        } catch (e) { console.error(e); }
      }

      const title = new Paragraph({ children: [new TextRun({ text: "Good Spot / Hazard Report Form", bold: true, size: 32 })], spacing: { after: 200 } });

      const headerTable = new Table({
        width: { size: FULL_WIDTH, type: WidthType.DXA },
        columnWidths: [2800, 3280, 3280],
        rows: [
          new TableRow({ children: [labelCell("Project:", { width: 2800 }), valueCell(r.project, { width: 3280 }), valueCell("Report Date: " + r.report_date, { width: 3280 })] }),
          new TableRow({ children: [labelCell("Action Report to:", { width: 2800 }), valueCell(r.action_report_to, { width: 3280 }), valueCell(`Respondent: ${r.respondent}\nCompany: ${r.company}`.split("\n"), { width: 3280 })] }),
        ],
      });

      const typeRow = new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: REPORT_TYPES.map((t) => checkbox(t, r.report_type === t)).join("     "), size: 22, bold: true })] });

      const riskInfo = r.risk_rating ? riskBarInfo(r.risk_rating) : null;
      const riskBarTable = riskInfo ? new Table({
        width: { size: FULL_WIDTH, type: WidthType.DXA },
        rows: [new TableRow({ children: [new TableCell({
          borders, margins: { top: 100, bottom: 100, left: 160, right: 160 },
          width: { size: FULL_WIDTH, type: WidthType.DXA },
          shading: { fill: riskInfo.color.replace("#", ""), type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: riskInfo.barLabel + "   ", bold: true, size: 24, color: "FFFFFF" }), new TextRun({ text: r.risk_rating, size: 20, color: "FFFFFF" })] })],
        })] })],
      }) : null;

      const obsTable = new Table({
        width: { size: FULL_WIDTH, type: WidthType.DXA },
        columnWidths: [6560, 2800],
        rows: [
          new TableRow({ children: [
            labelCell("Location / Area: " + r.location + (r.gps ? `  (GPS: ${r.gps.lat.toFixed(6)}, ${r.gps.lng.toFixed(6)})` : ""), { width: 6560 }),
            new TableCell({ borders, margins: cellMargins, width: { size: 2800, type: WidthType.DXA }, rowSpan: 3, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: photoParagraphChildren })] }),
          ] }),
          new TableRow({ children: [valueCell(["Description:", r.description], { width: 6560 })] }),
          new TableRow({ children: [valueCell(["Safety Concern:", r.safety_concern], { width: 6560 })] }),
        ],
      });

      function sectionHeading(text) {
        return new Paragraph({ spacing: { before: 220, after: 80 }, children: [new TextRun({ text, bold: true, size: 22 })] });
      }
      function checklistParagraph(items, selected, otherVal) {
        const lines = items.map((it) => it === "Others" ? checkbox(`Others: ${otherVal || "___________"}`, selected.includes("Others")) : checkbox(it, selected.includes(it)));
        const rows = [];
        for (let i = 0; i < lines.length; i += 3) rows.push(lines.slice(i, i + 3).join("    "));
        return rows.map((rr) => new Paragraph({ children: [new TextRun({ text: rr, size: 20 })], spacing: { after: 60 } }));
      }

      const riskLine = new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: RISK_RATINGS.map((rr) => checkbox(rr.label, r.risk_rating === rr.key)).join("    "), size: 20, bold: true })] });

      const correctiveTable = new Table({
        width: { size: FULL_WIDTH, type: WidthType.DXA },
        columnWidths: [4680, 2340, 2340],
        rows: [
          new TableRow({ children: [valueCell(["Corrective Action:", r.corrective_action], { width: 4680 }), labelCell("Photo: (as required)", { width: 2340 }), labelCell("Close Out Date: " + (r.corrective_close_out_date || ""), { width: 2340 })] }),
          new TableRow({ children: [labelCell("Action Owner: " + (r.corrective_action_owner || ""), { width: 9360, span: 3 })] }),
        ],
      });

      const preventativeTable = new Table({
        width: { size: FULL_WIDTH, type: WidthType.DXA },
        columnWidths: [4680, 2340, 2340],
        rows: [
          new TableRow({ children: [valueCell(["Preventative Action:", r.preventative_action], { width: 4680 }), labelCell("Photo: (as required)", { width: 2340 }), labelCell("Close Out Date: " + (r.preventative_close_out_date || ""), { width: 2340 })] }),
          new TableRow({ children: [labelCell("Action Owner: " + (r.preventative_action_owner || ""), { width: 9360, span: 3 })] }),
        ],
      });

      const pageBreakParagraph = new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: "" })] });

      const footerTable = new Table({
        width: { size: FULL_WIDTH, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [labelCell("Reviewed by:", { width: 4680 }), valueCell(r.reviewed_by, { width: 4680 })] }),
          new TableRow({ children: [labelCell("EcoOnline #:", { width: 4680 }), valueCell(r.eco_online_num, { width: 4680 })] }),
        ],
      });

      const definitions = new Paragraph({
        spacing: { before: 200 },
        children: [new TextRun({
          text: "OFI: a situation where a process or system can be enhanced but is not necessarily non-compliant with current standards. Good Spot: an optimal workplace environment where safety measures are effectively implemented. Hazard: any source of potential damage, harm or adverse health effects. Closecall: an unplanned event that could have resulted in injury, damage, or harm but did not, due to chance or timely intervention.",
          italics: true, size: 16, color: "666666",
        })],
      });

      const footerNote = new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Connect 6ix – HS Internal FORM – 2.0", bold: true, size: 16 })] });
      const appCredit = new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Generated with the OMSF Site app", italics: true, size: 14, color: "999999" })] });

      const doc = new Document({
        styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
        sections: [{
          properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
          children: [
            title, headerTable, typeRow,
            ...(riskBarTable ? [riskBarTable, new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "" })] })] : []),
            obsTable,
            ...(siteMapParagraph ? [sectionHeading("Site Map — Marked Location"), siteMapParagraph] : []),
            sectionHeading("Hazard Classification"), ...checklistParagraph(HAZARD_CLASSES, r.hazard_classes || [], r.hazard_class_other),
            sectionHeading("Tracking Type"), ...checklistParagraph(TRACKING_TYPES, r.tracking_types || [], r.tracking_type_other),
            sectionHeading("Risk Rating"), riskLine,
            sectionHeading("Contributing Factors"), ...checklistParagraph(CONTRIBUTING_FACTORS, r.contributing_factors || [], r.contributing_factor_other),
            new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "" })] }),
            correctiveTable,
            pageBreakParagraph,
            preventativeTable,
            new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: "" })] }),
            footerTable, definitions, footerNote, appCredit,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeLoc = (r.location || "report").replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
      a.href = url;
      a.download = `Hazard_Report_${safeLoc}_${r.report_date}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Word report downloaded");
    } catch (e) {
      console.error(e);
      showToast("Export failed — try again");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans">
      <div className="max-w-md mx-auto pb-10">
        <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView("log")} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-semibold text-stone-800">Report Details</h1>
        </header>

        <div className="p-4 space-y-5">
          {r.photo_data_url && <img src={r.photo_data_url} className="w-full h-56 object-cover rounded-xl border border-stone-200" />}
          <RiskBar riskRatingKey={r.risk_rating} />
          {r.map_pin && r.site_map_snapshot && (
            <div className="relative rounded-xl overflow-hidden border border-stone-200">
              <img src={r.site_map_snapshot} className="w-full h-32 object-cover" />
              <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none" style={{ left: `${r.map_pin.x * 100}%`, top: `${r.map_pin.y * 100}%` }}>
                <MapPin size={24} className="text-red-600 drop-shadow-md" fill="#dc2626" strokeWidth={1.5} />
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-stone-200 px-4 py-1">
            {[
              ["Type", r.report_type],
              ["Location", `${r.project} — ${r.location}`],
              ["Respondent", `${r.respondent}${r.company ? " · " + r.company : ""}`],
              ["Description", r.description],
              ["Safety Concern", r.safety_concern],
              ["Hazard Classification", (r.hazard_classes || []).join(", ")],
              ["Tracking Type", (r.tracking_types || []).join(", ")],
              ["Contributing Factors", (r.contributing_factors || []).join(", ")],
              ["Corrective Action", r.corrective_action],
              ["Preventative Action", r.preventative_action],
            ].map(([label, value]) => value ? (
              <div key={label} className="py-2 border-b border-stone-100 last:border-0">
                <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</div>
                <div className="text-sm text-stone-800 mt-0.5 whitespace-pre-wrap">{value}</div>
              </div>
            ) : null)}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={exportDocx} disabled={exporting} className="flex-1 bg-stone-800 hover:bg-stone-900 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
              {exporting ? "Generating…" : "Word"}
            </button>
            {profile.distribution_list && (
              <button onClick={sendEmail} className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                <Send size={18} /> Email
              </button>
            )}
            {r.author_id === profile.id && (
              <button onClick={() => { deleteReport(r.id); setView("log"); }} className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 rounded-xl flex items-center justify-center">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
