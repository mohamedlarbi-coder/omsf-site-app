import { useEffect, useRef } from "react";
import { drawHeat } from "../../lib/heatmap";

/* Thin canvas wrapper around lib/heatmap's drawHeat — internal render
   resolution is set by `renderWidth`/`renderHeight`, CSS stretches it to
   fill its parent, same pattern as every other chart in the app. */
export default function HeatMapCanvas({ points, renderWidth = 640, renderHeight = 200, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) drawHeat(canvasRef.current, points);
  }, [points]);

  return (
    <canvas
      ref={canvasRef}
      width={renderWidth}
      height={renderHeight}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.88, ...style }}
    />
  );
}
