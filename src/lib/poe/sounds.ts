export const GAME_ALERTS = [
  { id: 1, label: "1 — Soft ping" },
  { id: 2, label: "2 — Currency" },
  { id: 3, label: "3 — Valuable" },
  { id: 4, label: "4 — Notable" },
  { id: 5, label: "5 — Rare" },
  { id: 6, label: "6 — Very valuable" },
  { id: 7, label: "7 — Game alert" },
  { id: 8, label: "8 — Game alert" },
  { id: 9, label: "9 — Game alert" },
  { id: 10, label: "10 — Game alert" },
  { id: 11, label: "11 — Game alert" },
  { id: 12, label: "12 — Game alert" },
  { id: 13, label: "13 — Game alert" },
  { id: 14, label: "14 — Game alert" },
  { id: 15, label: "15 — Game alert" },
  { id: 16, label: "16 — Game alert" },
] as const;

export const NEVER_SINK_SOUNDS = [
  { file: "6veryvaluable.mp3", label: "Very valuable" },
  { file: "1maybevaluable.mp3", label: "Maybe valuable" },
  { file: "2currency.mp3", label: "Currency" },
  { file: "3uniques.mp3", label: "Uniques" },
  { file: "4maps.mp3", label: "Maps" },
  { file: "5highmaps.mp3", label: "High maps" },
  { file: "7chancing.mp3", label: "Chancing" },
  { file: "12leveling.mp3", label: "Leveling" },
] as const;

export type SoundKind = "none" | "mute" | "builtin" | "neversink" | "custom";

export type FilterSound = {
  kind: SoundKind;
  id?: number;
  file?: string;
  volume?: number;
};

export function soundSelectValue(sound?: FilterSound, muted?: boolean): string {
  if (!sound || sound.kind === "none") {
    if (muted) return "mute";
    return "none";
  }
  if (sound.kind === "mute") return "mute";
  if (sound.kind === "builtin") return `builtin:${sound.id ?? 3}`;
  if (sound.kind === "neversink") return `ns:${sound.file ?? NEVER_SINK_SOUNDS[0].file}`;
  return "custom";
}

export function parseSoundSelect(value: string, prev?: FilterSound): FilterSound {
  const volume = prev?.volume ?? 300;
  if (value === "none") return { kind: "none", volume };
  if (value === "mute") return { kind: "mute", volume };
  if (value === "custom") return { kind: "custom", file: prev?.file ?? "", volume };
  if (value.startsWith("builtin:")) {
    const id = Number(value.slice("builtin:".length));
    return { kind: "builtin", id: Number.isFinite(id) ? id : 3, volume };
  }
  if (value.startsWith("ns:")) {
    return { kind: "neversink", file: value.slice(3), volume };
  }
  return { kind: "none", volume };
}

export function quoteSoundFile(file: string): string {
  const cleaned = file.trim().replace(/"/g, "");
  return `"${cleaned}"`;
}