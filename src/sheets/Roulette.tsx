import React from "react";
import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import { useApp, userById } from "../store";
import { useNav } from "../nav";
import { ME } from "../data";
import { DAY, haptic, VIBES } from "../util";
import type { EventT, User } from "../types";
import { CoverThumb } from "../components/Cover";
import { Btn } from "../components/Primitives";

export function RouletteSheet() {
  const events = useApp((s) => s.events);
  const following = useApp((s) => s.following);
  const rsvp = useApp((s) => s.rsvp);
  const { push, closeSheet, toast } = useNav();

  const now = Date.now();

  // taste profile: which vibes you've shown up for (and loved) before
  const aff = React.useMemo(() => {
    const a: Record<string, number> = {};
    for (const e of events) {
      if (e.end < now && (e.going.includes(ME) || e.createdBy === ME)) {
        a[e.vibe] = (a[e.vibe] ?? 0) + 1;
        if (e.exitPoll[ME] === "fire") a[e.vibe] = (a[e.vibe] ?? 0) + 1.5;
      }
    }
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const cands = React.useMemo(
    () => events.filter((e) => e.end >= now && e.privacy !== "ghost" && e.start < now + 12 * DAY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events]
  );

  const friendsIn = React.useCallback(
    (e: EventT): User[] =>
      ([...new Set([...e.going, ...e.maybe])]
        .filter((id) => id !== ME && following.includes(id))
        .map(userById)
        .filter(Boolean) as User[]),
    [following]
  );

  const score = React.useCallback(
    (e: EventT) => {
      let s = 1;
      s += friendsIn(e).length * 2.2; // who's free
      if (e.start <= now && e.end >= now) s += 4; // live right now
      else if (e.start < now + DAY) s += 3; // today / tomorrow
      else if (e.start < now + 3 * DAY) s += 1.2;
      s += aff[e.vibe] ?? 0; // your taste
      return s;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aff, friendsIn]
  );

  const reason = (e: EventT): string => {
    const fr = friendsIn(e);
    if (e.start <= now && e.end >= now) return "it's happening RIGHT NOW 🔴";
    if (fr.length)
      return `${fr[0].name}${fr.length > 1 ? ` +${fr.length - 1}` : ""} ${fr.length > 1 ? "are" : "is"} in — you always end up there`;
    if ((aff[e.vibe] ?? 0) >= 2) return `you always rate ${VIBES[e.vibe].label}s 🔥`;
    if (e.start < now + DAY) return "starts soon — momentum's on your side";
    return "pure chaos. trust the dice. 🎲";
  };

  const [phase, setPhase] = React.useState<"spinning" | "done">("spinning");
  const [idx, setIdx] = React.useState(0);
  const timer = React.useRef<number>();

  const weightedPick = React.useCallback(() => {
    const weights = cands.map(score);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < cands.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i;
    }
    return cands.length - 1;
  }, [cands, score]);

  const spin = React.useCallback(() => {
    if (cands.length < 2) {
      setPhase("done");
      return;
    }
    setPhase("spinning");
    const winner = weightedPick();
    const steps = 22;
    let i = 0;
    const tick = () => {
      i += 1;
      if (i >= steps) {
        setIdx(winner);
        setPhase("done");
        haptic(24);
        return;
      }
      setIdx(Math.floor(Math.random() * cands.length));
      haptic(4);
      const tt = i / steps;
      timer.current = window.setTimeout(tick, 45 + tt * tt * 230); // decelerate
    };
    tick();
  }, [cands.length, weightedPick]);

  React.useEffect(() => {
    spin();
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cands.length === 0) {
    return (
      <div className="px-5 pb-10 pt-4 text-center">
        <div className="mb-3 text-4xl">🎲</div>
        <div className="text-[15px] text-dim">Nothing on the horizon to gamble on.</div>
        <Btn variant="soft" className="mt-5" onClick={closeSheet}>
          Fine, I'll decide myself
        </Btn>
      </div>
    );
  }

  const e = cands[idx];
  const spinning = phase === "spinning";

  return (
    <div className="px-5 pb-8 pt-1">
      <p className="mb-4 text-center text-[13px] text-faint">Weighing who's free, what's open & your taste…</p>

      <div className="relative flex min-h-[168px] flex-col items-center justify-center overflow-hidden rounded-3xl bg-card hairline p-5">
        <motion.div
          key={`${idx}-${spinning}`}
          initial={spinning ? { opacity: 0.3, y: 14, filter: "blur(3px)" } : { scale: 0.86, opacity: 0 }}
          animate={spinning ? { opacity: 1, y: 0, filter: "blur(0px)" } : { scale: 1, opacity: 1 }}
          transition={spinning ? { duration: 0.12 } : { type: "spring", stiffness: 260, damping: 18 }}
          className="flex flex-col items-center text-center"
        >
          <CoverThumb event={e} size={72} />
          <div className="font-display mt-3 px-2 text-[18px] font-bold leading-tight tracking-tight">{e.title}</div>
          <div className="mt-1 text-[12.5px] text-faint">
            {VIBES[e.vibe].emoji} {e.venue ?? e.city}
          </div>
        </motion.div>
      </div>

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="mt-4 px-3 text-center text-[13.5px] text-dim">
            <span className="font-semibold text-gold">The dice say:</span> {reason(e)}
          </div>
          <div className="mt-5 flex gap-2">
            <Btn variant="soft" className="flex-1" onClick={spin}>
              <Dices size={16} /> Spin again
            </Btn>
            <Btn
              className="flex-1"
              onClick={() => {
                rsvp(e.id, "in");
                closeSheet();
                push({ kind: "event", id: e.id });
                toast("🎲", `You're in for ${e.title}`, "The dice have spoken");
              }}
            >
              I'm in
            </Btn>
          </div>
        </motion.div>
      )}
    </div>
  );
}
