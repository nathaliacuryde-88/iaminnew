import React from "react";
import { Cake, MapPin, Pencil, Plus, Settings } from "lucide-react";
import { useApp } from "../store";
import { useNav } from "../nav";
import { ME, USERS } from "../data";
import { t } from "../i18n";
import { cx, fmtMonthYear, VIBES, eur } from "../util";
import type { EventT } from "../types";
import { Avatar } from "../components/Avatar";
import { Cover } from "../components/Cover";
import { Seg } from "../components/Primitives";
import { IconBtn } from "../components/StackScreen";
import { AgendaRow } from "./Calendar";

const MOOD_META = {
  open: { emoji: "🟢", label: "Open to plans" },
  "not-today": { emoji: "🌙", label: "Not today" },
  "lazy-week": { emoji: "😴", label: "Lazy week" },
} as const;

export function ProfileScreen() {
  const lang = useApp((s) => s.lang);
  const me = useApp((s) => s.me);
  const mode = useApp((s) => s.mode);
  const mood = useApp((s) => s.mood);
  const events = useApp((s) => s.events);
  const following = useApp((s) => s.following);
  const followers = useApp((s) => s.followers);
  const { push, openSheet } = useNav();
  const [tab, setTab] = React.useState<"events" | "dna">("events");
  const meUser = USERS.find((u) => u.id === ME)!;

  const myEvents = events
    .filter((e) => e.going.includes(ME) || e.createdBy === ME)
    .sort((a, b) => b.start - a.start);
  const pastWithPhotos = myEvents.filter((e) => e.end < Date.now());

  /* group by month */
  const groups = React.useMemo(() => {
    const m = new Map<string, EventT[]>();
    for (const e of myEvents) {
      const k = fmtMonthYear(e.start, lang);
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return [...m.entries()];
  }, [myEvents, lang]);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div
        className="shrink-0 px-5 pb-1 flex items-center justify-between"
        style={{ paddingTop: "max(18px, env(safe-area-inset-top))" }}
      >
        <h1 className="font-display font-bold text-[24px] tracking-tight">{t("profile", lang)}</h1>
        <div className="flex gap-2">
          <IconBtn onClick={() => openSheet({ kind: "editProfile" })}>
            <Pencil size={16} />
          </IconBtn>
          <IconBtn onClick={() => push({ kind: "settings" })}>
            <Settings size={17} />
          </IconBtn>
        </div>
      </div>

      <div className="flex-1 min-h-0 scroll-y no-scrollbar px-4 pb-32">
        {/* identity */}
        <div className="flex items-center gap-4 mt-3 px-1">
          <Avatar user={{ ...meUser, mood }} size={76} mood />
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[21px] tracking-tight truncate">
              {mode === "organizer" && me.orgName ? me.orgName : me.name}
              {mode === "organizer" && <span className="text-accent text-[15px]"> ✓</span>}
            </div>
            <div className="text-[13px] text-faint">@{me.handle}</div>
            <div className="flex items-center gap-3 text-[12px] text-faint mt-1">
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} /> Stuttgart
              </span>
              <span className="inline-flex items-center gap-1">
                <Cake size={11} />{" "}
                {new Date(me.birthday + "T12:00").toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
        </div>
        {me.bio && <p className="text-[13.5px] text-dim mt-3 px-1">{me.bio}</p>}

        {/* mood */}
        <button
          onClick={() => openSheet({ kind: "mood" })}
          className="press mt-3 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-card hairline text-[13px] font-semibold"
        >
          {mood ? (
            <>
              {MOOD_META[mood].emoji} {MOOD_META[mood].label}
            </>
          ) : (
            <>✨ {t("setStatus", lang)}</>
          )}
          <span className="text-faint">·</span>
          <span className="text-faint font-medium">{lang === "de" ? "ändern" : "change"}</span>
        </button>

        {/* stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {(
            [
              { v: myEvents.length, l: t("events", lang) },
              { v: followers.length + 19, l: t("followers", lang) },
              { v: following.length, l: t("following", lang), onClick: () => push({ kind: "people" }) },
            ] as Array<{ v: number; l: string; onClick?: () => void }>
          ).map(({ v, l, onClick }) => (
            <button
              key={l}
              onClick={onClick}
              className={cx("rounded-2xl bg-raise hairline py-3 text-center", onClick && "press")}
            >
              <div className="font-display font-bold text-[19px]">{v}</div>
              <div className="text-[10.5px] uppercase tracking-[0.13em] text-faint mt-0.5">{l}</div>
            </button>
          ))}
        </div>

        {/* capsule circles */}
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar mt-5 pb-1 -mx-4 px-5">
          <button
            onClick={() => openSheet({ kind: "create" })}
            className="press shrink-0 flex flex-col items-center gap-1.5"
          >
            <div className="w-[62px] h-[62px] rounded-full border-2 border-dashed border-line/20 flex items-center justify-center text-faint">
              <Plus size={22} />
            </div>
            <span className="text-[10.5px] text-faint font-medium">New</span>
          </button>
          {pastWithPhotos.slice(0, 8).map((e) => (
            <button
              key={e.id}
              onClick={() => push({ kind: "capsule", id: e.id })}
              className="press shrink-0 flex flex-col items-center gap-1.5"
            >
              <div className="rounded-full p-[2.5px] bg-gradient-to-br from-accent to-coral">
                <Cover
                  event={e}
                  rounded="rounded-full"
                  emojiSize={24}
                  className="w-[57px] h-[57px] border-2 border-bg"
                />
              </div>
              <span className="text-[10.5px] text-faint font-medium max-w-[62px] truncate">
                {e.title}
              </span>
            </button>
          ))}
        </div>

        {/* tabs */}
        <Seg<"events" | "dna">
          value={tab}
          onChange={setTab}
          className="mt-4"
          options={[
            { value: "events", label: t("events", lang) },
            { value: "dna", label: `🧬 ${t("dna", lang)}` },
          ]}
        />

        {tab === "events" ? (
          <div className="mt-4 space-y-4">
            {groups.map(([month, list]) => (
              <div key={month}>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-1 mb-2">
                  {month}
                </div>
                <div className="space-y-2">
                  {list.map((e) => (
                    <AgendaRow key={e.id} event={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DnaPanel events={myEvents} organizer={mode === "organizer"} />
        )}
      </div>
    </div>
  );
}

/* ════════ DNA ════════ */
function DnaPanel({ events, organizer }: { events: EventT[]; organizer: boolean }) {
  const lang = useApp((s) => s.lang);
  const setTab = useNav((s) => s.setTab);
  const created = events.filter((e) => e.createdBy === ME);
  const past = events.filter((e) => e.end < Date.now());

  const topVibe = (list: EventT[]) => {
    const c = new Map<string, number>();
    list.forEach((e) => c.set(e.vibe, (c.get(e.vibe) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "party";
  };

  const bestDay = (list: EventT[]) => {
    const c = new Map<string, number>();
    list.forEach((e) =>
      c.set(new Date(e.start).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { weekday: "long" }), (c.get(new Date(e.start).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { weekday: "long" })) ?? 0) + 1)
    );
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Saturday";
  };

  if (organizer) {
    const attendees = created.reduce((a, e) => a + e.going.length, 0);
    const polls = created.filter((e) => Object.keys(e.exitPoll).length > 0);
    const ratings = created.flatMap((e) =>
      Object.values(e.exitPoll).map((v) => (v === "fire" ? 5 : v === "mid" ? 3 : 1))
    );
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
    const tv = topVibe(created);
    return (
      <div className="mt-4 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-faint px-1">
          🔒 Your venue DNA
        </div>
        <StatGrid
          stats={[
            [created.length, "events run"],
            [attendees, "total attendees"],
            [avg, "avg rating"],
            [polls.length, "exit polls"],
          ]}
        />
        <SignatureCard
          rows={[
            ["Top-rated vibe", `${VIBES[tv as keyof typeof VIBES]?.emoji ?? ""} ${tv}`],
            ["Best-performing day", bestDay(created)],
            ["Audience reach", `${created.reduce((a, e) => a + (e.views ?? 0), 0)} views`],
          ]}
        />
        <CompetitorCard />
        <button
          onClick={() => setTab("metrics")}
          className="press w-full rounded-3xl p-4 text-left hairline flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(138,108,255,0.18), rgba(62,230,160,0.08)), rgb(var(--c-raise))",
          }}
        >
          <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-xl shrink-0">📊</div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-[15px]">Open full metrics</div>
            <div className="text-[12.5px] text-dim">Super-hosts, lapsing regulars, crowd DNA & co-visitation</div>
          </div>
          <span className="text-accent text-xl">→</span>
        </button>
      </div>
    );
  }

  // person DNA
  const friendCount = new Map<string, number>();
  past.forEach((e) =>
    e.going.forEach((u) => {
      if (u !== ME) friendCount.set(u, (friendCount.get(u) ?? 0) + 1);
    })
  );
  const ride = [...friendCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const rideUser = ride ? USERS.find((u) => u.id === ride[0]) : undefined;
  const photos = past.reduce((a, e) => a + e.photos.length, 0);
  const tabTotal = events.reduce((a, e) => a + e.expenses.reduce((x, y) => x + y.amount, 0), 0);
  const tv = topVibe(events);

  return (
    <div className="mt-4 space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-faint px-1">
        🧬 Your social season
      </div>
      <StatGrid
        stats={[
          [events.length, "events"],
          [past.length, "nights archived"],
          [photos, "capsule shots"],
          [eur(tabTotal), "split in tabs"],
        ]}
      />
      <SignatureCard
        rows={[
          ["Signature vibe", `${VIBES[tv as keyof typeof VIBES]?.emoji ?? ""} ${tv}`],
          ["Best day", bestDay(events)],
          rideUser ? ["Ride or die", `${rideUser.emoji} ${rideUser.name} · ${ride![1]}× together`] : ["Ride or die", "TBD"],
        ]}
      />
    </div>
  );
}

function StatGrid({ stats }: { stats: Array<[React.ReactNode, string]> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(([v, l]) => (
        <div key={l} className="rounded-3xl bg-raise hairline p-4">
          <div className="font-display font-bold text-[24px] tracking-tight">{v}</div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-faint mt-1">{l}</div>
        </div>
      ))}
    </div>
  );
}

function SignatureCard({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div
      className="rounded-3xl hairline p-4 space-y-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(138,108,255,0.14), rgba(255,106,140,0.07)), rgb(var(--c-raise))",
      }}
    >
      {rows.map(([l, v]) => (
        <div key={l}>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-faint">{l}</div>
          <div className="font-display font-bold text-[18px] mt-0.5">{v}</div>
        </div>
      ))}
    </div>
  );
}

function CompetitorCard() {
  return (
    <div className="rounded-3xl bg-raise hairline p-4">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-faint mb-2">
        🕵️ Same city, same vibe this month
      </div>
      {[
        ["Friday club nights", 4, 62],
        ["Saturday concerts", 3, 78],
        ["Open airs", 2, 41],
      ].map(([label, n, pct]) => (
        <div key={label as string} className="flex items-center gap-3 py-1.5">
          <span className="flex-1 text-[13px] font-medium">{label}</span>
          <div className="w-24 h-1.5 rounded-full bg-card overflow-hidden">
            <div className="h-full bg-accent/70 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[12px] text-faint w-3 text-right">{n}</span>
        </div>
      ))}
      <div className="text-[11px] text-faint mt-2">Avg fill rate vs. your events: you're ahead 📈</div>
    </div>
  );
}
