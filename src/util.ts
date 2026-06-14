import type { Vibe } from "./types";

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

let n = 0;
export const uid = () => `${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const haptic = (ms = 8) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* noop */
  }
};

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** deterministic 0..1 generator seeded by a string — stable across renders */
export function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- dates ---------------- */

export const DAY = 86400000;
export const HOUR = 3600000;
export const MIN = 60000;

export const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

export const at = (daysFromNow: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
};

export const dateKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const locale = (lang: "en" | "de") => (lang === "de" ? "de-DE" : "en-GB");

export const fmtTime = (ts: number, lang: "en" | "de" = "en") =>
  new Date(ts).toLocaleTimeString(locale(lang), { hour: "2-digit", minute: "2-digit" });

export const fmtDay = (ts: number, lang: "en" | "de" = "en") =>
  new Date(ts).toLocaleDateString(locale(lang), { weekday: "short", day: "numeric", month: "short" });

export const fmtFull = (ts: number, lang: "en" | "de" = "en") =>
  new Date(ts).toLocaleDateString(locale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export const fmtMonthYear = (ts: number, lang: "en" | "de" = "en") =>
  new Date(ts).toLocaleDateString(locale(lang), { month: "long", year: "numeric" });

export function relDay(ts: number, lang: "en" | "de" = "en"): string {
  const today = startOfDay(Date.now());
  const that = startOfDay(ts);
  const diff = Math.round((that - today) / DAY);
  const de = lang === "de";
  if (diff === 0) return de ? "Heute" : "Today";
  if (diff === 1) return de ? "Morgen" : "Tomorrow";
  if (diff === -1) return de ? "Gestern" : "Yesterday";
  if (diff > 1 && diff < 7)
    return new Date(ts).toLocaleDateString(locale(lang), { weekday: "long" });
  return fmtDay(ts, lang);
}

export function ago(ts: number, lang: "en" | "de" = "en"): string {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  const de = lang === "de";
  if (s < 60) return de ? "jetzt" : "now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.round(d / 7)}w`;
}

export function countdown(ts: number): string {
  const ms = ts - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / HOUR);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  const m = Math.floor((ms % HOUR) / MIN);
  return `${h}h ${m}m`;
}

/* ---------------- vibes ---------------- */

export const VIBES: Record<Vibe, { emoji: string; label: string; hue: [string, string] }> = {
  party: { emoji: "🪩", label: "party", hue: ["#8A6CFF", "#FF6A8E"] },
  concert: { emoji: "🎸", label: "concert", hue: ["#FF5C7A", "#7A3CFF"] },
  club: { emoji: "🌀", label: "club", hue: ["#4C2FD8", "#00D4FF"] },
  festival: { emoji: "🎪", label: "festival", hue: ["#FF7A3C", "#FF3C8E"] },
  picnic: { emoji: "🧺", label: "picnic", hue: ["#3EE6A0", "#7AC943"] },
  brunch: { emoji: "🥐", label: "brunch", hue: ["#FFB45C", "#FF7A6B"] },
  dinner: { emoji: "🍝", label: "dinner", hue: ["#E05C3C", "#8A3CFF"] },
  drinks: { emoji: "🍸", label: "drinks", hue: ["#C93C6E", "#5C3CFF"] },
  birthday: { emoji: "🎂", label: "birthday", hue: ["#FF6AC2", "#8A6CFF"] },
  market: { emoji: "🛍️", label: "market", hue: ["#FFC65C", "#E0589C"] },
  run: { emoji: "🏃", label: "run", hue: ["#3EC6E0", "#3EE6A0"] },
  cinema: { emoji: "🎬", label: "cinema", hue: ["#5C6CFF", "#2E2A5C"] },
  day: { emoji: "🌤️", label: "day out", hue: ["#6CC6FF", "#8A6CFF"] },
};

export const eur = (n: number) =>
  n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export const initials = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9 _]/g, "")
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/* download an .ics calendar file for an event */
export function downloadIcs(title: string, start: number, end: number, venue?: string) {
  const f = (t: number) =>
    new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//iamin//EN",
    "BEGIN:VEVENT",
    `UID:${uid()}@iamin.app`,
    `DTSTAMP:${f(Date.now())}`,
    `DTSTART:${f(start)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${title}`,
    venue ? `LOCATION:${venue}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}
