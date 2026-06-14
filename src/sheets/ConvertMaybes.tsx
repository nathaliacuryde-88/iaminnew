import React from "react";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { useApp, userById } from "../store";
import { useNav } from "../nav";
import { cx, eur, rng } from "../util";
import type { User } from "../types";
import { Avatar } from "../components/Avatar";
import { Btn } from "../components/Primitives";

const PERKS = [
  "Free entry before 23:00",
  "2-for-1 first drink",
  "Skip the line",
  "Bring-a-friend, both free",
];
const DOOR = 8; // assumed door price for the revenue estimate

export function ConvertMaybesSheet({ eventId }: { eventId: string }) {
  const event = useApp((s) => s.events.find((e) => e.id === eventId));
  const updateEvent = useApp((s) => s.updateEvent);
  const addNotif = useApp((s) => s.addNotif);
  const { toast, closeSheet } = useNav();

  const [perk, setPerk] = React.useState(0);
  const [phase, setPhase] = React.useState<"pick" | "working" | "done">("pick");
  const [converted, setConverted] = React.useState<User[]>([]);

  if (!event) return null;
  const maybeUsers = event.maybe.map(userById).filter(Boolean) as User[];
  const projConverts = Math.max(1, Math.ceil(maybeUsers.length * 0.45));

  const fire = () => {
    setPhase("working");
    const pool = [...event.maybe];
    const r = rng(`convert:${event.id}:${perk}`);
    const chosen = [...pool].sort(() => r() - 0.5).slice(0, Math.max(1, Math.ceil(pool.length * 0.45)));
    toast("⚡", `Perk sent to ${pool.length} ${pool.length === 1 ? "maybe" : "maybes"}`, PERKS[perk]);

    window.setTimeout(() => {
      const cur = useApp.getState().events.find((e) => e.id === event.id);
      if (!cur) return;
      updateEvent(event.id, {
        going: [...new Set([...cur.going, ...chosen])],
        maybe: cur.maybe.filter((u) => !chosen.includes(u)),
      });
      setConverted(chosen.map(userById).filter(Boolean) as User[]);
      setPhase("done");
      addNotif({
        kind: "rsvp",
        text: `${chosen.length} ${chosen.length === 1 ? "maybe" : "maybes"} converted to confirmed for ${event.title} ⚡`,
        eventId: event.id,
      });
    }, 2400);
  };

  if (maybeUsers.length === 0 && phase === "pick") {
    return (
      <div className="px-5 pb-10 pt-4 text-center">
        <div className="mb-3 text-4xl">🎯</div>
        <div className="text-[15px] text-dim">No maybes on the fence right now.</div>
        <Btn variant="soft" className="mt-5" onClick={closeSheet}>
          Close
        </Btn>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-2">
      {phase === "done" ? (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-mint/15 text-mint"
          >
            <Check size={30} strokeWidth={3} />
          </motion.div>
          <div className="font-display text-[20px] font-bold">
            {converted.length} converted to confirmed
          </div>
          <div className="text-[13px] text-faint mt-1">
            {converted.length}/{converted.length + event.maybe.length} of the maybe pool · {PERKS[perk]}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {converted.map((u) => (
              <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full bg-card hairline pl-1 pr-3 h-8 text-[12.5px] font-semibold">
                <Avatar user={u} size={24} /> {u.name}
              </span>
            ))}
          </div>

          <div
            className="mt-5 rounded-2xl hairline p-4"
            style={{ background: "linear-gradient(135deg, rgba(62,230,160,0.14), rgba(138,108,255,0.08)), rgb(var(--c-raise))" }}
          >
            <div className="font-display font-bold text-[24px]">+{eur(converted.length * DOOR)}</div>
            <div className="text-[11.5px] uppercase tracking-[0.14em] text-faint mt-0.5">estimated door added</div>
          </div>

          <Btn className="mt-5 w-full" onClick={closeSheet}>
            Done
          </Btn>
        </div>
      ) : (
        <>
          <p className="text-center text-[13.5px] text-dim mb-4">
            {maybeUsers.length} {maybeUsers.length === 1 ? "person is" : "people are"} on the fence. Send a targeted perk and watch who bites.
          </p>

          <div className="mb-5 flex flex-wrap justify-center gap-2">
            {maybeUsers.map((u) => (
              <span key={u.id} className={cx("inline-flex items-center gap-1.5 rounded-full bg-card hairline pl-1 pr-3 h-8 text-[12.5px]", phase === "working" && "animate-pulse")}>
                <Avatar user={u} size={24} /> {u.name}
              </span>
            ))}
          </div>

          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint mb-2 px-1">The offer</div>
          <div className="grid grid-cols-2 gap-2">
            {PERKS.map((p, i) => (
              <button
                key={p}
                disabled={phase === "working"}
                onClick={() => setPerk(i)}
                className={cx(
                  "press rounded-2xl p-3 text-left text-[13px] font-semibold hairline",
                  perk === i ? "bg-accent/14 ring-1 ring-accent text-ink" : "bg-card text-dim"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="text-center text-[12px] text-faint mt-4">
            If ~45% convert: <b className="text-mint">+{eur(projConverts * DOOR)}</b> at the door
          </div>

          <Btn className="mt-3 w-full" disabled={phase === "working"} onClick={fire}>
            <Zap size={16} /> {phase === "working" ? "Sending — watching who bites…" : `Send perk to ${maybeUsers.length} ${maybeUsers.length === 1 ? "maybe" : "maybes"}`}
          </Btn>
        </>
      )}
    </div>
  );
}
