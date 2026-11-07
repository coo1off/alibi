export type Rgb = readonly [number, number, number];

export const hex = (h: string): Rgb => {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};

export const css = (c: Rgb, a = 1): string =>
  a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

export type BrickColor = { hi: Rgb; base: Rgb; lo: Rgb };

export type Palette = {
  bgTop: Rgb;
  bgBottom: Rgb;
  spotlight: Rgb;
  grid: Rgb;
  ink: Rgb;
  ink2: Rgb;
  panel: Rgb;
  border: Rgb;
  borderHi: Rgb;
  paper: Rgb;
  dim: Rgb;
  muted: Rgb;
  gold: Rgb;
  goldHi: Rgb;
  goldLo: Rgb;
  red: Rgb;
  redHi: Rgb;
  redLo: Rgb;
  blood: Rgb;
  paddle: Rgb;
  paddleLo: Rgb;
  paddleHi: Rgb;
  ball: Rgb;
  ballLo: Rgb;
  brick: Record<BrickType, BrickColor>;
  scene: "chair" | "door" | "stage";
};

export type BrickType = "archive" | "stone" | "blood" | "lamp" | "gold";

export const BRICK_TYPES: BrickType[] = ["archive", "stone", "blood", "lamp", "gold"];

export const BRICK_HP: Record<BrickType, number> = {
  archive: 1,
  stone: 1,
  blood: 2,
  lamp: 1,
  gold: 3,
};

export const BRICK_SCORE: Record<BrickType, number> = {
  archive: 15,
  stone: 20,
  blood: 25,
  lamp: 30,
  gold: 50,
};

export const BRICK_LABEL: Record<BrickType, string> = {
  archive: "архив",
  stone: "стена",
  blood: "кровь",
  lamp: "лампа",
  gold: "дело",
};

const common = {
  ink: hex("#0d0a20"),
  ink2: hex("#15102e"),
  paper: hex("#e8e0d0"),
  dim: hex("#8f87b8"),
  gold: hex("#d9a441"),
  goldHi: hex("#f5c96b"),
  goldLo: hex("#8a5f1e"),
  red: hex("#c23b32"),
  redHi: hex("#e35d52"),
  redLo: hex("#7a1f1a"),
  blood: hex("#8d1810"),
  paddle: hex("#cfd2da"),
  paddleLo: hex("#6d7080"),
  paddleHi: hex("#ffffff"),
  ball: hex("#f6f1e6"),
  ballLo: hex("#b9b2a3"),
} as const;

export const PALETTES: Record<"ep1" | "ep2" | "ep3", Palette> = {
  ep1: {
    ...common,
    bgTop: hex("#0d0a20"),
    bgBottom: hex("#201640"),
    spotlight: hex("#3a2b68"),
    grid: hex("#241a4a"),
    panel: hex("#1d1740"),
    border: hex("#3a2d6b"),
    borderHi: hex("#5a4a9e"),
    muted: hex("#4c4478"),
    brick: {
      archive: { hi: hex("#a87d38"), base: hex("#7e5a22"), lo: hex("#453013") },
      stone: { hi: hex("#9fb8c8"), base: hex("#7d94a3"), lo: hex("#44515b") },
      blood: { hi: hex("#c23b32"), base: hex("#8d1810"), lo: hex("#4e0b07") },
      lamp: { hi: hex("#4f9f86"), base: hex("#2f6f5c"), lo: hex("#183d32") },
      gold: { hi: hex("#f5c96b"), base: hex("#d9a441"), lo: hex("#8a5f1e") },
    },
    scene: "chair",
  },
  ep2: {
    ...common,
    bgTop: hex("#081018"),
    bgBottom: hex("#122634"),
    spotlight: hex("#2b4a5e"),
    grid: hex("#173040"),
    panel: hex("#14202c"),
    border: hex("#2b4354"),
    borderHi: hex("#4e7a90"),
    muted: hex("#3c5766"),
    brick: {
      archive: { hi: hex("#9aa6b4"), base: hex("#6d7a8a"), lo: hex("#38434f") },
      stone: { hi: hex("#7fb2c9"), base: hex("#4f8099"), lo: hex("#274553") },
      blood: { hi: hex("#d05a4e"), base: hex("#9a2f27"), lo: hex("#4c110c") },
      lamp: { hi: hex("#7ad1a8"), base: hex("#3f9c77"), lo: hex("#1d5540") },
      gold: { hi: hex("#f2d27a"), base: hex("#c9a443"), lo: hex("#7a5a1a") },
    },
    scene: "door",
  },
  ep3: {
    ...common,
    bgTop: hex("#140812"),
    bgBottom: hex("#2c0f18"),
    spotlight: hex("#6b2230"),
    grid: hex("#3a1420"),
    panel: hex("#24101c"),
    border: hex("#5b2530"),
    borderHi: hex("#9a3a44"),
    muted: hex("#6a3a44"),
    brick: {
      archive: { hi: hex("#c98f6a"), base: hex("#8f5a3a"), lo: hex("#4a2716") },
      stone: { hi: hex("#c9b9a8"), base: hex("#8f7f70"), lo: hex("#4a3e36") },
      blood: { hi: hex("#f05a48"), base: hex("#b31f14"), lo: hex("#570a05") },
      lamp: { hi: hex("#b9c46a"), base: hex("#7f8a35"), lo: hex("#3f4416") },
      gold: { hi: hex("#ffe08a"), base: hex("#e0ae3a"), lo: hex("#8a6516") },
    },
    scene: "stage",
  },
};
