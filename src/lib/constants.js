export const REPORT_TYPES = ["OFI", "Good Spot", "Hazard", "Closecall"];

export const HAZARD_CLASSES = [
  "Physical", "Chemical", "Biological", "Ergonomic", "Safety",
  "Life-Saving Rule", "Legislative", "Environmental", "Psychosocial", "Others",
];

export const TRACKING_TYPES = [
  "Fall hazard", "PPE", "Housekeeping", "Access Egress/Control Zone", "Moving Objects",
  "Drop Objects", "Mobile Equip", "Doc/Policy", "Tools", "Others",
];

export const RISK_RATINGS = [
  { key: "Very High/High", label: "Very High / High", sub: "Imminent — Actioned Immediately or Shut Job Down", color: "#dc2626", barLabel: "HAZARD" },
  { key: "Medium", label: "Medium", sub: "Serious — Actioned Within 24 Hours", color: "#eab308", barLabel: "MEDIUM" },
  { key: "Low", label: "Low", sub: "Minor — Actioned Within 72 Hours", color: "#eab308", barLabel: "MEDIUM" },
  { key: "No Risk", label: "No Risk", sub: "Use for Good Spot", color: "#16a34a", barLabel: "GOOD" },
];

export const CONTRIBUTING_FACTORS = [
  "Communication", "Complacency", "Lack of Knowledge", "Lack of Teamwork", "Time pressure",
  "Distraction", "Fatigue", "Lack of Resources", "Lack of Assertiveness", "Others",
];

export function riskBarInfo(riskRatingKey) {
  const found = RISK_RATINGS.find((r) => r.key === riskRatingKey);
  return found || { color: "#a8a29e", barLabel: "NOT SET" };
}

export function emptyReportForm() {
  return {
    project: "RSSOM Project",
    report_date: new Date().toISOString().slice(0, 10),
    action_report_to: "",
    respondent: "",
    company: "",
    report_type: "Hazard",
    location: "",
    photo_data_url: null,
    description: "",
    safety_concern: "",
    hazard_classes: [],
    hazard_class_other: "",
    tracking_types: [],
    tracking_type_other: "",
    risk_rating: "",
    contributing_factors: [],
    contributing_factor_other: "",
    corrective_action: "",
    corrective_action_owner: "",
    corrective_close_out_date: null,
    preventative_action: "",
    preventative_action_owner: "",
    preventative_close_out_date: null,
    reviewed_by: "",
    eco_online_num: "",
    map_pin: null,
    gps: null,
    site_map_snapshot: null,
    ai_generated: false,
  };
}

export function compressImage(dataUrl, maxDim = 1280, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function compositePinOnMap(mapDataUrl, pin) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const px = pin.x * img.width;
      const py = pin.y * img.height;
      const pinHeight = Math.max(24, img.width * 0.035);
      const pinWidth = pinHeight * 0.75;
      ctx.save();
      ctx.translate(px, py);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-pinWidth / 2, -pinHeight * 0.55, -pinWidth / 2, -pinHeight, 0, -pinHeight);
      ctx.bezierCurveTo(pinWidth / 2, -pinHeight, pinWidth / 2, -pinHeight * 0.55, 0, 0);
      ctx.closePath();
      ctx.fillStyle = "#dc2626";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.beginPath();
      ctx.arc(0, -pinHeight * 0.68, pinHeight * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("map image failed to load"));
    img.src = mapDataUrl;
  });
}

function getGpsPositionInner() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });
}
export const getGpsPosition = getGpsPositionInner;

let docxLibPromise = null;
export function getDocxLib() {
  if (!docxLibPromise) {
    docxLibPromise = import("docx");
  }
  return docxLibPromise;
}

export function buildReportEmail(report, profile, subcontractors = []) {
  const baseEmails = (profile.distribution_list || "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Find the subcontractor matching "Action Report To" and pull in their
  // contact emails too, so the report reaches both the owner's safety
  // manager AND the subcontractor responsible for that area/spot.
  const matchedSub = subcontractors.find(
    (s) => s.name.trim().toLowerCase() === (report.action_report_to || "").trim().toLowerCase()
  );
  const subEmails = matchedSub ? (matchedSub.contact_emails || []) : [];

  const allEmails = [...new Set([...baseEmails, ...subEmails])];
  const to = allEmails.join(",");

  const subject = `${report.report_type} Report — ${report.location || "OMSF Site"} — ${report.report_date}`;

  const reporterLine = [profile.my_name, profile.my_position, profile.my_company].filter(Boolean).join(" · ");
  const gpsLine = report.gps ? `GPS: ${report.gps.lat.toFixed(6)}, ${report.gps.lng.toFixed(6)}` : null;

  const lines = [
    `${report.report_type} Report — OMSF / Ontario Line`,
    ``,
    `Project: ${report.project}`,
    `Location: ${report.location}`,
    ...(gpsLine ? [gpsLine] : []),
    `Date: ${report.report_date}`,
    `Respondent: ${report.respondent}${report.company ? " (" + report.company + ")" : ""}`,
    ...(reporterLine ? [`Reported by: ${reporterLine}`] : []),
    `Action Report To: ${report.action_report_to || "—"}${matchedSub ? " (contacts notified)" : ""}`,
    ``,
    `Description:`,
    report.description || "—",
    ``,
    `Safety Concern:`,
    report.safety_concern || "—",
    ``,
    `Hazard Classification: ${(report.hazard_classes || []).join(", ") || "—"}`,
    `Tracking Type: ${(report.tracking_types || []).join(", ") || "—"}`,
    `Risk Rating: ${report.risk_rating || "—"}`,
    `Contributing Factors: ${(report.contributing_factors || []).join(", ") || "—"}`,
    ``,
    `Corrective Action:`,
    report.corrective_action || "—",
    `Action Owner: ${report.corrective_action_owner || "—"}   Close Out: ${report.corrective_close_out_date || "—"}`,
    ``,
    `Preventative Action:`,
    report.preventative_action || "—",
    `Action Owner: ${report.preventative_action_owner || "—"}   Close Out: ${report.preventative_close_out_date || "—"}`,
    ``,
    `— Sent from the OMSF Site app by ${profile.my_name || report.respondent || "team member"}`,
    `Note: photo and formatted Word report are not attached automatically — please attach the downloaded report if needed.`,
  ];

  const body = lines.join("\n");
  const cc = "";
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}${cc}&body=${encodeURIComponent(body)}`;
}
