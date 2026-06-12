import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BringItem,
  CapsulePhoto,
  EventT,
  Mood,
  Notif,
  PollVote,
  RadarStatus,
  Rsvp,
  LineLevel,
} from "./types";
import type { Lang } from "./i18n";
import { DEFAULT_FOLLOWING, ME, USERS, seedEvents, seedNotifs } from "./data";
import { uid } from "./util";

export interface MeProfile {
  name: string;
  handle: string;
  bio: string;
  birthday: string; // yyyy-mm-dd
  paypal: string;
  revolut: string;
  iban: string;
  orgName: string;
  orgInstagram: string;
  orgWebsite: string;
  stripeConnected: boolean;
}

interface AppState {
  onboarded: boolean;
  mode: "person" | "organizer";
  theme: "dark" | "light";
  lang: Lang;
  me: MeProfile;
  mood: Mood | null;
  following: string[];
  followers: string[];
  events: EventT[];
  notifs: Notif[];
  blockedDays: string[];
  cardsSent: string[];
  seededAt: number;

  completeOnboarding: (mode: "person" | "organizer", patch: Partial<MeProfile>) => void;
  setTheme: (t: "dark" | "light") => void;
  setLang: (l: Lang) => void;
  setMode: (m: "person" | "organizer") => void;
  setMood: (m: Mood | null) => void;
  updateMe: (patch: Partial<MeProfile>) => void;
  toggleFollow: (id: string) => void;
  rsvp: (eventId: string, status: Rsvp) => void;
  addComment: (eventId: string, text: string) => void;
  addExpense: (eventId: string, amount: number, label: string, paidBy: string, among: string[]) => void;
  claimBring: (eventId: string, itemId: string) => void;
  addBringItem: (eventId: string, label: string, emoji: string) => void;
  proposePact: (eventId: string, friendId: string) => string;
  sealPact: (eventId: string, pactId: string) => void;
  sealPrediction: (eventId: string, text: string) => void;
  addPhotos: (eventId: string, photos: CapsulePhoto[]) => void;
  setRadar: (eventId: string, status: RadarStatus | null) => void;
  reportLine: (eventId: string, level: LineLevel) => void;
  votePoll: (eventId: string, vote: PollVote) => void;
  sendPulse: (eventId: string) => void;
  addEvent: (e: EventT) => void;
  updateEvent: (eventId: string, patch: Partial<EventT>) => void;
  duplicateEvent: (eventId: string) => string;
  toggleBlockedDay: (key: string) => void;
  addNotif: (n: Omit<Notif, "id" | "ts" | "read">) => void;
  markNotifsRead: () => void;
  sendCard: (userId: string) => void;
  reseed: () => void;
  resetAll: () => void;
}

const emptyMe: MeProfile = {
  name: "Nath",
  handle: "nathcury",
  bio: "Always in for the weird ones. 🇧🇷→🇩🇪",
  birthday: "1996-05-13",
  paypal: "",
  revolut: "",
  iban: "",
  orgName: "",
  orgInstagram: "",
  orgWebsite: "",
  stripeConnected: false,
};

const patchEvent = (events: EventT[], id: string, fn: (e: EventT) => Partial<EventT>): EventT[] =>
  events.map((e) => (e.id === id ? { ...e, ...fn(e) } : e));

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      mode: "person",
      theme: "dark",
      lang: "en",
      me: emptyMe,
      mood: "open",
      following: DEFAULT_FOLLOWING,
      followers: ["felice", "erick", "pippo", "reduque", "pato"],
      events: seedEvents(),
      notifs: seedNotifs(),
      blockedDays: [],
      cardsSent: [],
      seededAt: Date.now(),

      completeOnboarding: (mode, patch) =>
        set((s) => ({ onboarded: true, mode, me: { ...s.me, ...patch } })),
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setMode: (mode) => set({ mode }),
      setMood: (mood) => set({ mood }),
      updateMe: (patch) => set((s) => ({ me: { ...s.me, ...patch } })),

      toggleFollow: (id) =>
        set((s) => ({
          following: s.following.includes(id)
            ? s.following.filter((f) => f !== id)
            : [...s.following, id],
        })),

      rsvp: (eventId, status) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            going: status === "in" ? [...new Set([...e.going, ME])] : e.going.filter((u) => u !== ME),
            maybe:
              status === "maybe" ? [...new Set([...e.maybe, ME])] : e.maybe.filter((u) => u !== ME),
          })),
        })),

      addComment: (eventId, text) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            comments: [...e.comments, { id: uid(), by: ME, text, ts: Date.now() }],
          })),
        })),

      addExpense: (eventId, amount, label, paidBy, among) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            expenses: [...e.expenses, { id: uid(), amount, label, paidBy, among, ts: Date.now() }],
          })),
        })),

      claimBring: (eventId, itemId) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            bring: e.bring.map((b): BringItem =>
              b.id === itemId
                ? { ...b, claimedBy: b.claimedBy === ME ? null : b.claimedBy ? b.claimedBy : ME }
                : b
            ),
          })),
        })),

      addBringItem: (eventId, label, emoji) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            bring: [...e.bring, { id: uid(), label, emoji, claimedBy: null }],
          })),
        })),

      proposePact: (eventId, friendId) => {
        const id = uid();
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            pacts: [...e.pacts, { id, between: [ME, friendId] as [string, string], status: "pending" as const }],
          })),
        }));
        return id;
      },

      sealPact: (eventId, pactId) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => {
            const pact = e.pacts.find((p) => p.id === pactId);
            if (!pact) return {};
            return {
              pacts: e.pacts.map((p) => (p.id === pactId ? { ...p, status: "sealed" as const } : p)),
              going: [...new Set([...e.going, ...pact.between])],
              maybe: e.maybe.filter((u) => !pact.between.includes(u)),
            };
          }),
        })),

      sealPrediction: (eventId, text) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            predictions: [...e.predictions, { id: uid(), by: ME, text }],
          })),
        })),

      addPhotos: (eventId, photos) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({ photos: [...e.photos, ...photos] })),
        })),

      setRadar: (eventId, status) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => {
            const radar = { ...e.radar };
            if (status === null) delete radar[ME];
            else radar[ME] = status;
            return { radar };
          }),
        })),

      reportLine: (eventId, level) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            lineLevel: level,
            lineReports: (e.lineReports ?? 0) + 1,
          })),
        })),

      votePoll: (eventId, vote) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, (e) => ({
            exitPoll: { ...e.exitPoll, [ME]: vote },
          })),
        })),

      sendPulse: (eventId) =>
        set((s) => ({
          events: patchEvent(s.events, eventId, () => ({ pulsedAt: Date.now() })),
        })),

      addEvent: (e) => set((s) => ({ events: [e, ...s.events] })),

      updateEvent: (eventId, patch) =>
        set((s) => ({ events: patchEvent(s.events, eventId, () => patch) })),

      duplicateEvent: (eventId) => {
        const src = get().events.find((e) => e.id === eventId);
        const id = uid();
        if (src) {
          const week = 7 * 86400000;
          const base = Math.max(Date.now(), src.start) + week;
          get().addEvent({
            ...src,
            id,
            title: `${src.title} — encore`,
            start: base,
            end: base + (src.end - src.start),
            going: [ME],
            maybe: [],
            comments: [],
            photos: [],
            predictions: [],
            expenses: [],
            pacts: [],
            exitPoll: {},
            radar: {},
            views: 0,
            pulsedAt: undefined,
          });
        }
        return id;
      },

      toggleBlockedDay: (key) =>
        set((s) => ({
          blockedDays: s.blockedDays.includes(key)
            ? s.blockedDays.filter((d) => d !== key)
            : [...s.blockedDays, key],
        })),

      addNotif: (nf) =>
        set((s) => ({
          notifs: [{ ...nf, id: uid(), ts: Date.now(), read: false }, ...s.notifs],
        })),

      markNotifsRead: () =>
        set((s) => ({ notifs: s.notifs.map((nn) => ({ ...nn, read: true })) })),

      sendCard: (userId) => set((s) => ({ cardsSent: [...s.cardsSent, userId] })),

      /* refresh demo timeline so there is always a live event "today" */
      reseed: () => set({ events: seedEvents(), notifs: seedNotifs(), seededAt: Date.now() }),

      resetAll: () => {
        localStorage.removeItem("iamin-store");
        location.reload();
      },
    }),
    { name: "iamin-store", version: 3 }
  )
);

export const userById = (id: string) => USERS.find((u) => u.id === id);
