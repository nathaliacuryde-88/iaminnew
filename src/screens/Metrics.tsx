import React from "react";
import { Crown, Link2, MapPin, RefreshCcw, Sparkles, UserMinus } from "lucide-react";
import { useApp, userById } from "../store";
import { useNav, openEvent, openPerson } from "../nav";
import { ME } from "../data";
import { cx, DAY, fmtDay, rng, VIBES } from "../util";
import type { EventT, PollVote } from "../types";
import { Avatar } from "../components/Avatar";
import { Btn } from "../components/Primitives";
import { OrgTopBar } from "../components/OrgHeader";

const DISTRICTS = ["West", "Nord", "Süd", "Ost", "Mitte", "Bad Cannstatt", "Vaihingen", "Heslach"];
const hoodOf = (id: string) => DISTRICTS[Math.floor(rng("hood:" + id)() * DISTRICTS.length)];
const ratingVal = (v: PollVote) => (v === "fire" ? 5 : v === "mid" ? 3 : 1);

export function MetricsScreen() {
  const lang = useApp((s) => s.lang);
  const events = useApp((s) => s.events);
  const { toast } = useNav();
  const now = Date.now();

  const mine = events.filter((e) => e.createdBy === ME);
  const past = mine.filter((e) => e.end < now).sort((a, b) => b.start - a.start);
  const upcoming = mine.filter((e) => e.end >= now);

  // ── overall rating ──
  const allVotes = mine.flatMap((e) => Object.values(e.exitPoll));
  const avg = allVotes.length ? (allVotes.reduce((a, v) => a + ratingVal(v), 0) / allVotes.length).toFixed(1) : "—";
  const pollCount = mine.filter((e) => Object.keys(e.exitPoll).length > 0).length;

  // ── crowd ──
  const crowdIds = React.useMemo(() => {
    const set = new Set<string>();
    mine.forEach((e) => e.going.forEach((u) => u !== ME && set.add(u)));
    return [...set];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);
  const nightsOf = (id: string) => mine.filter((e) => e.going.includes(id)).length;

  const connectors = crowdIds
    .map((id) => {
      const u = userById(id)!;
      return { u, nights: nightsOf(id), brings: Math.round((u?.mutuals ?? 0) * 0.6 + nightsOf(id) * 2) };
    })
    .filter((c) => c.u)
    .sort((a, b) => b.brings - a.brings);

  const upcomingIds = new Set(upcoming.flatMap((e) => [...e.going, ...e.maybe]));
  const lastSeen = (id: string) => Math.max(0, ...past.filter((e) => e.going.includes(id)).map((e) => e.start));
  const lapsing = connectors
    .filter((c) => !upcomingIds.has(c.u.id) && lastSeen(c.u.id) > 0)
    .map((c) => ({
      ...c,
      weeks: Math.max(1, Math.round((now - lastSeen(c.u.id)) / (7 * DAY))),
      free: c.u.mood === "open" || !c.u.mood,
    }))
    .sort((a, b) => b.brings - a.brings)
    .slice(0, 4);

  const vibeCount: Record<string, number> = {};
  mine.forEach((e) => e.going.forEach((u) => u !== ME && (vibeCount[e.vibe] = (vibeCount[e.vibe] ?? 0) + 1)));
  const vibes = Object.entries(vibeCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const vibeMax = Math.max(1, ...vibes.map(([, n]) => n));

  const hoodCount: Record<string, number> = {};
  crowdIds.forEach((id) => (hoodCount[hoodOf(id)] = (hoodCount[hoodOf(id)] ?? 0) + 1));
  const hoods = Object.entries(hoodCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const hoodMax = Math.max(1, ...hoods.map(([, n]) => n));

  const crowdSet = new Set(crowdIds);
  const byHost = new Map<string, Set<string>>();
  events.forEach((e) => {
    if (e.createdBy === ME) return;
    e.going.forEach((id) => {
      if (!crowdSet.has(id)) return;
      if (!byHost.has(e.createdBy)) byHost.set(e.createdBy, new Set());
      byHost.get(e.createdBy)!.add(id);
    });
  });
  const covis = [...byHost.entries()]
    .map(([cid, set]) => ({ u: userById(cid), n: set.size, pct: Math.round((set.size / Math.max(1, crowdIds.length)) * 100) }))
    .filter((c) => c.u)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  // ── rotating insight ──
  const topVibe = vibes[0]?.[0];
  const insights = [
    topVibe && `Your top-rated vibe is ${VIBES[topVibe as keyof typeof VIBES]?.label ?? topVibe} at ${avg}/5.`,
    connectors[0] && `${connectors[0].u.name} brings the most people — comp them first.`,
    covis[0] && `Your crowd overlaps most with ${covis[0].u!.name} (${covis[0].pct}%).`,
    lapsing[0] && `${lapsing[0].u.name} hasn't been in ${lapsing[0].weeks}w — win them back.`,
  ].filter(Boolean) as string[];
  const [ins, setIns] = React.useState(0);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 px-5 pb-3" style={{ paddingTop: "max(18px, env(safe-area-inset-top))" }}>
        <OrgTopBar />
        <h2 className="font-display font-bold text-[24px] tracking-tight mt-3">Your track record</h2>
      </div>

      <div className="flex-1 min-h-0 scroll-y no-scrollbar px-4 pb-32 space-y-3.5">
        {/* rating hero */}
        <div
          className="rounded-3xl hairline p-6 text-center"
          style={{ background: "linear-gradient(160deg, rgba(138,108,255,0.14), rgba(255,198,92,0.06)), rgb(var(--c-raise))" }}
        >
          <div className="text-3xl">🏅</div>
          <div className="font-display font-bold text-[56px] leading-none tracking-tight mt-1">{avg}</div>
          <div className="text-[12.5px] text-faint mt-2">
            based on {mine.length} {mine.length === 1 ? "event" : "events"} · {pollCount} exit {pollCount === 1 ? "poll" : "polls"}
          </div>
        </div>

        {/* rotating insight */}
        {insights.length > 0 && (
          <div
            className="rounded-3xl hairline p-4 flex items-center gap-3"
            style={{ background: "linear-gradient(120deg, rgba(138,108,255,0.16), rgba(62,230,160,0.06)), rgb(var(--c-raise))" }}
          >
            <Sparkles size={18} className="text-accent shrink-0" />
            <p className="flex-1 text-[14px] font-medium leading-snug">{insights[ins % insights.length]}</p>
            <button
              onClick={() => setIns((i) => i + 1)}
              className="press w-9 h-9 rounded-full bg-card hairline flex items-center justify-center text-dim shrink-0"
            >
              <RefreshCcw size={15} />
            </button>
          </div>
        )}

        {/* Super-hosts */}
        {connectors.length > 0 && (
          <Card icon={<Crown size={15} className="text-gold" />} title="Your super-hosts" sub="The few who bring the many — comp these first.">
            <div className="space-y-2.5">
              {connectors.slice(0, 5).map((c, i) => (
                <div key={c.u.id} className="flex items-center gap-3">
                  <span className="w-4 text-center font-display font-bold text-[13px] text-faint">{i + 1}</span>
                  <button onClick={() => openPerson(c.u.id)} className="press">
                    <Avatar user={c.u} size={36} mood />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{c.u.name}</div>
                    <div className="text-[11.5px] text-faint">brings ~{c.brings} people · {c.nights} {c.nights === 1 ? "night" : "nights"} with you</div>
                  </div>
                  <Btn size="sm" variant="soft" onClick={() => toast("👑", `Comped ${c.u.name}`, "Your cheapest marketing just got a free one")}>
                    Comp
                  </Btn>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Lapsing */}
        {lapsing.length > 0 && (
          <Card icon={<UserMinus size={15} className="text-coral" />} title="Slipping away" sub="Regulars you haven't seen in a while — win them back.">
            <div className="space-y-2.5">
              {lapsing.map((c) => (
                <div key={c.u.id} className="flex items-center gap-3">
                  <button onClick={() => openPerson(c.u.id)} className="press">
                    <Avatar user={c.u} size={34} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{c.u.name}</div>
                    <div className="text-[11.5px] text-faint">{c.weeks}w since last visit · {c.free ? "🟢 likely free" : "🌙 quiet lately"}</div>
                  </div>
                  <Btn size="sm" variant={c.free ? "primary" : "soft"} onClick={() => toast("💌", `Win-back invite sent to ${c.u.name}`, "Personal, not a blast")}>
                    Win back
                  </Btn>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Crowd DNA */}
        {vibes.length > 0 && (
          <Card icon={<Sparkles size={15} className="text-accent" />} title="Crowd DNA" sub="What your people show up for.">
            <div className="space-y-2">
              {vibes.map(([v, n]) => (
                <BarRow
                  key={v}
                  label={`${VIBES[v as keyof typeof VIBES]?.emoji ?? "•"} ${VIBES[v as keyof typeof VIBES]?.label ?? v}`}
                  value={n}
                  pct={(n / vibeMax) * 100}
                  color="bg-accent/70"
                />
              ))}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.13em] text-faint mt-4 mb-2 flex items-center gap-1.5">
              <MapPin size={12} /> Where they travel from
            </div>
            <div className="space-y-2">
              {hoods.map(([h, n]) => (
                <BarRow key={h} label={h} value={n} pct={(n / hoodMax) * 100} color="bg-mint/70" />
              ))}
            </div>
          </Card>
        )}

        {/* Co-visitation */}
        {covis.length > 0 && (
          <Card icon={<Link2 size={15} className="text-accent2" />} title="Your crowd also goes to" sub="Shared audience — co-promote or watch the competition.">
            <div className="space-y-2.5">
              {covis.map((c) => (
                <div key={c.u!.id} className="flex items-center gap-3">
                  <button onClick={() => openPerson(c.u!.id)} className="press">
                    <Avatar user={c.u} size={34} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">
                      {c.u!.name}
                      {c.u!.verified && <span className="text-accent"> ✓</span>}
                    </div>
                    <div className="text-[11.5px] text-faint">{c.n} of your crowd · {c.pct}% overlap</div>
                  </div>
                  <div className="w-16 h-1.5 rounded-full bg-card overflow-hidden">
                    <div className="h-full rounded-full bg-accent2/70" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-1 pt-1">Past events</div>
            {past.map((e) => (
              <PastRow key={e.id} event={e} lang={lang} />
            ))}
          </>
        )}

        <div className="text-[11px] text-faint text-center px-6 pt-1">
          Aggregated & anonymized from RSVPs, pacts, the follow graph & exit polls.
        </div>
      </div>
    </div>
  );
}

function PastRow({ event, lang }: { event: EventT; lang: "en" | "de" }) {
  const votes = Object.values(event.exitPoll);
  const rating = votes.length ? (votes.reduce((a, v) => a + ratingVal(v), 0) / votes.length).toFixed(0) : null;
  const pct = (v: PollVote) => (votes.length ? Math.round((votes.filter((x) => x === v).length / votes.length) * 100) : 0);
  return (
    <button onClick={() => openEvent(event.id)} className="press w-full rounded-[22px] bg-raise hairline p-3.5 text-left">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[15.5px] truncate">{event.title}</div>
          <div className="text-[12px] text-faint mt-0.5">{fmtDay(event.start, lang)} · {event.going.length} attended</div>
        </div>
        <span className="font-display font-bold text-[18px] text-dim shrink-0">{rating ?? "—"}</span>
      </div>
      {votes.length > 0 && (
        <div className="flex items-center gap-4 mt-2.5 text-[12px] text-faint">
          <span>🔥 {pct("fire")}%</span>
          <span>😐 {pct("mid")}%</span>
          <span>💀 {pct("dead")}%</span>
        </div>
      )}
    </button>
  );
}

function Card({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-raise hairline p-4">
      <div className="flex items-center gap-2 mb-0.5">
        {icon}
        <h3 className="font-display font-semibold text-[15px] tracking-tight">{title}</h3>
      </div>
      {sub && <p className="text-[12px] text-faint mb-3">{sub}</p>}
      {children}
    </div>
  );
}

function BarRow({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-[13px] font-medium truncate capitalize">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-card overflow-hidden">
        <div className={cx("h-full rounded-full", color)} style={{ width: `${Math.max(6, pct)}%` }} />
      </div>
      <span className="w-5 text-right text-[12px] text-faint">{value}</span>
    </div>
  );
}
