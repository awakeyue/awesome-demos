export interface CardTheme {
  id: string
  name: string
  background: string
  foreground: string
  accent: string
  border: string
  codeBackground: string
  codeForeground: string
  previewColor: string
}

export const cardThemes: CardTheme[] = [
  {
    id: "minimal-light",
    name: "简约白",
    background: "#ffffff",
    foreground: "#1a1a2e",
    accent: "#6366f1",
    border: "#e5e7eb",
    codeBackground: "#f3f4f6",
    codeForeground: "#1f2937",
    previewColor: "#ffffff",
  },
  {
    id: "minimal-dark",
    name: "深邃黑",
    background: "#0f0f0f",
    foreground: "#f5f5f5",
    accent: "#818cf8",
    border: "#2a2a2a",
    codeBackground: "#1a1a1a",
    codeForeground: "#e5e7eb",
    previewColor: "#0f0f0f",
  },
  {
    id: "ocean-blue",
    name: "海洋蓝",
    background: "linear-gradient(135deg, #0c1222 0%, #1a365d 100%)",
    foreground: "#e0f2fe",
    accent: "#38bdf8",
    border: "#1e3a5f",
    codeBackground: "#0c1929",
    codeForeground: "#bae6fd",
    previewColor: "#1a365d",
  },
  {
    id: "sunset-orange",
    name: "日落橙",
    background: "linear-gradient(135deg, #1f1412 0%, #451a03 100%)",
    foreground: "#fff7ed",
    accent: "#fb923c",
    border: "#78350f",
    codeBackground: "#27150f",
    codeForeground: "#fed7aa",
    previewColor: "#451a03",
  },
  {
    id: "forest-green",
    name: "森林绿",
    background: "linear-gradient(135deg, #0f1a14 0%, #14532d 100%)",
    foreground: "#ecfdf5",
    accent: "#4ade80",
    border: "#166534",
    codeBackground: "#0d1912",
    codeForeground: "#bbf7d0",
    previewColor: "#14532d",
  },
  {
    id: "aurora",
    name: "极光",
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
    foreground: "#e0e7ff",
    accent: "#a78bfa",
    border: "#312e81",
    codeBackground: "#1e1b4b",
    codeForeground: "#c7d2fe",
    previewColor: "#1e1b4b",
  },
  {
    id: "rose-pink",
    name: "玫瑰粉",
    background: "linear-gradient(135deg, #1f1318 0%, #4c1d3b 100%)",
    foreground: "#fdf2f8",
    accent: "#f472b6",
    border: "#831843",
    codeBackground: "#2a1620",
    codeForeground: "#fbcfe8",
    previewColor: "#4c1d3b",
  },
  {
    id: "cyber-neon",
    name: "赛博霓虹",
    background: "linear-gradient(135deg, #020617 0%, #0c0a1d 100%)",
    foreground: "#f0f9ff",
    accent: "#22d3ee",
    border: "#1e3a5f",
    codeBackground: "#0a0e1a",
    codeForeground: "#a5f3fc",
    previewColor: "#0c0a1d",
  },
]
