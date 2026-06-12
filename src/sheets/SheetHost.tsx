import React from "react";
import { Handshake, Lock } from "lucide-react";
import { useApp, userById } from "../store";
import { useNav, type SheetT } from "../nav";
import { ME, USERS } from "../data";
import { t } from "../i18n";
import { cx, eur, fmtDay, uid } from "../util";
import { Sheet } from "../components/Sheet";
import { Avatar } from "../components/Avatar";
import { Btn, Field, inputCls } from "../components/Primitives";
import { AgendaRow, BirthdayRow } from "../screens/Calendar";

export function SheetHost() {
  const sheet = useNav((s) => s.sheet);
  const closeSheet = useNav((s) => s.closeSheet);
  const lastRef = React.useRef<SheetT | null>(null);
  if (sheet && sheet.kind !== "create") lastRef.current = sheet;
  const active = sheet && sheet.kind !== "create" ? sheet : null;
  const shown = active ?? lastRef.current;

  return (
    <Sheet open={!!active} onClose={closeSheet} title={shown ? titleFor(shown) : undefined}>
      {shown && <SheetContent sheet={shown} />}
    </Sheet>
  );
}

function titleFor(s: SheetT): string {
  switch (s.kind) {
    case "expense": return "Add to the Tab";
    case "pact": return "Make a pact";
    case "mood": return "How's your week?";
    case "editProfile": return "Edit profile";
    case "receipt": return "Friendship receipt";
    case "card": return "Birthday card";
    case "radarStatus": return "Where are you?";
    case "dayDetail": return new Date(s.dateKey + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    default: return "";
  }
}

function SheetContent({ sheet }: { sheet: SheetT }) {
  switch (sheet.kind) {
    case "expense": return <ExpenseSheet eventId={sheet.eventId} />;
    case "pact": return <PactSheet eventId={sheet.eventId} />;
    case "mood": return <MoodSheet />;
    case "editProfile": return <EditProfileSheet />;
    case "receipt": return <ReceiptSheet userId={sheet.userId} />;
    case "card": return <CardSheet userId={sheet.userId} />;
    case "radarStatus": return <RadarStatusSheet eventId={sheet.eventId} />;
    case "dayDetail": return <DayDetailSheet dateKey={sheet.dateKey} />;
    default: return null;
  }
}

/* ════════ Expense ════════ */
function ExpenseSheet({ eventId }: { eventId: string }) {
  const event = useApp((s) => s.events.find((e) => e.id === eventId));
  const addExpense = useApp((s) => s.addExpense);
  const { closeSheet, toast } = useNav();
  const members = React.useMemo(
    () => [...new Set([ME, ...(event?.going ?? []), ...(event?.invited ?? [])])],
    [event]
  );
  const [amount, setAmount] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [paidBy, setPaidBy] = React.useState(ME);
  const [among, setAmong] = React.useState<string[]>(members);

  if (!event) return null;
  const value = parseFloat(amount.replace(",", "."));
  const valid = !isNaN(value) && value > 0 && among.length > 0;

  return (
    <div className="px-5 pb-8 pt-2 space-y-5">
      <Field label="Amount (EUR)">
        <input
          className="w-full h-16 rounded-2xl bg-card hairline px-5 font-display font-bold text-[28px] tracking-tight focus:border-accent/60"
          placeholder="0,00"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
      </Field>
      <Field label="What for?">
        <input
          className={inputCls}
          placeholder="e.g. Uber to venue"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </Field>
      <Field label="Paid by">
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const u = userById(m);
            return (
              <button
                key={m}
                onClick={() => setPaidBy(m)}
                className={cx(
                  "press flex items-center gap-1.5 rounded-full pl-1 pr-3 h-9 text-[13px] font-semibold hairline",
                  paidBy === m ? "bg-accent text-white" : "bg-card text-dim"
                )}
              >
                <Avatar user={u} size={26} /> {m === ME ? "Me" : u?.name}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label={`Split between (${among.length})`}>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const u = userById(m);
            const on = among.includes(m);
            return (
              <button
                key={m}
                onClick={() => setAmong(on ? among.filter((x) => x !== m) : [...among, m])}
                className={cx(
                  "press flex items-center gap-1.5 rounded-full pl-1 pr-3 h-9 text-[13px] font-semibold hairline",
                  on ? "bg-card text-ink ring-1 ring-accent/60" : "bg-card/40 text-faint"
                )}
              >
                {on && <span className="text-mint text-[11px] ml-1.5">✓</span>}
                <Avatar user={u} size={26} /> {m === ME ? "Me" : u?.name}
              </button>
            );
          })}
        </div>
        {valid && (
          <div className="text-[12px] text-faint mt-2 px-1">
            = {eur(value / among.length)} {`each`}
          </div>
        )}
      </Field>
      <Btn
        size="lg"
        disabled={!valid}
        onClick={() => {
          addExpense(eventId, value, label.trim() || "Expense", paidBy, among);
          closeSheet();
          toast("💸", `${eur(value)} on the Tab`, "We did the math for everyone");
        }}
      >
        Add to Tab
      </Btn>
    </div>
  );
}

/* ════════ Pact ════════ */
function PactSheet({ eventId }: { eventId: string }) {
  const event = useApp((s) => s.events.find((e) => e.id === eventId));
  const following = useApp((s) => s.following);
  const proposePact = useApp((s) => s.proposePact);
  const sealPact = useApp((s) => s.sealPact);
  const addNotif = useApp((s) => s.addNotif);
  const { closeSheet, toast } = useNav();
  const [pick, setPick] = React.useState<string | null>(null);
  if (!event) return null;

  const candidates = [...new Set([...event.invited, ...event.maybe, ...event.going, ...following])]
    .filter((u) => u !== ME && !event.pacts.some((p) => p.between.includes(u)));

  return (
    <div className="px-5 pb-8 pt-2">
      <p className="text-[13.5px] text-dim text-center mb-5">
        “I'll go if you go.” Pick a friend — when they accept, you're <b className="text-ink">both auto-RSVP'd</b>. No backing out.
      </p>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {candidates.slice(0, 8).map((c) => {
          const u = userById(c);
          return (
            <button key={c} onClick={() => setPick(c)} className="press flex flex-col items-center gap-1.5">
              <div className={cx("rounded-full p-0.5", pick === c && "ring-2 ring-accent")}>
                <Avatar user={u} size={56} mood />
              </div>
              <span className={cx("text-[11px] font-medium truncate w-full text-center", pick === c ? "text-ink" : "text-faint")}>
                {u?.name}
              </span>
            </button>
          );
        })}
      </div>
      <Btn
        size="lg"
        disabled={!pick}
        onClick={() => {
          const friend = userById(pick!);
          const pactId = proposePact(eventId, pick!);
          closeSheet();
          toast("🤞", `Pact sent to ${friend?.name}`, "Waiting for the handshake…");
          setTimeout(() => {
            sealPact(eventId, pactId);
            toast("🤝", `${friend?.name} sealed the pact!`, "You're both in. It's happening.");
            addNotif({
              kind: "pact",
              text: `${friend?.name} sealed your pact for ${event.title} — you're both in 🤝`,
              eventId,
              userId: pick!,
            });
          }, 5000);
        }}
      >
        <Handshake size={17} /> Propose the pact
      </Btn>
    </div>
  );
}

/* ════════ Mood ════════ */
function MoodSheet() {
  const mood = useApp((s) => s.mood);
  const setMood = useApp((s) => s.setMood);
  const { closeSheet, toast } = useNav();
  const options = [
    ["open", "🟢", "Open to plans", "Friends see you're up for things"],
    ["not-today", "🌙", "Not today", "Quiet signal — no pressure invites"],
    ["lazy-week", "😴", "Lazy week", "Recharging. Back soon"],
  ] as const;

  return (
    <div className="px-5 pb-8 pt-2 space-y-2.5">
      {options.map(([key, emoji, label, desc]) => (
        <button
          key={key}
          onClick={() => {
            setMood(key);
            closeSheet();
            toast(emoji, `Status set: ${label}`);
          }}
          className={cx(
            "press w-full flex items-center gap-3.5 rounded-2xl p-4 text-left hairline",
            mood === key ? "bg-accent/14 ring-1 ring-accent" : "bg-card"
          )}
        >
          <span className="text-2xl">{emoji}</span>
          <span className="flex-1">
            <span className="block text-[15px] font-bold">{label}</span>
            <span className="block text-[12px] text-faint mt-0.5">{desc}</span>
          </span>
          {mood === key && <span className="text-accent font-bold">✓</span>}
        </button>
      ))}
      {mood && (
        <button
          onClick={() => {
            setMood(null);
            closeSheet();
          }}
          className="press w-full text-center text-[13px] text-faint py-2"
        >
          Clear status
        </button>
      )}
    </div>
  );
}

/* ════════ Edit profile ════════ */
function EditProfileSheet() {
  const me = useApp((s) => s.me);
  const updateMe = useApp((s) => s.updateMe);
  const { closeSheet, toast } = useNav();
  const [form, setForm] = React.useState({ name: me.name, handle: me.handle, bio: me.bio, birthday: me.birthday });

  return (
    <div className="px-5 pb-8 pt-2 space-y-4">
      <Field label="Display name">
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Handle">
        <input className={inputCls} value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value.replace(/\s/g, "") })} />
      </Field>
      <Field label="Bio">
        <textarea
          rows={2}
          className="w-full rounded-2xl bg-card hairline px-4 py-3 text-[15px] resize-none"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </Field>
      <Field label="Birthday" hint="Friends get it on their calendar automatically — no more forgetting.">
        <input type="date" className={inputCls} value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
      </Field>
      <Btn
        size="lg"
        onClick={() => {
          updateMe(form);
          closeSheet();
          toast("✅", "Profile updated");
        }}
      >
        Save
      </Btn>
    </div>
  );
}

/* ════════ Friendship receipt ════════ */
function ReceiptSheet({ userId }: { userId: string }) {
  const events = useApp((s) => s.events);
  const { toast, closeSheet } = useNav();
  const u = userById(userId);
  if (!u) return null;

  const shared = events
    .filter((e) => e.end < Date.now() && [ME, userId].every((x) => e.going.includes(x) || e.createdBy === x))
    .sort((a, b) => a.start - b.start);
  const first = shared[0];
  const pacts = events.reduce(
    (a, e) => a + e.pacts.filter((p) => p.status === "sealed" && p.between.includes(ME) && p.between.includes(userId)).length,
    0
  );
  const tabVolume = events.reduce(
    (a, e) =>
      a +
      e.expenses
        .filter((x) => [ME, userId].every((m) => x.among.includes(m) || x.paidBy === m))
        .reduce((x, y) => x + y.amount, 0),
    0
  );
  const photos = shared.reduce((a, e) => a + e.photos.length, 0);

  const lines: Array<[string, string]> = [
    ["NIGHTS TOGETHER", `${shared.length}×`],
    ["FIRST ONE", first ? fmtDay(first.start) : "—"],
    ["PACTS SEALED", `${pacts}×`],
    ["TABS SPLIT", eur(tabVolume)],
    ["SHARED SHOTS", `${photos}`],
  ];

  return (
    <div className="px-5 pb-8 pt-2">
      <div className="mx-auto max-w-[300px] bg-[#FFFDF6] text-[#1A1818] rounded-lg p-5 font-mono text-[12px] shadow-[0_24px_60px_rgba(0,0,0,0.5)] rotate-[-1deg]">
        <div className="text-center">
          <div className="text-[15px] font-bold tracking-widest">I AM (IN)</div>
          <div className="text-[10px] opacity-60 mt-0.5">FRIENDSHIP RECEIPT</div>
          <div className="text-[10px] opacity-60">{new Date().toLocaleDateString("de-DE")} · STUTTGART</div>
        </div>
        <div className="border-t border-dashed border-[#1A1818]/30 my-3" />
        <div className="flex items-center justify-center gap-2 mb-3">
          <Avatar user={USERS.find((x) => x.id === ME)} size={28} />
          <span className="font-bold">×</span>
          <Avatar user={u} size={28} />
        </div>
        <div className="text-center font-bold mb-3">YOU + {u.name.toUpperCase()}</div>
        {lines.map(([l, v]) => (
          <div key={l} className="flex justify-between py-1">
            <span className="opacity-70">{l}</span>
            <span className="font-bold">{v}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-[#1A1818]/30 my-3" />
        <div className="text-center font-bold">TOTAL: PRICELESS</div>
        <div className="mt-3 h-9 flex items-end justify-center gap-[2px]">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="bg-[#1A1818]" style={{ width: i % 4 === 0 ? 3 : 1.5, height: 14 + ((i * 7) % 18) }} />
          ))}
        </div>
        <div className="text-center text-[9px] opacity-50 mt-1.5">NO REFUNDS · NO EXCHANGES</div>
      </div>
      <Btn
        size="lg"
        className="mt-5"
        onClick={() => {
          closeSheet();
          toast("🧾", "Receipt saved", "Share it on your story");
        }}
      >
        Save as memory
      </Btn>
    </div>
  );
}

/* ════════ Birthday card ════════ */
function CardSheet({ userId }: { userId: string }) {
  const sendCard = useApp((s) => s.sendCard);
  const addNotif = useApp((s) => s.addNotif);
  const { closeSheet, toast } = useNav();
  const u = userById(userId);
  const designs = [
    { id: 0, emoji: "🎂", bg: "linear-gradient(135deg,#FF6AC2,#8A6CFF)", label: "Classic" },
    { id: 1, emoji: "🪩", bg: "linear-gradient(135deg,#4C2FD8,#00D4FF)", label: "Rave" },
    { id: 2, emoji: "🌻", bg: "linear-gradient(135deg,#FFC65C,#FF6A5C)", label: "Soft" },
  ];
  const [design, setDesign] = React.useState(0);
  const [msg, setMsg] = React.useState("");
  if (!u) return null;

  return (
    <div className="px-5 pb-8 pt-2 space-y-5">
      <div className="flex gap-3 justify-center">
        {designs.map((d) => (
          <button
            key={d.id}
            onClick={() => setDesign(d.id)}
            className={cx("press rounded-2xl p-0.5", design === d.id && "ring-2 ring-accent")}
          >
            <div className="w-[88px] h-[112px] rounded-[14px] flex flex-col items-center justify-center text-white" style={{ background: d.bg }}>
              <span className="text-3xl">{d.emoji}</span>
              <span className="text-[10px] font-bold mt-2 opacity-80">{d.label}</span>
            </div>
          </button>
        ))}
      </div>
      <Field label={`To ${u.name}`}>
        <textarea
          rows={3}
          className="w-full rounded-2xl bg-card hairline px-4 py-3 text-[15px] resize-none"
          placeholder={`Happy birthday ${u.name}! 🎉 …`}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
      </Field>
      <Btn
        size="lg"
        onClick={() => {
          sendCard(userId);
          closeSheet();
          toast("💌", `Card sent to ${u.name}`, "They'll open it on the day");
          addNotif({ kind: "birthday", text: `Your card to ${u.name} is on its way 💌`, userId });
        }}
      >
        Send the card
      </Btn>
    </div>
  );
}

/* ════════ Radar status ════════ */
function RadarStatusSheet({ eventId }: { eventId: string }) {
  const event = useApp((s) => s.events.find((e) => e.id === eventId));
  const setRadar = useApp((s) => s.setRadar);
  const { closeSheet, toast } = useNav();
  if (!event) return null;
  const mine = event.radar[ME];
  const options = [
    ["there", "🎉", "I'm there", "Shows on the inner ring"],
    ["otw", "🛵", "On the way", "ETA vibes for the group"],
    ["home", "🛋️", "Still home", "Honesty is hot"],
  ] as const;

  return (
    <div className="px-5 pb-8 pt-2 space-y-2.5">
      {options.map(([key, emoji, label, desc]) => (
        <button
          key={key}
          onClick={() => {
            setRadar(eventId, key);
            closeSheet();
            toast(emoji, label, "Your circle can see it on the radar");
          }}
          className={cx(
            "press w-full flex items-center gap-3.5 rounded-2xl p-4 text-left hairline",
            mine === key ? "bg-mint/12 ring-1 ring-mint/60" : "bg-card"
          )}
        >
          <span className="text-2xl">{emoji}</span>
          <span className="flex-1">
            <span className="block text-[15px] font-bold">{label}</span>
            <span className="block text-[12px] text-faint mt-0.5">{desc}</span>
          </span>
          {mine === key && <span className="text-mint font-bold">✓</span>}
        </button>
      ))}
      {mine && (
        <button
          onClick={() => {
            setRadar(eventId, null);
            closeSheet();
          }}
          className="press w-full text-center text-[13px] text-faint py-2"
        >
          Go off-radar 👻
        </button>
      )}
    </div>
  );
}

/* ════════ Day detail ════════ */
function DayDetailSheet({ dateKey: dk }: { dateKey: string }) {
  const events = useApp((s) => s.events);
  const blockedDays = useApp((s) => s.blockedDays);
  const toggleBlockedDay = useApp((s) => s.toggleBlockedDay);
  const following = useApp((s) => s.following);
  const { closeSheet, toast } = useNav();

  const dayTs = new Date(dk + "T12:00").getTime();
  const dayEvents = events
    .filter((e) => {
      const d = new Date(e.start);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` === dk;
    })
    .filter((e) => e.going.includes(ME) || e.createdBy === ME || e.maybe.includes(ME))
    .sort((a, b) => a.start - b.start);

  const bdays = USERS.filter(
    (u) =>
      u.id !== ME &&
      following.includes(u.id) &&
      u.birthday &&
      new Date(dayTs).getMonth() + 1 === u.birthday.month &&
      new Date(dayTs).getDate() === u.birthday.day
  );
  const blocked = blockedDays.includes(dk);

  return (
    <div className="px-5 pb-8 pt-2 space-y-2.5" onClick={(e) => e.stopPropagation()}>
      {bdays.map((u) => (
        <BirthdayRow key={u.id} user={u} ts={dayTs} />
      ))}
      {dayEvents.map((e) => (
        <div key={e.id} onClick={closeSheet}>
          <AgendaRow event={e} />
        </div>
      ))}
      {dayEvents.length === 0 && bdays.length === 0 && !blocked && (
        <div className="text-center text-faint text-[13.5px] py-4">Nothing planned this day.</div>
      )}
      {blocked && (
        <div className="rounded-2xl bg-card hairline p-4 text-center text-[13.5px] text-dim">
          😴 You've blocked this day — friends planning around you can see you're out.
        </div>
      )}
      <Btn
        variant={blocked ? "soft" : "outline"}
        className="w-full"
        onClick={() => {
          toggleBlockedDay(dk);
          closeSheet();
          toast(blocked ? "🔓" : "😴", blocked ? "Day unblocked" : "Day blocked", blocked ? "You're available again" : "Friends see you're unavailable");
        }}
      >
        {blocked ? "🔓 Unblock this day" : "😴 Block this day"}
      </Btn>
    </div>
  );
}
