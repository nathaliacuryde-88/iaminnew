export type Vibe =
  | "party"
  | "concert"
  | "club"
  | "festival"
  | "picnic"
  | "brunch"
  | "dinner"
  | "drinks"
  | "birthday"
  | "market"
  | "run"
  | "cinema"
  | "day";

export type Privacy = "circle" | "list" | "public" | "ghost";
export type Rsvp = "in" | "maybe" | null;
export type Mood = "open" | "not-today" | "lazy-week";
export type RadarStatus = "there" | "otw" | "home";
export type PollVote = "fire" | "mid" | "dead";
export type LineLevel = 0 | 1 | 2 | 3;

export interface User {
  id: string;
  name: string;
  handle: string;
  emoji?: string;
  gradient: [string, string];
  city?: string;
  bio?: string;
  birthday?: { month: number; day: number };
  mutuals: number;
  organizer?: boolean;
  verified?: boolean;
  mood?: Mood | null;
}

export interface Expense {
  id: string;
  amount: number;
  label: string;
  paidBy: string;
  among: string[];
  ts: number;
}

export interface BringItem {
  id: string;
  label: string;
  emoji: string;
  claimedBy: string | null;
}

export interface Comment {
  id: string;
  by: string;
  text: string;
  ts: number;
}

export interface Prediction {
  id: string;
  by: string;
  text: string;
}

export interface CapsulePhoto {
  id: string;
  by: string;
  seed: number;
  emoji: string;
  src?: string;
}

export interface Pact {
  id: string;
  between: [string, string];
  status: "pending" | "sealed";
}

export interface Weather {
  icon: string;
  temp: number;
  label: string;
}

export interface EventT {
  id: string;
  title: string;
  emoji: string;
  art: number; // seed for generated cover art
  vibe: Vibe;
  start: number;
  end: number;
  venue?: string;
  city: string;
  description?: string;
  privacy: Privacy;
  createdBy: string;
  coCreators: string[];
  sourceUrl?: string;
  sourceType?: "screenshot" | "url";
  going: string[];
  maybe: string[];
  invited: string[];
  bringEnabled: boolean;
  bring: BringItem[];
  expenses: Expense[];
  comments: Comment[];
  predictions: Prediction[];
  photos: CapsulePhoto[];
  pacts: Pact[];
  weather?: Weather;
  lineMode?: boolean;
  lineLevel?: LineLevel;
  lineReports?: number;
  radar: Record<string, RadarStatus>;
  exitPoll: Record<string, PollVote>;
  views?: number;
  ticket?: string;
  pulsedAt?: number;
}

export type NotifKind =
  | "tab"
  | "invite"
  | "rsvp"
  | "pact"
  | "follow"
  | "pulse"
  | "capsule"
  | "birthday"
  | "line"
  | "reminder";

export interface Notif {
  id: string;
  kind: NotifKind;
  text: string;
  ts: number;
  read: boolean;
  eventId?: string;
  userId?: string;
}

export interface Toast {
  id: string;
  icon: string;
  title: string;
  sub?: string;
}
