import React from "react";
import { motion } from "framer-motion";
import {
  Archive,
  BellRing,
  CalendarPlus,
  Copy,
  ExternalLink,
  Eye,
  Flame,
  HandHeart,
  Handshake,
  Link2,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Radar as RadarIcon,
  Send,
  Share2,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { EventT, LineLevel, PollVote } from "../types";
import { ME, USERS } from "../data";
import { useApp, userById } from "../store";
import { useNav, openPerson } from "../nav";
import { t } from "../i18n";
import { cx, countdown, eur, fmtFull, fmtTime, forecast, haptic, HOUR, relDay, VIBES, downloadIcs } from "../util";
import { StackScreen, IconBtn } from "../components/StackScreen";
import { Cover } from "../components/Cover";
import { Avatar, Facepile } from "../components/Avatar";
import { Btn, Section } from "../components/Primitives";
import { RsvpButtons } from "../components/RSVP";
import { LiveBadge } from "../components/EventCard";

const sessionToasts = new Set<string>();

export function EventDetailScreen({ id }: { id: string }) {
  const event = useApp((s) => s.events.find((e) => e.id === id));
  const lang = useApp((s) => s.lang);
  const mode = useApp((s) => s.mode);
  const rsvp = useApp((s) => s.rsvp);
  const { push, openSheet, toast, pop } = useNav();

  React.useEffect(() => {
    if (!event) return;
    const live = Date.now() >= event.start && Date.now() <= event.end;
    if (live && !sessionToasts.has(event.id)) {
      sessionToasts.add(event.id);
      const timer = setTimeout(() => {
        const friend = userById(event.going.find((g) => g !== ME) ?? "felice");
        if (friend) toast("📍", `${friend.name} just got there`, event.title);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [event?.id]);

  if (!event) return null;

  const now = Date.now();
  const live = now >= event.start && now <= event.end;
  const past = now > event.end;
  const radarWindow = now > event.start - 4 * HOUR && now < event.end;
  const mine = event.createdBy === ME;
  const myRsvp = event.going.includes(ME) ? "in" : event.maybe.includes(ME) ? "maybe" : null;
  const host = userById(event.createdBy);
  const vibe = VIBES[event.vibe];

  const share = async () => {
    const text = `${event.title} · ${fmtFull(event.start, lang)} · I am (IN)`;
    try {
      if (navigator.share) await navigator.share({ title: event.title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast("🔗", "Link copied", "Send it to your people");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <StackScreen
      chrome="float"
      noPad
      right={
        <>
          {mine && !past && (
            <IconBtn onClick={() => openSheet({ kind: "create", editId: event.id })}>
              <Pencil size={16} strokeWidth={2.2} />
            </IconBtn>
          )}
          <IconBtn onClick={share}>
            <Share2 size={16} strokeWidth={2.2} />
          </IconBtn>
        </>
      }
    >
      <div className="pb-36">
        {/* ─────── hero ─────── */}
        <Cover event={event} rounded="rounded-none" className="h-[300px]" emojiSize={84}>
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#09090D] via-[#09090D]/60 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 px-5 pb-4">
            <div className="flex items-center gap-2 mb-2.5">
              {live && <LiveBadge />}
              <span className="glass hairline rounded-full h-6 px-2.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-white">
                {vibe.emoji} {vibe.label}
              </span>
              <PrivacyChip privacy={event.privacy} />
            </div>
            <h1 className="font-display font-bold text-[28px] leading-[1.05] tracking-tight text-white text-balance">
              {event.title}
            </h1>
            <div className="text-[14px] text-white/80 font-medium mt-2">
              {relDay(event.start, lang)} · {fmtTime(event.start, lang)}
              {!past && !live && (
                <span className="text-white/50"> · in {countdown(event.start)}</span>
              )}
            </div>
          </div>
        </Cover>

        <div className="px-4 mt-4 space-y-3.5">
          {past && <CapsuleLinkCard event={event} />}
          {radarWindow && <RadarModule event={event} />}
          {radarWindow && event.lineMode && <LineModule event={event} />}
          {past && <ExitPollModule event={event} />}

          <InfoCard event={event} />
          <PeopleCard event={event} />

          {event.description && (
            <Section title={t("details", lang)}>
              <p className="text-[14px] leading-relaxed text-dim whitespace-pre-wrap">
                {event.description}
              </p>
              {event.sourceUrl && (
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent mt-3 press"
                >
                  <ExternalLink size={14} /> {t("viewOriginal", lang)}
                  {event.sourceType === "screenshot" && " · parsed from screenshot ✨"}
                </a>
              )}
            </Section>
          )}

          {!past && mine && event.going.length <= 3 && <PulseModule event={event} />}
          {!past && event.bringEnabled && <BringModule event={event} />}
          <TabModule event={event} />
          {!past && <PactModule event={event} />}
          {!past && <PredictionModule event={event} />}
          {mine && mode === "organizer" && <OrganizerModule event={event} />}
          <CommentsModule event={event} />
        </div>
      </div>

      {/* ─────── sticky action bar ─────── */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 glass hairline-t px-5 pt-3"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        {past ? (
          <Btn
            size="lg"
            onClick={() => push({ kind: "capsule", id: event.id })}
          >
            <Archive size={18} /> {t("timeCapsule", lang)} →
          </Btn>
        ) : event.privacy === "ghost" ? (
          <div className="flex items-center justify-center gap-2 h-[52px] text-[14px] text-faint font-medium">
            👻 Ghost event — only you can see this
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[15px] font-bold">
                {event.going.length} {t("going", lang)}
              </div>
              <div className="text-[12px] text-faint truncate">
                {event.maybe.length > 0
                  ? `${event.maybe.length} ${t("maybe", lang).toLowerCase()}`
                  : event.invited.length > 0
                    ? `${event.invited.length} invited`
                    : "be the first"}
              </div>
            </div>
            <RsvpButtons size="lg" value={myRsvp} onChange={(r) => rsvp(event.id, r)} />
          </div>
        )}
      </div>
    </StackScreen>
  );
}

/* ════════ pieces ════════ */

function PrivacyChip({ privacy }: { privacy: EventT["privacy"] }) {
  const map = {
    circle: ["🫂", "Circle"],
    list: ["🔒", "List only"],
    public: ["🌍", "Public"],
    ghost: ["👻", "Ghost"],
  } as const;
  const [e, l] = map[privacy];
  return (
    <span className="glass hairline rounded-full h-6 px-2.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-white">
      {e} {l}
    </span>
  );
}

function InfoCard({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const toast = useNav((s) => s.toast);
  return (
    <div className="rounded-3xl bg-raise hairline divide-y divide-line/[0.06]">
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 press text-left"
        onClick={() => {
          downloadIcs(event.title, event.start, event.end, event.venue);
          toast("📆", t("addToCalendar", lang), "Saved as .ics");
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-accent/12 text-accent flex items-center justify-center shrink-0">
          <CalendarPlus size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-semibold">{fmtFull(event.start, lang)}</div>
          <div className="text-[12.5px] text-faint">
            {fmtTime(event.start, lang)} – {fmtTime(event.end, lang)}
          </div>
        </div>
        <span className="text-[12px] font-semibold text-accent shrink-0">+ ics</span>
      </button>

      {event.venue && (
        <a
          className="flex items-center gap-3 px-4 py-3.5 press"
          href={`https://maps.google.com/?q=${encodeURIComponent(`${event.venue}, ${event.city}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          <div className="w-9 h-9 rounded-xl bg-coral/12 text-coral flex items-center justify-center shrink-0">
            <MapPin size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] font-semibold truncate">{event.venue}</div>
            <div className="text-[12.5px] text-faint">{event.city}</div>
          </div>
          <ExternalLink size={14} className="text-faint shrink-0" />
        </a>
      )}

      {event.weather && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center text-lg shrink-0">
            {event.weather.icon}
          </div>
          <div className="flex-1">
            <div className="text-[14.5px] font-semibold">
              {event.weather.temp}°C · {event.weather.label}
            </div>
            <div className="text-[12.5px] text-faint">
              {t("forecast", lang)} · {fmtTime(event.start, lang)}
            </div>
          </div>
        </div>
      )}

      {event.ticket && (
        <a
          className="flex items-center gap-3 px-4 py-3.5 press"
          href={event.ticket}
          target="_blank"
          rel="noreferrer"
        >
          <div className="w-9 h-9 rounded-xl bg-mint/12 text-mint flex items-center justify-center shrink-0">
            <Ticket size={17} />
          </div>
          <div className="flex-1">
            <div className="text-[14.5px] font-semibold">Tickets</div>
            <div className="text-[12.5px] text-faint">Sold by the organizer</div>
          </div>
          <ExternalLink size={14} className="text-faint shrink-0" />
        </a>
      )}
    </div>
  );
}

function PeopleCard({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const host = userById(event.createdBy);
  const going = event.going.map(userById).filter(Boolean);
  const maybe = event.maybe.map(userById).filter(Boolean);
  return (
    <Section
      icon={<Users size={16} className="text-accent" />}
      title={t("whosIn", lang)}
      aside={
        host && (
          <button
            onClick={() => host.id !== ME && openPerson(host.id)}
            className="flex items-center gap-1.5 press"
          >
            <Avatar user={host} size={20} />
            <span className="text-[12.5px] text-faint">
              {t("hostedBy", lang)} <b className="text-dim">{host.id === ME ? "you" : host.name}</b>
              {host.verified && " ✓"}
            </span>
          </button>
        )
      }
    >
      <div className="flex flex-wrap gap-2">
        {going.map((u) => (
          <button
            key={u!.id}
            onClick={() => u!.id !== ME && openPerson(u!.id)}
            className="flex items-center gap-1.5 bg-card hairline rounded-full pl-1 pr-3 h-8 press"
          >
            <Avatar user={u} size={24} mood />
            <span className="text-[12.5px] font-semibold">{u!.id === ME ? "you" : u!.name}</span>
          </button>
        ))}
        {maybe.map((u) => (
          <button
            key={u!.id}
            onClick={() => u!.id !== ME && openPerson(u!.id)}
            className="flex items-center gap-1.5 bg-card/50 hairline rounded-full pl-1 pr-3 h-8 opacity-60 press"
          >
            <Avatar user={u} size={24} />
            <span className="text-[12.5px] font-medium">{u!.name}?</span>
          </button>
        ))}
        {going.length === 0 && maybe.length === 0 && (
          <span className="text-[13px] text-faint">Nobody yet — be the brave one.</span>
        )}
      </div>
    </Section>
  );
}

/* ── "Are we actually doing this?" ── */
function PulseModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const { sendPulse, rsvp } = useApp.getState();
  const toast = useNav((s) => s.toast);
  const addNotif = useApp((s) => s.addNotif);
  const pulsed = !!event.pulsedAt;

  return (
    <div
      className="rounded-3xl p-4 hairline relative overflow-hidden"
      style={{
        background:
          "linear-gradient(120deg, rgba(138,108,255,0.18), rgba(62,230,160,0.08)), rgb(var(--c-raise))",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Flame size={16} className="text-accent" />
        <h3 className="font-display font-semibold text-[15px]">{t("pulseTitle", lang)}</h3>
      </div>
      <p className="text-[13px] text-dim mb-3">
        Only {event.going.length} confirmed. Send up a flare and see who's still in.
      </p>
      <Btn
        disabled={pulsed}
        onClick={() => {
          sendPulse(event.id);
          toast("📣", "Pulse sent to everyone invited");
          setTimeout(() => {
            const joiner = event.invited.find((u) => u !== ME && !event.going.includes(u));
            if (joiner) {
              const u = userById(joiner);
              useApp.getState().updateEvent(event.id, {
                going: [...new Set([...useApp.getState().events.find((e) => e.id === event.id)!.going, joiner])],
              });
              toast("⚡", `${u?.name}: ok ok I'm in 😅`, event.title);
              addNotif({ kind: "rsvp", text: `${u?.name} is in for ${event.title}`, eventId: event.id, userId: joiner });
            }
          }, 4000);
        }}
      >
        {pulsed ? "Pulse sent ✓" : t("sendPulse", lang)}
      </Btn>
    </div>
  );
}

/* ── Bring what? ── */
function BringModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const claimBring = useApp((s) => s.claimBring);
  const addBringItem = useApp((s) => s.addBringItem);
  const toast = useNav((s) => s.toast);
  const [adding, setAdding] = React.useState("");
  const claimed = event.bring.filter((b) => b.claimedBy).length;

  return (
    <Section
      icon={<Package size={16} className="text-gold" />}
      title={t("bringWhat", lang)}
      aside={
        <span className="text-[12px] text-faint font-medium">
          {claimed}/{event.bring.length} claimed
        </span>
      }
    >
      <div className="space-y-2">
        {event.bring.map((item) => {
          const claimer = item.claimedBy ? userById(item.claimedBy) : null;
          const mineClaim = item.claimedBy === ME;
          return (
            <div
              key={item.id}
              className={cx(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 hairline",
                item.claimedBy ? "bg-card/40" : "bg-card"
              )}
            >
              <span className="text-lg w-7 text-center shrink-0">{item.emoji}</span>
              <span
                className={cx(
                  "flex-1 text-[14px] font-medium truncate",
                  item.claimedBy && !mineClaim && "text-faint"
                )}
              >
                {item.label}
              </span>
              {claimer && !mineClaim ? (
                <span className="flex items-center gap-1.5 text-[12px] text-faint shrink-0">
                  <Avatar user={claimer} size={18} /> {claimer.name}
                </span>
              ) : (
                <Btn
                  size="sm"
                  variant={mineClaim ? "mint" : "soft"}
                  onClick={() => {
                    claimBring(event.id, item.id);
                    if (!mineClaim) toast("🙌", `You've got the ${item.label.toLowerCase()}`);
                  }}
                >
                  {mineClaim ? "On you ✓" : "I got it"}
                </Btn>
              )}
            </div>
          );
        })}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!adding.trim()) return;
            addBringItem(event.id, adding.trim(), "🧩");
            setAdding("");
          }}
          className="flex items-center gap-2"
        >
          <input
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            placeholder="Add something the group needs…"
            className="flex-1 h-10 rounded-2xl bg-card hairline px-3.5 text-[13.5px]"
          />
          <button
            type="submit"
            className="press w-10 h-10 rounded-2xl bg-card hairline flex items-center justify-center text-dim shrink-0"
          >
            <Plus size={17} />
          </button>
        </form>
      </div>
    </Section>
  );
}

/* ── Tab (cost splitting) ── */
export function TabModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const { openSheet, toast } = useNav();
  const addExpense = useApp((s) => s.addExpense);

  const balances = React.useMemo(() => {
    // pairwise net between me and each user
    const net: Record<string, number> = {};
    for (const x of event.expenses) {
      const share = x.amount / x.among.length;
      for (const member of x.among) {
        if (member === x.paidBy) continue;
        if (member === ME) net[x.paidBy] = (net[x.paidBy] ?? 0) - share;
        else if (x.paidBy === ME) net[member] = (net[member] ?? 0) + share;
      }
    }
    return Object.entries(net).filter(([, v]) => Math.abs(v) > 0.01);
  }, [event.expenses]);

  const total = event.expenses.reduce((a, x) => a + x.amount, 0);

  if (event.expenses.length === 0) {
    return (
      <Section icon={<Wallet size={16} className="text-mint" />} title={t("tab", lang)}>
        <p className="text-[13px] text-dim mb-3">{t("tabDesc", lang)}</p>
        <Btn variant="soft" onClick={() => openSheet({ kind: "expense", eventId: event.id })}>
          <Plus size={15} /> {t("addExpense", lang)}
        </Btn>
      </Section>
    );
  }

  return (
    <Section
      icon={<Wallet size={16} className="text-mint" />}
      title={t("tab", lang)}
      aside={<span className="text-[12.5px] font-bold text-dim">{eur(total)}</span>}
    >
      <div className="space-y-2 mb-3">
        {event.expenses.map((x) => {
          const payer = userById(x.paidBy);
          return (
            <div key={x.id} className="flex items-center gap-3">
              <Avatar user={payer} size={30} />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold truncate">{x.label}</div>
                <div className="text-[11.5px] text-faint">
                  {payer?.id === ME ? "you" : payer?.name} paid · split {x.among.length} ways
                </div>
              </div>
              <span className="text-[13.5px] font-bold shrink-0">{eur(x.amount)}</span>
            </div>
          );
        })}
      </div>

      {balances.length > 0 && (
        <div className="rounded-2xl bg-card hairline divide-y divide-line/[0.06] mb-3">
          {balances.map(([uid, v]) => {
            const u = userById(uid);
            const owesMe = v > 0;
            return (
              <div key={uid} className="flex items-center gap-2.5 px-3 py-2.5">
                <Avatar user={u} size={24} />
                <span className="flex-1 text-[13px]">
                  {owesMe ? (
                    <>
                      <b>{u?.name}</b> owes you <b className="text-mint">{eur(v)}</b>
                    </>
                  ) : (
                    <>
                      you owe <b>{u?.name}</b> <b className="text-coral">{eur(-v)}</b>
                    </>
                  )}
                </span>
                <Btn
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    if (owesMe) toast("👉", `Nudge sent to ${u?.name}`, `${eur(v)} open on ${event.title}`);
                    else {
                      addExpense(event.id, -v, "Settled up 💸", ME, [uid]);
                      toast("💸", `Paid ${u?.name} back`, eur(-v));
                    }
                  }}
                >
                  {owesMe ? "Remind" : "Settle"}
                </Btn>
              </div>
            );
          })}
        </div>
      )}

      <Btn variant="soft" onClick={() => openSheet({ kind: "expense", eventId: event.id })}>
        <Plus size={15} /> {t("addExpense", lang)}
      </Btn>
    </Section>
  );
}

/* ── Pact ── */
function PactModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const { openSheet, toast } = useNav();
  const sealPact = useApp((s) => s.sealPact);

  return (
    <Section icon={<Handshake size={16} className="text-accent2" />} title={t("pact", lang)}>
      <p className="text-[13px] text-dim mb-3">{t("pactDesc", lang)}</p>
      <div className="space-y-2">
        {event.pacts.map((p) => {
          const [a, b] = p.between.map(userById);
          const involvesMe = p.between.includes(ME);
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-card hairline px-3 py-2.5">
              <Facepile users={[a, b]} size={26} />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold">
                  {a?.id === ME ? "You" : a?.name} × {b?.id === ME ? "you" : b?.name}
                </div>
                <div className="text-[11.5px] text-faint">
                  {p.status === "sealed" ? "Sealed — both auto-RSVP'd 🤝" : "Waiting for the handshake…"}
                </div>
              </div>
              {p.status === "pending" && involvesMe ? (
                <Btn
                  size="sm"
                  onClick={() => {
                    sealPact(event.id, p.id);
                    toast("🤝", "Pact sealed", "You're both in. No backing out.");
                  }}
                >
                  Seal it
                </Btn>
              ) : (
                <span className="text-lg">{p.status === "sealed" ? "🤝" : "⏳"}</span>
              )}
            </div>
          );
        })}
        <Btn variant="outline" onClick={() => openSheet({ kind: "pact", eventId: event.id })}>
          <Handshake size={15} /> {t("makePact", lang)}
        </Btn>
      </div>
    </Section>
  );
}

/* ── Time capsule predictions (before the event) ── */
function PredictionModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const sealPrediction = useApp((s) => s.sealPrediction);
  const toast = useNav((s) => s.toast);
  const [text, setText] = React.useState("");
  const mineSealed = event.predictions.some((p) => p.by === ME);

  return (
    <Section
      icon={<Lock size={16} className="text-gold" />}
      title={t("sealedNote", lang)}
      aside={
        event.predictions.length > 0 && (
          <span className="text-[12px] text-faint">
            {event.predictions.length} {t("sealed", lang)} 🔮
          </span>
        )
      }
    >
      <p className="text-[13px] text-dim mb-3">{t("sealedDesc", lang)}</p>
      {mineSealed ? (
        <div className="rounded-2xl bg-card hairline px-4 py-3 text-[13.5px] text-faint flex items-center gap-2">
          <Lock size={14} className="text-gold" /> Yours is sealed. Revealed after the night.
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            placeholder="Bet we end up way closer to the stage than planned…"
            rows={2}
            className="w-full rounded-2xl bg-card hairline px-4 py-3 text-[14px] resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11.5px] text-faint">{text.length} / 200</span>
            <Btn
              size="sm"
              disabled={!text.trim()}
              onClick={() => {
                sealPrediction(event.id, text.trim());
                setText("");
                toast("🔮", "Sealed into the capsule", "Opens after the event ends");
              }}
            >
              <Lock size={13} /> {t("sealIt", lang)}
            </Btn>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ── Radar (live) ── */
function RadarModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const openSheet = useNav((s) => s.openSheet);
  const entries = Object.entries(event.radar);
  const ringFor = { there: 34, otw: 62, home: 90 } as const;
  const labels = { there: "There", otw: "On the way", home: "Still home" } as const;
  const myStatus = event.radar[ME];

  return (
    <Section
      icon={<RadarIcon size={16} className="text-mint" />}
      title={t("radar", lang)}
      aside={
        <span className="text-[12px] text-faint">
          {entries.filter(([, s]) => s === "there").length} there ·{" "}
          {entries.filter(([, s]) => s === "otw").length} otw
        </span>
      }
    >
      <div className="relative mx-auto" style={{ width: 220, height: 220 }}>
        {/* rings */}
        {[34, 62, 90].map((r) => (
          <div
            key={r}
            className="absolute rounded-full border border-line/10"
            style={{ inset: 110 - r }}
          />
        ))}
        {/* sweep */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(62,230,160,0.25), transparent 70deg, transparent 360deg)",
            maskImage: "radial-gradient(circle, black 0%, black 92%, transparent 92%)",
            WebkitMaskImage: "radial-gradient(circle, black 0%, black 92%, transparent 92%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
        />
        {/* centre = venue */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-mint/15 hairline flex items-center justify-center text-lg">
          📍
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-mint/30 pulse-ring" />
        {/* people */}
        {entries.map(([uid, status], i) => {
          const u = userById(uid);
          if (!u) return null;
          const r = ringFor[status];
          const angle = (i / Math.max(entries.length, 1)) * Math.PI * 2 - Math.PI / 2 + 0.4;
          return (
            <motion.div
              key={uid}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 24, delay: i * 0.06 }}
              className="absolute"
              style={{
                left: 110 + Math.cos(angle) * r - 14,
                top: 110 + Math.sin(angle) * r - 14,
              }}
            >
              <Avatar user={u} size={28} className={status === "there" ? "" : "opacity-80"} />
              {status === "otw" && (
                <span className="absolute -bottom-1 -right-1 text-[10px]">🛵</span>
              )}
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={() => openSheet({ kind: "radarStatus", eventId: event.id })}
        className="press w-full mt-2 h-11 rounded-2xl bg-card hairline text-[13.5px] font-semibold flex items-center justify-center gap-2"
      >
        {myStatus ? (
          <>
            You: {labels[myStatus]} {myStatus === "there" ? "🎉" : myStatus === "otw" ? "🛵" : "🛋️"} · change
          </>
        ) : (
          <>Drop your pin — where are you?</>
        )}
      </button>
    </Section>
  );
}

/* ── Line mode ── */
const LINE_LEVELS: Array<{ label: string; color: string; emoji: string }> = [
  { label: "No line", color: "#3EE6A0", emoji: "🟢" },
  { label: "Short", color: "#FFC65C", emoji: "🟡" },
  { label: "Long", color: "#FF6A5C", emoji: "🔴" },
  { label: "Insane", color: "#B16CFF", emoji: "🟣" },
];

function LineModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const reportLine = useApp((s) => s.reportLine);
  const addNotif = useApp((s) => s.addNotif);
  const toast = useNav((s) => s.toast);
  const [armed, setArmed] = React.useState(false);
  const level = event.lineLevel ?? 0;

  return (
    <Section
      icon={<Users size={16} className="text-coral" />}
      title={`${t("lineMode", lang)} @ door`}
      aside={<span className="text-[12px] text-faint">{event.lineReports ?? 0} reports</span>}
    >
      <div className="flex gap-1.5 mb-2">
        {LINE_LEVELS.map((l, i) => (
          <div
            key={i}
            className="flex-1 h-2.5 rounded-full transition-all duration-300"
            style={{
              background: i <= level ? l.color : "rgb(var(--c-card))",
              boxShadow: i === level ? `0 0 14px ${l.color}88` : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-bold" style={{ color: LINE_LEVELS[level].color }}>
          {LINE_LEVELS[level].emoji} {LINE_LEVELS[level].label} right now
        </span>
        <span className="text-[11.5px] text-faint">live · crowd-sourced</span>
      </div>

      <div className="flex gap-2">
        {LINE_LEVELS.map((l, i) => (
          <button
            key={i}
            onClick={() => {
              reportLine(event.id, i as LineLevel);
              toast("🙏", "Thanks — line updated for everyone");
            }}
            className={cx(
              "press flex-1 h-9 rounded-xl text-[11.5px] font-semibold hairline",
              i === level ? "bg-ink text-bg" : "bg-card text-dim"
            )}
          >
            {l.emoji}
          </button>
        ))}
      </div>

      <Btn
        variant={armed ? "soft" : "outline"}
        className="w-full mt-2.5"
        disabled={armed}
        onClick={() => {
          setArmed(true);
          toast("🔔", "We'll ping you when the door clears");
          setTimeout(() => {
            useApp.getState().reportLine(event.id, 0);
            toast("🚪", "Door's clear — go go go!", event.title);
            addNotif({ kind: "line", text: `Door cleared at ${event.title} — move!`, eventId: event.id });
          }, 9000);
        }}
      >
        <BellRing size={15} /> {armed ? "Watching the door…" : "Ping me when it clears"}
      </Btn>
    </Section>
  );
}

/* ── Exit poll (past) ── */
function ExitPollModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const votePoll = useApp((s) => s.votePoll);
  const toast = useNav((s) => s.toast);
  const myVote = event.exitPoll[ME];
  const votes = Object.values(event.exitPoll);
  const counts: Record<PollVote, number> = {
    fire: votes.filter((v) => v === "fire").length,
    mid: votes.filter((v) => v === "mid").length,
    dead: votes.filter((v) => v === "dead").length,
  };
  const max = Math.max(1, ...Object.values(counts));
  const options: Array<[PollVote, string]> = [
    ["fire", "🔥"],
    ["mid", "😐"],
    ["dead", "💀"],
  ];

  return (
    <Section
      icon={<HandHeart size={16} className="text-coral" />}
      title={t("exitPoll", lang)}
      aside={<span className="text-[12px] text-faint">{votes.length} votes · anonymous</span>}
    >
      {!myVote ? (
        <>
          <p className="text-[13px] text-dim mb-3">{t("exitPollDesc", lang)}</p>
          <div className="flex gap-2.5">
            {options.map(([v, e]) => (
              <motion.button
                key={v}
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  votePoll(event.id, v);
                  toast("🗳️", "Vote counted", "Anonymous, always");
                }}
                className="flex-1 h-14 rounded-2xl bg-card hairline text-2xl press"
              >
                {e}
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {options.map(([v, e]) => (
            <div key={v} className="flex items-center gap-3">
              <span className="text-lg w-7">{e}</span>
              <div className="flex-1 h-7 rounded-lg bg-card overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts[v] / max) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 24 }}
                  className={cx(
                    "h-full rounded-lg",
                    v === "fire" ? "bg-coral/70" : v === "mid" ? "bg-gold/60" : "bg-faint/40"
                  )}
                />
              </div>
              <span className="text-[13px] font-bold w-5 text-right">{counts[v]}</span>
            </div>
          ))}
          {myVote && (
            <div className="text-[11.5px] text-faint pt-1">You voted {options.find(([v]) => v === myVote)?.[1]}</div>
          )}
        </div>
      )}
    </Section>
  );
}

/* ── capsule link (past events) ── */
function CapsuleLinkCard({ event }: { event: EventT }) {
  const push = useNav((s) => s.push);
  return (
    <button
      onClick={() => push({ kind: "capsule", id: event.id })}
      className="press w-full rounded-3xl p-4 hairline flex items-center gap-3 text-left"
      style={{
        background:
          "linear-gradient(120deg, rgba(255,198,92,0.14), rgba(138,108,255,0.12)), rgb(var(--c-raise))",
      }}
    >
      <div className="w-11 h-11 rounded-2xl bg-gold/15 flex items-center justify-center text-xl">🎞️</div>
      <div className="flex-1">
        <div className="font-display font-semibold text-[15px]">This one's a memory now</div>
        <div className="text-[12.5px] text-dim">
          {event.photos.length} photos · {event.predictions.length} predictions revealed
        </div>
      </div>
      <span className="text-accent text-xl">→</span>
    </button>
  );
}

/* ── organizer analytics ── */
function OrganizerModule({ event }: { event: EventT }) {
  const { toast, openSheet } = useNav();
  const duplicateEvent = useApp((s) => s.duplicateEvent);
  const past = Date.now() > event.end;

  const conversion = event.views ? Math.round(((event.going.length + event.maybe.length) / event.views) * 100) : 0;

  // ── Projected Fill: confirmed + conditional pacts + maybes, with a band ──
  const { confirmed, maybe: mb, pact: pactPending, projected, low, high, conf } = forecast(event);
  const denom = Math.max(confirmed + pactPending + mb, 1); // bar = composition of the pool

  return (
    <Section icon={<Eye size={16} className="text-accent" />} title="Organizer tools">
      {!past && (
        <div className="rounded-2xl bg-card hairline p-3.5 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint mb-2">
            <TrendingUp size={13} className="text-mint" /> Projected fill
          </div>
          <div className="flex items-end gap-2">
            <span className="font-display font-bold text-[34px] leading-none tracking-tight">~{projected}</span>
            <span className="text-[12.5px] text-faint mb-1">
              expected · {low}–{high} range · {conf}% confidence
            </span>
          </div>

          {/* stacked forecast bar */}
          <div className="mt-3 h-3 rounded-full bg-bg/60 overflow-hidden flex">
            <div className="h-full bg-mint" style={{ width: `${(confirmed / denom) * 100}%` }} />
            <div className="h-full bg-accent" style={{ width: `${(pactPending / denom) * 100}%` }} />
            <div className="h-full bg-gold/60" style={{ width: `${(mb / denom) * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-faint">
            <Legend color="bg-mint" label={`${confirmed} confirmed`} />
            <Legend color="bg-accent" label={`${pactPending} pact-pending`} />
            <Legend color="bg-gold/60" label={`${mb} maybe`} />
          </div>

          {pactPending > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/12 p-2.5 text-[12.5px] text-dim">
              <Link2 size={15} className="text-accent shrink-0 mt-0.5" />
              <span>
                <b className="text-ink">{pactPending} {pactPending === 1 ? "person is" : "people are"} one friend away</b> — they've pacted "I'll go if you go." Nudge the pair and they both lock in.
              </span>
            </div>
          )}

          {mb > 0 && (
            <Btn variant="soft" className="w-full mt-3" onClick={() => openSheet({ kind: "convertMaybes", eventId: event.id })}>
              <Zap size={15} className="text-gold" /> Convert the {mb} {mb === 1 ? "maybe" : "maybes"}
            </Btn>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          [event.views ?? 0, "views"],
          [event.going.length + event.maybe.length, "RSVPs"],
          [`${conversion}%`, "convert"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-card hairline p-3 text-center">
            <div className="font-display font-bold text-[18px]">{v}</div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-faint mt-0.5">{l}</div>
          </div>
        ))}
      </div>
      <Btn
        variant="soft"
        onClick={() => {
          duplicateEvent(event.id);
          toast("🔄", "Event duplicated", "Scheduled one week later — edit away");
        }}
      >
        <Copy size={15} /> Duplicate this event
      </Btn>
    </Section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cx("w-2 h-2 rounded-full", color)} /> {label}
    </span>
  );
}

/* ── comments ── */
function CommentsModule({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const addComment = useApp((s) => s.addComment);
  const [text, setText] = React.useState("");
  const showMentions = text.endsWith("@");
  const candidates = [...new Set([...event.going, ...event.maybe, ...event.invited])]
    .filter((u) => u !== ME)
    .slice(0, 6);

  return (
    <Section
      icon={<MessageCircle size={16} className="text-dim" />}
      title={`${t("comments", lang)} (${event.comments.length})`}
    >
      <div className="space-y-3 mb-3">
        {event.comments.map((c) => {
          const u = userById(c.by);
          return (
            <div key={c.id} className="flex gap-2.5">
              <Avatar user={u} size={30} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-faint">
                  <b className="text-dim">{u?.id === ME ? "you" : u?.name}</b> ·{" "}
                  {new Date(c.ts).toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-[14px] leading-snug mt-0.5">
                  {c.text.split(/(\s+)/).map((w, i) =>
                    w.startsWith("@") ? (
                      <span key={i} className="text-accent font-semibold">
                        {w}
                      </span>
                    ) : (
                      w
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showMentions && (
        <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
          {candidates.map((uid) => {
            const u = userById(uid);
            return (
              <button
                key={uid}
                onClick={() => setText(text + (u?.handle ?? "") + " ")}
                className="press shrink-0 flex items-center gap-1.5 bg-card hairline rounded-full pl-1 pr-2.5 h-7 text-[12px] font-medium"
              >
                <Avatar user={u} size={20} /> {u?.name}
              </button>
            );
          })}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addComment(event.id, text.trim());
          setText("");
          haptic(10);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("writeComment", lang)}
          className="flex-1 h-11 rounded-2xl bg-card hairline px-4 text-[14px]"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="press w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-[#6E4DFF] text-white flex items-center justify-center disabled:opacity-40 shrink-0"
        >
          <Send size={17} />
        </button>
      </form>
    </Section>
  );
}
