import { create } from "zustand";
import type { Toast } from "./types";
import { uid, haptic } from "./util";

export type Tab = "feed" | "calendar" | "capsule" | "profile" | "dashboard" | "city" | "metrics";

export const tabsFor = (mode: "person" | "organizer"): Tab[] =>
  mode === "organizer" ? ["dashboard", "city", "metrics", "profile"] : ["feed", "calendar", "capsule", "profile"];

export const defaultTab = (mode: "person" | "organizer"): Tab =>
  mode === "organizer" ? "dashboard" : "feed";

export type Screen =
  | { kind: "event"; id: string }
  | { kind: "person"; id: string }
  | { kind: "capsule"; id: string }
  | { kind: "notifications" }
  | { kind: "search" }
  | { kind: "people" }
  | { kind: "settings" };

export type SheetT =
  | { kind: "create"; draft?: Partial<import("./types").EventT>; editId?: string }
  | { kind: "expense"; eventId: string }
  | { kind: "pact"; eventId: string }
  | { kind: "mood" }
  | { kind: "editProfile" }
  | { kind: "receipt"; userId: string }
  | { kind: "card"; userId: string }
  | { kind: "radarStatus"; eventId: string }
  | { kind: "dayDetail"; dateKey: string }
  | { kind: "nightReceipt"; eventId: string }
  | { kind: "roulette" }
  | { kind: "convertMaybes"; eventId: string };

interface NavState {
  tab: Tab;
  stack: Array<Screen & { key: string }>;
  sheet: SheetT | null;
  toasts: Toast[];
  setTab: (t: Tab) => void;
  push: (s: Screen) => void;
  pop: () => void;
  popAll: () => void;
  openSheet: (s: SheetT) => void;
  closeSheet: () => void;
  toast: (icon: string, title: string, sub?: string) => void;
  dismissToast: (id: string) => void;
}

export const useNav = create<NavState>((set, get) => ({
  tab: "feed",
  stack: [],
  sheet: null,
  toasts: [],

  setTab: (tab) => {
    haptic(6);
    if (get().tab === tab) set({ stack: [] });
    set({ tab });
  },
  push: (s) => {
    haptic(6);
    set((st) => ({ stack: [...st.stack, { ...s, key: uid() }] }));
  },
  pop: () => set((st) => ({ stack: st.stack.slice(0, -1) })),
  popAll: () => set({ stack: [] }),
  openSheet: (sheet) => {
    haptic(8);
    set({ sheet });
  },
  closeSheet: () => set({ sheet: null }),

  toast: (icon, title, sub) => {
    const id = uid();
    haptic(12);
    set((st) => ({ toasts: [...st.toasts.slice(-2), { id, icon, title, sub }] }));
    setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),
}));

/** open an event — used everywhere */
export const openEvent = (id: string) => useNav.getState().push({ kind: "event", id });
export const openPerson = (id: string) => useNav.getState().push({ kind: "person", id });
