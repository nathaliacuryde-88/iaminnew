import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Search, UserRoundPlus } from "lucide-react";
import { useApp } from "../store";
import { useNav, openEvent, openPerson } from "../nav";
import { ME, USERS } from "../data";
import { t } from "../i18n";
import { cx, DAY, haptic, startOfDay, VIBES } from "../util";
import type { EventT, User, Vibe } from "../types";
import { EventCard } from "../components/EventCard";
import { Avatar } from "../components/Avatar";
import { Chip, Btn } from "../components/Primitives";
import { IconBtn } from "../components/StackScreen";

type Filter = "all" | "tonight" | "week" | Vibe;

export function FeedScreen() {
  const lang = useApp((s) => s.lang);
  const me = useApp((s) => s.me);
  const events = useApp((s) => s.events);
  const following = useApp((s) => s.following);
  const notifs = useApp((s) => s.notifs);
  const push = useNav((s) => s.push);
  const [page, setPage] = React.useState<0 | 1>(0);
  const [filter, setFilter] = React.useState<Filter>("all");
  const unread = notifs.filter((n) => !n.read).length;

  const upcoming = events
    .filter((e) => e.end >= Date.now())
    .sort((a, b) => a.start - b.start);

  const applyFilter = (list: EventT[]) => {
    if (filter === "all") return list;
    if (filter === "tonight")
      return list.filter((e) => startOfDay(e.start) <= startOfDay(Date.now()) && e.end >= Date.now());
    if (filter === "week")
      return list.filter((e) => e.start < startOfDay(Date.now()) + 7 * DAY);
    return list.filter((e) => e.vibe === filter);
  };

  const circle = applyFilter(
    upcoming.filter((e) => e.privacy !== "public")
  );
  const pulse = applyFilter(upcoming.filter((e) => e.privacy === "public"));

  // yesterday's event still waiting for my exit poll
  const ratePrompt = events.find(
    (e) =>
      e.end < Date.now() &&
      Date.now() - e.end < 2 * DAY &&
      e.going.includes(ME) &&
      !e.exitPoll[ME]
  );

  const suggestions = USERS.filter((u) => u.id !== ME && !following.includes(u.id)).sort(
    (a, b) => b.mutuals - a.mutuals
  );

  const vibeFilters: Vibe[] = ["party", "concert", "picnic", "brunch", "market", "festival"];

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* ───── header ───── */}
      <div
        className="shrink-0 z-20 px-5 pb-3"
        style={{ paddingTop: "max(18px, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-[24px] tracking-tight select-none">
            I am{" "}
            <span className="text-accent">
              (IN<span className="text-accent2">)</span>
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <IconBtn onClick={() => push({ kind: "search" })}>
              <Search size={18} strokeWidth={2.2} />
            </IconBtn>
            <IconBtn onClick={() => push({ kind: "notifications" })} badge={unread}>
              <Bell size={18} strokeWidth={2.2} />
            </IconBtn>
          </div>
        </div>
        <p className="text-[13px] text-faint mt-0.5">
          {lang === "de" ? `Sieht gut aus heute, ${me.name}.` : `Tonight's looking good, ${me.name}.`}
        </p>

        {/* page tabs */}
        <div className="flex items-center gap-5 mt-4">
          {([t("innerCircle", lang), t("cityPulse", lang)] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => {
                haptic(6);
                setPage(i as 0 | 1);
              }}
              className="relative pb-2"
            >
              <span
                className={cx(
                  "font-display font-semibold text-[16px] tracking-tight transition-colors",
                  page === i ? "text-ink" : "text-faint"
                )}
              >
                {label}
              </span>
              {i === 1 && pulse.some((e) => Date.now() >= e.start && Date.now() <= e.end) && (
                <span className="absolute -right-2.5 top-0 w-1.5 h-1.5 rounded-full bg-coral" />
              )}
              {page === i && (
                <motion.div
                  layoutId="feed-tab"
                  transition={{ type: "spring", stiffness: 520, damping: 40 }}
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-accent"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ───── filters ───── */}
      <div className="shrink-0 flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          {t("all", lang)}
        </Chip>
        <Chip active={filter === "tonight"} onClick={() => setFilter("tonight")}>
          🌙 {t("tonight", lang)}
        </Chip>
        <Chip active={filter === "week"} onClick={() => setFilter("week")}>
          {t("thisWeek", lang)}
        </Chip>
        {vibeFilters.map((v) => (
          <Chip key={v} active={filter === v} onClick={() => setFilter(filter === v ? "all" : v)}>
            {VIBES[v].emoji} {VIBES[v].label}
          </Chip>
        ))}
      </div>

      {/* ───── swipeable pager ───── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 flex"
          style={{ width: "200%" }}
          animate={{ x: page === 0 ? "0%" : "-50%" }}
          transition={{ type: "spring", stiffness: 360, damping: 38 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          dragDirectionLock
          onDragEnd={(_, info) => {
            if (info.offset.x < -60 || info.velocity.x < -400) setPage(1);
            else if (info.offset.x > 60 || info.velocity.x > 400) setPage(0);
          }}
        >
          <FeedColumn>
            {ratePrompt && <RateLastNight event={ratePrompt} />}
            {circle.length === 0 && <EmptyFeed label="Nothing here yet — create something." />}
            {circle.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
            <PeopleRail suggestions={suggestions.slice(0, 6)} />
          </FeedColumn>
          <FeedColumn>
            {pulse.length === 0 && <EmptyFeed label="The city is quiet. Suspicious." />}
            {pulse.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </FeedColumn>
        </motion.div>
      </div>
    </div>
  );
}

function FeedColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-1/2 h-full scroll-y no-scrollbar px-4 pb-32 space-y-3.5">{children}</div>
  );
}

function EmptyFeed({ label }: { label: string }) {
  return (
    <div className="rounded-3xl bg-raise hairline p-8 text-center text-faint text-sm">{label}</div>
  );
}

/* ── exit poll prompt for last night ── */
function RateLastNight({ event }: { event: EventT }) {
  const votePoll = useApp((s) => s.votePoll);
  const toast = useNav((s) => s.toast);
  const [voted, setVoted] = React.useState(false);
  return (
    <AnimatePresence>
      {!voted && (
        <motion.div
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="rounded-3xl p-4 hairline relative overflow-hidden"
          style={{
            background:
              "linear-gradient(120deg, rgba(138,108,255,0.16), rgba(255,106,140,0.10)), rgb(var(--c-raise))",
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent mb-1">
            Exit poll · anonymous
          </div>
          <div className="font-display font-semibold text-[16px] leading-tight">
            How was {event.title}?
          </div>
          <div className="flex gap-2.5 mt-3">
            {([
              ["fire", "🔥"],
              ["mid", "😐"],
              ["dead", "💀"],
            ] as const).map(([v, e]) => (
              <motion.button
                key={v}
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  votePoll(event.id, v);
                  setVoted(true);
                  toast("🗳️", "Vote sealed in", "Anonymous, always.");
                }}
                className="flex-1 h-12 rounded-2xl bg-card hairline text-2xl press"
              >
                {e}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── people you may know rail ── */
export function PeopleRail({ suggestions }: { suggestions: User[] }) {
  const lang = useApp((s) => s.lang);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const following = useApp((s) => s.following);
  const push = useNav((s) => s.push);
  if (suggestions.length === 0) return null;
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
          <UserRoundPlus size={13} /> {t("peopleYouMayKnow", lang)}
        </div>
        <button
          onClick={() => push({ kind: "people" })}
          className="text-[12.5px] font-semibold text-accent press"
        >
          {t("seeAll", lang)}
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
        {suggestions.map((u) => {
          const isF = following.includes(u.id);
          return (
            <div
              key={u.id}
              onClick={() => openPerson(u.id)}
              className="w-[124px] shrink-0 rounded-3xl bg-raise hairline p-3.5 flex flex-col items-center text-center press cursor-pointer"
            >
              <Avatar user={u} size={52} mood />
              <div className="text-[13.5px] font-semibold mt-2 truncate w-full">{u.name}</div>
              <div className="text-[11px] text-faint">
                {u.mutuals} {u.mutuals === 1 ? t("mutual", lang) : t("mutuals", lang)}
              </div>
              <Btn
                size="sm"
                variant={isF ? "soft" : "primary"}
                className="mt-2.5 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(u.id);
                }}
              >
                {isF ? t("following", lang) : t("follow", lang)}
              </Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
}
