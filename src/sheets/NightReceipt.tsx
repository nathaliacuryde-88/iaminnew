import { motion } from "framer-motion";
import { useApp, userById } from "../store";
import { useNav } from "../nav";
import { ME } from "../data";
import { eur, fmtDay, MIN, rng } from "../util";
import type { EventT, PollVote, Prediction, User } from "../types";
import { Btn } from "../components/Primitives";

/* whimsical extra stats, seeded so each night's receipt is stable */
function quirkPool(r: () => number): Array<[string, string]> {
  const drinks = ["Aperol Spritz", "Club-Mate", "Tequila", "Radler", "Negroni", "Hugo", "Filterkaffee"];
  return [
    [`"ONE MORE SONG" SAID`, `${3 + Math.floor(r() * 5)}×`],
    ["LAST DRINK", drinks[Math.floor(r() * drinks.length)]],
    ["PHONE @ HOME", `${2 + Math.floor(r() * 16)}%`],
    ["STEPS DANCED", `${3 + Math.floor(r() * 9)}.${Math.floor(r() * 9)}k`],
    ["GROUP CHATS MUTED", `${Math.floor(r() * 4)}`],
  ];
}

export interface ReceiptData {
  arrival: string;
  departure: string;
  lastStandingId: string;
  orbitUser?: User;
  orbitDur: string;
  myShare: number;
  totalTab: number;
  called?: Prediction;
  verdict: { vote: PollVote; count: number; total: number };
  quirks: Array<[string, string]>;
}

/** reconstruct the night from real event data, filling gaps deterministically */
export function buildReceipt(e: EventT): ReceiptData {
  const r = rng("receipt:" + e.id);
  const attendees = e.going.map(userById).filter(Boolean) as User[];
  const others = attendees.filter((u) => u.id !== ME);

  const arrival = fmtTimeSafe(e.start + Math.floor(r() * 80) * MIN);
  const departure = fmtTimeSafe(e.end - Math.floor(r() * 35) * MIN);

  const lastStandingId = attendees.length ? attendees[Math.floor(r() * attendees.length)].id : ME;
  const orbitUser = others.length ? others[Math.floor(r() * others.length)] : undefined;
  const orbitDur = `${1 + Math.floor(r() * 3)}h ${String(Math.floor(r() * 59)).padStart(2, "0")}m`;

  const myShare = e.expenses
    .filter((x) => x.among.includes(ME))
    .reduce((a, x) => a + x.amount / Math.max(1, x.among.length), 0);
  const totalTab = e.expenses.reduce((a, x) => a + x.amount, 0);

  const called = e.predictions.length
    ? e.predictions[Math.floor(r() * e.predictions.length)]
    : undefined;

  const votes = Object.values(e.exitPoll);
  let verdict: ReceiptData["verdict"];
  if (votes.length) {
    const tally: Record<PollVote, number> = { fire: 0, mid: 0, dead: 0 };
    votes.forEach((v) => {
      tally[v] += 1;
    });
    const vote = (Object.keys(tally) as PollVote[]).sort((a, b) => tally[b] - tally[a])[0];
    verdict = { vote, count: tally[vote], total: votes.length };
  } else {
    const vote: PollVote = r() < 0.6 ? "fire" : r() < 0.85 ? "mid" : "dead";
    const total = Math.max(1, attendees.length);
    verdict = { vote, count: 1 + Math.floor(r() * total), total };
  }

  const pool = quirkPool(r);
  const a = pool[Math.floor(r() * pool.length)];
  let b = pool[Math.floor(r() * pool.length)];
  if (b[0] === a[0]) b = pool[(pool.indexOf(a) + 1) % pool.length];

  return { arrival, departure, lastStandingId, orbitUser, orbitDur, myShare, totalTab, called, verdict, quirks: [a, b] };
}

const fmtTimeSafe = (ts: number) =>
  new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

const Dashed = () => <div className="border-t border-dashed border-[#1A1818]/30 my-2.5" />;

function Line({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="opacity-70">{l}</span>
      <span className="font-bold text-right">{v}</span>
    </div>
  );
}

export function NightReceiptSheet({ eventId }: { eventId: string }) {
  const event = useApp((s) => s.events.find((e) => e.id === eventId));
  const lang = useApp((s) => s.lang);
  const { toast, closeSheet } = useNav();
  if (!event) return null;

  const d = buildReceipt(event);
  const last = userById(d.lastStandingId);
  const vEmoji = d.verdict.vote === "fire" ? "🔥" : d.verdict.vote === "mid" ? "😐" : "💀";
  const vLabel =
    d.verdict.vote === "fire" ? "ABSOLUTE FIRE" : d.verdict.vote === "mid" ? "FINE, I GUESS" : "TOTAL CARNAGE";

  return (
    <div className="px-5 pb-8 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 22, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -1.2 }}
        transition={{ type: "spring", stiffness: 150, damping: 18 }}
        className="mx-auto max-w-[310px] rounded-lg bg-[#FFFDF6] p-5 font-mono text-[12px] text-[#1A1818] shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="text-center">
          <div className="text-[15px] font-bold tracking-widest">I AM (IN)</div>
          <div className="text-[10px] opacity-60 mt-0.5">MORNING-AFTER RECEIPT</div>
          <div className="text-[10px] opacity-60">
            {new Date(event.start).toLocaleDateString("de-DE")} · {(event.venue ?? event.city).toUpperCase()}
          </div>
        </div>
        <Dashed />
        <div className="text-center text-[13px] font-bold leading-tight">{event.title.toUpperCase()}</div>
        <div className="text-center text-[10px] opacity-60 mt-0.5">{fmtDay(event.start, lang)}</div>
        <Dashed />
        <Line l="DOORS / ARRIVED" v={d.arrival} />
        <Line l="LAST SEEN" v={d.departure} />
        {d.orbitUser && <Line l="IN YOUR ORBIT" v={`${d.orbitUser.name} · ${d.orbitDur}`} />}
        <Line l="LAST ONE STANDING" v={d.lastStandingId === ME ? "YOU 🏆" : `${last?.name} 🏆`} />
        <Dashed />
        <Line l="TAB DAMAGE (you)" v={d.myShare > 0 ? eur(d.myShare) : "0,00 €"} />
        <Line l="TABLE TOTAL" v={d.totalTab > 0 ? eur(d.totalTab) : "— clean —"} />
        {d.called && (
          <>
            <Dashed />
            <div className="opacity-70">CALLED IT 🔮</div>
            <div className="font-bold mt-0.5 leading-snug">“{d.called.text}”</div>
            <div className="text-[10px] opacity-60 mt-0.5">
              — {userById(d.called.by)?.id === ME ? "you" : userById(d.called.by)?.name}, sealed before the night
            </div>
          </>
        )}
        <Dashed />
        {d.quirks.map(([l, v]) => (
          <Line key={l} l={l} v={v} />
        ))}
        <Dashed />
        <div className="text-center">
          <div className="my-1 text-[22px] leading-none">{vEmoji}</div>
          <div className="font-bold tracking-wide">THE VERDICT: {vLabel}</div>
          <div className="text-[10px] opacity-60 mt-0.5">
            {d.verdict.count}/{d.verdict.total} called it {vEmoji}
          </div>
        </div>
        <div className="mt-3 flex h-9 items-end justify-center gap-[2px]">
          {Array.from({ length: 34 }).map((_, i) => (
            <div key={i} className="bg-[#1A1818]" style={{ width: i % 4 === 0 ? 3 : 1.5, height: 12 + ((i * 13) % 20) }} />
          ))}
        </div>
        <div className="text-center text-[9px] opacity-50 mt-1.5">NO REGRETS · NO REFUNDS · SEE YOU NEXT TIME</div>
      </motion.div>

      <div className="flex gap-2 mt-5">
        <Btn variant="soft" className="flex-1" onClick={closeSheet}>
          Close
        </Btn>
        <Btn
          className="flex-1"
          onClick={() => {
            closeSheet();
            toast("🧾", "Receipt saved", "Drop it on your story");
          }}
        >
          Save / share
        </Btn>
      </div>
      <div className="text-center text-[11px] text-faint mt-3">
        {lang === "de"
          ? "Rekonstruiert aus Radar, Tab, Vorhersagen & Exit Poll."
          : "Reconstructed from radar, the Tab, predictions & the exit poll."}
      </div>
    </div>
  );
}
