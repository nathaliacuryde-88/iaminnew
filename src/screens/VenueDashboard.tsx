import React from "react";
import { Crown, Link2, MapPin, Sparkles, UserMinus } from "lucide-react";
import { useApp, userById } from "../store";
import { useNav, openPerson } from "../nav";
import { ME } from "../data";
import { DAY, cx, rng, VIBES } from "../util";
import { StackScreen } from "../components/StackScreen";
import { Avatar } from "../components/Avatar";
import { Btn } from "../components/Primitives";

const DISTRICTS = ["West", "Nord", "Süd", "Ost", "Mitte", "Bad Cannstatt", "Vaihingen", "Heslach"];
const hoodOf = (id: string) => DISTRICTS[Math.floor(rng("hood:" + id)() * DISTRICTS.length)];

export function VenueDashboardScreen() {
  const events = useApp((s) => s.events);
  const { toast } = useNav();
  const now = Date.now();

  const mine = events.filter((e) => e.createdBy === ME);
  const past = mine.filter((e) => e.end < now);
  const upcoming = mine.filter((e) => e.end >= now);

  // distinct people who've shown up to my events (the "crowd")
  const crowdIds = React.useMemo(() => {
    const set = new Set<string>();
    mine.forEach((e) => e.going.forEach((u) => u !== ME && set.add(u)));
    return [...set];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const nightsOf = (id: string) => mine.filter((e) => e.going.includes(id)).length;

  // ── Connectors / super-hosts: network reach × attendance ──
  const connectors = crowdIds
    .map((id) => {
      const u = userById(id)!;
      const nights = nightsOf(id);
      const brings = Math.round((u.mutuals ?? 0) * 0.6 + nights * 2); // network proxy + loyalty
      return { u, nights, brings };
    })
    .filter((c) => c.u)
    .sort((a, b) => b.brings - a.brings);

  // ── Lapsing regulars: were here, not on any upcoming, sorted by value ──
  const upcomingIds = new Set(upcoming.flatMap((e) => [...e.going, ...e.maybe]));
  const lastSeen = (id: string) =>
    Math.max(0, ...past.filter((e) => e.going.includes(id)).map((e) => e.start));
  const lapsing = connectors
    .filter((c) => !upcomingIds.has(c.u.id) && lastSeen(c.u.id) > 0)
    .map((c) => ({
      ...c,
      weeks: Math.max(1, Math.round((now - lastSeen(c.u.id)) / (7 * DAY))),
      free: c.u.mood === "open" || !c.u.mood,
    }))
    .sort((a, b) => b.brings - a.brings)
    .slice(0, 4);

  // ── Crowd taste: which vibes your people show up for ──
  const vibeCount: Record<string, number> = {};
  mine.forEach((e) => e.going.forEach((u) => u !== ME && (vibeCount[e.vibe] = (vibeCount[e.vibe] ?? 0) + 1)));
  const vibes = Object.entries(vibeCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const vibeMax = Math.max(1, ...vibes.map(([, n]) => n));

  // ── Where they come from (seeded districts) ──
  const hoodCount: Record<string, number> = {};
  crowdIds.forEach((id) => (hoodCount[hoodOf(id)] = (hoodCount[hoodOf(id)] ?? 0) + 1));
  const hoods = Object.entries(hoodCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const hoodMax = Math.max(1, ...hoods.map(([, n]) => n));

  // ── Co-visitation: which other hosts your crowd also goes to ──
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

  if (mine.length === 0 || crowdIds.length === 0) {
    return (
      <StackScreen title="Venue dashboard">
        <div className="px-6 pt-20 text-center">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-[15px] text-dim">
            Run an event and your crowd intelligence shows up here — who fills the room, who brings the crowd, and where they come from.
          </div>
        </div>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Venue dashboard">
      <div className="px-4 pt-4 pb-20 space-y-3.5">
        <p className="text-[13px] text-faint px-1 -mt-1">
          What your crowd actually does — the intent no ticketing tool can see.
        </p>

        {/* Connectors */}
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

        {/* Lapsing regulars */}
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
                    <div className="text-[11.5px] text-faint">
                      {c.weeks}w since last visit · {c.free ? "🟢 likely free" : "🌙 quiet lately"}
                    </div>
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

        {/* Co-visitation */}
        {covis.length > 0 && (
          <Card icon={<Link2 size={15} className="text-accent2" />} title="Your crowd also goes to" sub="Shared audience — co-promote or watch the competition.">
            <div className="space-y-2.5">
              {covis.map((c) => (
                <div key={c.u!.id} className="flex items-center gap-3">
                  <button onClick={() => c.u!.id !== ME && openPerson(c.u!.id)} className="press">
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

        <div className="text-[11px] text-faint text-center px-6 pt-1">
          Aggregated & anonymized from RSVPs, pacts, the follow graph & exit polls.
        </div>
      </div>
    </StackScreen>
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
