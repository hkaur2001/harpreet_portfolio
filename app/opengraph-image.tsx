import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse((
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0c0d0e", color: "#f4f4ee", padding: "72px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}>
        <span>Harpreet Kaur</span>
        <span style={{ color: "#8ca8ff" }}>Software Engineering · Applied AI · Production Systems</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
        <div style={{ fontSize: 70, lineHeight: 1.02, letterSpacing: "-0.045em", fontWeight: 700 }}>I turn hard, ambiguous problems into software people can actually use.</div>
        <div style={{ marginTop: 28, color: "#a0a29d", fontSize: 25 }}>Full-stack products · AI agents · RAG · integrations · evals · reliability · infrastructure</div>
      </div>
    </div>
  ), size);
}
