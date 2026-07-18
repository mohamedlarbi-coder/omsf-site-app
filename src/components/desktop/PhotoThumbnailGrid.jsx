import React, { useRef, useState } from "react";
import { X, Plus } from "lucide-react";

const TILE_SIZE = 150;
const MAX_PHOTOS = 8;

/* Compress an uploaded image before storing it as a data URL, so the
   app doesn't choke on full-resolution camera photos. */
function compressImage(dataUrl, maxDim = 1280, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function PhotoThumbnailGrid({ photos, onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    Promise.all(
      files.slice(0, MAX_PHOTOS - photos.length).map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async () => resolve(await compressImage(reader.result));
            reader.readAsDataURL(file);
          })
      )
    ).then((newPhotos) => {
      onChange([...photos, ...newPhotos]);
      setUploading(false);
    });
    e.target.value = "";
  }

  function removePhoto(index) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {photos.map((src, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            width: TILE_SIZE,
            height: TILE_SIZE,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(160, 190, 204, 0.19)",
          }}
        >
          <img src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button
            type="button"
            onClick={() => removePhoto(i)}
            aria-label={`Remove photo ${i + 1}`}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(8, 15, 20, 0.75)",
              border: "none",
              color: "#F1F5F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        </div>
      ))}

      {photos.length < MAX_PHOTOS && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              borderRadius: 12,
              border: "1.5px dashed rgba(24, 201, 203, 0.55)",
              background: "transparent",
              color: "#18C9CB",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              transition: "background 180ms ease, border-color 180ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(24, 201, 203, 0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Plus size={22} />
            <span style={{ fontSize: 13, fontWeight: 550 }}>{uploading ? "Uploading…" : "Add Photo"}</span>
          </button>
        </>
      )}
    </div>
  );
}
