import React from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "../store";
import { useNav } from "../nav";
import { ME } from "../data";
import { Btn, Field, inputCls } from "../components/Primitives";

/**
 * Post an "across the room" spark. Guided prompts (steer toward the vibe, not
 * the body), anonymous until a mutual match. After posting we simulate another
 * attendee claiming it so the connect-or-not flow is demoable solo.
 */
export function SparkSheet({ eventId }: { eventId: string }) {
  const event = useApp((s) => s.events.find((e) => e.id === eventId));
  const postSpark = useApp((s) => s.postSpark);
  const claimSpark = useApp((s) => s.claimSpark);
  const addNotif = useApp((s) => s.addNotif);
  const { closeSheet, toast } = useNav();

  const [text, setText] = React.useState("");
  const [where, setWhere] = React.useState("");
  const [selfHint, setSelfHint] = React.useState("");
  if (!event) return null;
  const valid = text.trim().length > 8 && selfHint.trim().length > 2;

  return (
    <div className="px-5 pb-8 pt-2 space-y-4">
      <div className="flex items-start gap-2.5 rounded-2xl bg-card hairline p-3 text-[12px] text-faint">
        <Sparkles size={15} className="text-accent shrink-0 mt-0.5" />
        <span>
          Only people who were at <b className="text-dim">{event.title}</b> see this. Stay kind — describe the moment, not the body. Anonymous until you both say yes · fades in 72h.
        </span>
      </div>

      <Field label="What caught your eye?">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 240))}
          placeholder="Silver nails, dancing by the disco ball — we locked eyes at the bar and I lost my nerve…"
          className="w-full rounded-2xl bg-card hairline px-4 py-3 text-[14.5px] resize-none focus:border-accent/60"
          autoFocus
        />
        <div className="text-right text-[11px] text-faint mt-1">{text.length} / 240</div>
      </Field>

      <Field label="Where / when?" hint="Helps the right person know it's them.">
        <input className={inputCls} value={where} onChange={(e) => setWhere(e.target.value)} placeholder="by the disco ball, ~1am" />
      </Field>

      <Field label="How will they recognize you?">
        <input className={inputCls} value={selfHint} onChange={(e) => setSelfHint(e.target.value)} placeholder="I was the one in the red Carhartt" />
      </Field>

      <Btn
        size="lg"
        disabled={!valid}
        onClick={() => {
          const id = postSpark(eventId, text.trim(), where.trim(), selfHint.trim());
          closeSheet();
          toast("✨", "Spark posted", "Anonymous — we'll nudge you if they bite");
          // simulate the described person spotting it
          const candidate = [...event.going, ...event.maybe].find((u) => u !== ME);
          if (candidate) {
            setTimeout(() => {
              claimSpark(id, candidate);
              toast("👀", "Someone thinks that's them", "Open the capsule to connect — or not");
              addNotif({ kind: "spark", text: `Someone at ${event.title} thinks your spark is about them 👀`, eventId });
            }, 6000);
          }
        }}
      >
        <Sparkles size={16} /> Post the spark
      </Btn>
    </div>
  );
}
