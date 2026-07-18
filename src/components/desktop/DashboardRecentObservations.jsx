import React, { useState } from "react";
import { X } from "lucide-react";

const TYPE_BADGE = {
  "Good Spot": { bg: "#178F8C", color: "#D8FFFF" },
  "Hazard": { bg: "#246DAE", color: "#DCEFFF" },
  "Closecall": { bg: "#C98718", color: "#FFF2D4" },
  "OFI": { bg: "#66737C", color: "#F0F3F4" },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* Recent Observations as a 4-column table: Type badge / Description +
   Location / time ago / clickable photo thumbnail that opens a
   full-size preview overlay. Uses real report data only. */
export default function DashboardRecentObservations({ reports, onViewAll }) {
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const recent = [...reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div style={{ flex: 1.3, background: "#0d1b26", border: "1px solid rgba(160, 190, 204, 0.14)", borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>Recent Observations</div>
        <button onClick={onViewAll} style={{ background: "none", border: "none", color: "#18C9CB", fontSize: 12, cursor: "pointer" }}>View all ›</button>
      </div>

      {recent.length === 0 ? (
        <p style={{ fontSize: 13, color: "#5C6870" }}>No reports yet.</p>
      ) : (
        <div>
          {recent.map((r, i) => {
            const badge = TYPE_BADGE[r.report_type] || TYPE_BADGE["OFI"];
            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "82px 1fr 64px 40px",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i === recent.length - 1 ? "none" : "1px solid rgba(160,190,204,0.1)",
                }}
              >
                <span style={{ background: badge.bg, color: badge.color, fontSize: 9, fontWeight: 700, padding: "0 7px", height: 21, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, whiteSpace: "nowrap" }}>
                  {r.report_type?.toUpperCase()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.description ? r.description.slice(0, 52) : "No description"}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#8A9198", marginTop: 2 }}>{r.location}</div>
                </div>
                <div style={{ fontSize: 11, color: "#8A9198", textAlign: "right" }}>{timeAgo(r.created_at)}</div>
                {r.photo_data_url ? (
                  <button
                    onClick={() => setPreviewPhoto(r.photo_data_url)}
                    style={{ width: 40, height: 40, borderRadius: 8, padding: 0, border: "1px solid rgba(160,190,204,0.14)", cursor: "pointer", overflow: "hidden" }}
                  >
                    <img src={r.photo_data_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "#1c2b38" }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, cursor: "zoom-out" }}
        >
          <button
            onClick={() => setPreviewPhoto(null)}
            style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
          <img src={previewPhoto} alt="Preview" style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
