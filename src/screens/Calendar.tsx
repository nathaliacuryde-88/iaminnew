import React from "react";
import { motion } from "framer-motion";
import { Cake, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../store";
import { useNav, openEvent } from "../nav";
import { ME, USERS } from "../data";
import { t } from "../i18n";
import { cx, DAY, dateKey, fmtMonthYear, fmtTime, haptic, sameDay, startOfDay } from "../util";
import type { EventT, User } from "../types";
import { CoverThumb } from "../components/Cover";
import { Avatar } from "../components/Avatar";
import { Seg, Toggle, Btn } from "../components/Primitives";

type View = "m" | "w" | "d";

export function CalendarScreen() {
  const lang = useApp((s) => s.lang);
  const events = useApp((s) => s.events);
  const blockedDays = useApp((s) => s.blockedDays);
  const toggleBlockedDay = useApp((s) => s.toggleBlockedDay);
  const following = useApp((s) => s.following);
  const openSheet = useNav((s) => s.openSheet);
  const toast = useNav((s) => s.toast);

  const [view, setView] = React.useState<View>("m");
  const [cursor, setCursor] = React.useState(() => startOfDay(Date.now()));
  const [selected, setSelected] = React.useState(() => dateKey(Date.now()));
  const [showMaybes, setShowMaybes] = React.useState(true);

  /* my events: in, maybe (toggle), anything I created */
  const myEvents = events.filter(
    (e) => e.going.includes(ME) || e.createdBy === ME || (showMaybes && e.maybe.includes(ME))
  );

  const byDay = React.useMemo(() => {
    const map = new Map<string, EventT[]>();
    for (const e of myEvents) {
      const k = dateKey(e.start);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [myEvents]);

  /* birthdays of people I follow, projected into the cursor year */
  const birthdays = React.useMemo(() => {
    const map = new Map<string, User[]>();
    const year = new Date(cursor).getFullYear();
    for (const u of USERS) {
      if (u.id === ME || !u.birthday || !following.includes(u.id)) continue;
      for (const y of [year - 1, year, year + 1]) {
        const k = `${y}-${String(u.birthday.month).padStart(2, "0")}-${String(u.birthday.day).padStart(2, "0")}`;
        map.set(k, [...(map.get(k) ?? []), u]);
      }
    }
    return map;
  }, [cursor, following]);

  /* month grid: weeks from Monday */
  const monthDays = React.useMemo(() => {
    const d = new Date(cursor);
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday = 0
    const start = first.getTime() - offset * DAY;
    const cells: number[] = [];
    for (let i = 0; i < 42; i++) cells.push(start + i * DAY);
    // trim trailing full week outside month
    while (cells.length > 7 && new Date(cells[cells.length - 7]).getMonth() !== d.getMonth())
      cells.splice(-7);
    return cells;
  }, [cursor]);

  const weekDays = React.useMemo(() => {
    const sel = new Date(selected + "T12:00");
    const offset = (sel.getDay() + 6) % 7;
    const start = startOfDay(sel.getTime()) - offset * DAY;
    return Array.from({ length: 7 }, (_, i) => start + i * DAY);
  }, [selected]);

  const move = (dir: 1 | -1) => {
    haptic(5);
    const d = new Date(cursor);
    if (view === "m") d.setMonth(d.getMonth() + dir);
    else if (view === "w") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCursor(startOfDay(d.getTime()));
    if (view !== "m") setSelected(dateKey(d.getTime()));
  };

  /* agenda source per view */
  const agendaDays: number[] =
    view === "m"
      ? monthDays.filter((ts) => new Date(ts).getMonth() === new Date(cursor).getMonth())
      : view === "w"
        ? weekDays
        : [startOfDay(new Date(selected + "T12:00").getTime())];

  const agenda = agendaDays
    .map((ts) => ({
      ts,
      key: dateKey(ts),
      events: (byDay.get(dateKey(ts)) ?? []).sort((a, b) => a.start - b.start),
      bdays: birthdays.get(dateKey(ts)) ?? [],
      blocked: blockedDays.includes(dateKey(ts)),
    }))
    .filter((d) => d.events.length > 0 || d.bdays.length > 0 || (d.blocked && view !== "m"));

  /* long-press helpers */
  const pressTimer = React.useRef<number | null>(null);
  const longPressed = React.useRef(false);
  const startPress = (k: string) => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      haptic(24);
      toggleBlockedDay(k);
      toast(blockedDays.includes(k) ? "🔓" : "😴", blockedDays.includes(k) ? "Day unblocked" : "Day blocked", blockedDays.includes(k) ? undefined : "Friends see you're unavailable");
    }, 480);
  };
  const endPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* header */}
      <div className="shrink-0 px-5 pb-3" style={{ paddingTop: "max(18px, env(safe-area-inset-top))" }}>
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-[24px] tracking-tight">{t("calendar", lang)}</h1>
          <Seg<View>
            value={view}
            onChange={setView}
            className="w-[150px]"
            options={[
              { value: "m", label: "M" },
              { value: "w", label: "W" },
              { value: "d", label: "D" },
            ]}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => move(-1)} className="press w-9 h-9 rounded-full bg-card hairline flex items-center justify-center text-dim">
            <ChevronLeft size={18} />
          </button>
          <button
            className="font-display font-semibold text-[15.5px] press"
            onClick={() => {
              setCursor(startOfDay(Date.now()));
              setSelected(dateKey(Date.now()));
            }}
          >
            {view === "d"
              ? new Date(selected + "T12:00").toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { weekday: "long", day: "numeric", month: "long" })
              : fmtMonthYear(cursor, lang)}
          </button>
          <button onClick={() => move(1)} className="press w-9 h-9 rounded-full bg-card hairline flex items-center justify-center text-dim">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 scroll-y no-scrollbar px-4 pb-32 space-y-3">
        {/* grid */}
        {view !== "d" && (
          <div className="rounded-3xl bg-raise hairline p-3.5">
            <div className="grid grid-cols-7 mb-1.5">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                <div key={d} className="text-center text-[9.5px] font-bold tracking-[0.14em] text-faint">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {(view === "m" ? monthDays : weekDays).map((ts) => {
                const k = dateKey(ts);
                const inMonth = view === "w" || new Date(ts).getMonth() === new Date(cursor).getMonth();
                const today = sameDay(ts, Date.now());
                const sel = k === selected;
                const evs = byDay.get(k) ?? [];
                const blocked = blockedDays.includes(k);
                const bday = (birthdays.get(k) ?? []).length > 0;
                return (
                  <button
                    key={ts}
                    onPointerDown={() => startPress(k)}
                    onPointerUp={endPress}
                    onPointerLeave={endPress}
                    onPointerCancel={endPress}
                    onClick={() => {
                      if (longPressed.current) return;
                      haptic(4);
                      setSelected(k);
                      if (view === "m" && evs.length === 0 && !blocked && !bday) return;
                      openSheet({ kind: "dayDetail", dateKey: k });
                    }}
                    className={cx(
                      "relative h-11 rounded-xl flex flex-col items-center justify-center select-none",
                      !inMonth && "opacity-25",
                      sel && !today && "bg-card",
                      today && "bg-accent/15 ring-1 ring-accent/50"
                    )}
                  >
                    {blocked && (
                      <div
                        className="absolute inset-0.5 rounded-[10px] opacity-50"
                        style={{
                          background:
                            "repeating-linear-gradient(135deg, transparent, transparent 4px, rgb(var(--c-faint)/0.35) 4px, rgb(var(--c-faint)/0.35) 6px)",
                        }}
                      />
                    )}
                    <span className={cx("text-[13.5px] font-semibold relative", today && "text-accent")}>
                      {new Date(ts).getDate()}
                    </span>
                    <div className="h-2 flex items-center gap-0.5 relative">
                      {bday && <span className="text-[8px] leading-none">🎂</span>}
                      {evs.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={cx(
                            "w-1 h-1 rounded-full",
                            e.going.includes(ME) || e.createdBy === ME ? "bg-accent" : "bg-faint"
                          )}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-center text-[10.5px] text-faint mt-2.5">
              · {t("blockedHint", lang)} · {lang === "de" ? "Tippe für Details" : "tap a day for details"} ·
            </div>
          </div>
        )}

        {/* maybes toggle */}
        <div className="flex items-center justify-between rounded-2xl bg-raise hairline px-4 py-3">
          <span className="text-[14px] font-semibold">{t("showMaybes", lang)}</span>
          <Toggle on={showMaybes} onChange={setShowMaybes} />
        </div>

        {/* agenda */}
        {agenda.length === 0 && (
          <div className="rounded-3xl bg-raise hairline p-8 text-center text-faint text-sm">
            {lang === "de" ? "Nichts geplant. Verdächtig ruhig." : "Nothing planned. Suspiciously quiet."}
          </div>
        )}
        {agenda.map((day) => (
          <div key={day.key} className="space-y-2">
            {day.bdays.map((u) => (
              <BirthdayRow key={u.id} user={u} ts={day.ts} />
            ))}
            {day.events.map((e) => (
              <AgendaRow key={e.id} event={e} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgendaRow({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const past = event.end < Date.now();
  const live = Date.now() >= event.start && Date.now() <= event.end;
  const isMaybe = event.maybe.includes(ME);
  const d = new Date(event.start);
  return (
    <button
      onClick={() => openEvent(event.id)}
      className={cx(
        "press w-full rounded-[22px] bg-raise hairline p-3 flex items-center gap-3 text-left",
        past && "opacity-55"
      )}
    >
      <div className="w-12 text-center shrink-0">
        <div className={cx("text-[10px] font-bold uppercase tracking-wide", sameDay(event.start, Date.now()) ? "text-accent" : "text-faint")}>
          {sameDay(event.start, Date.now())
            ? t("today", lang)
            : d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { weekday: "short" })}
        </div>
        <div className="font-display font-bold text-[20px] leading-tight">{d.getDate()}</div>
      </div>
      <CoverThumb event={event} size={48} />
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold truncate">{event.title}</div>
        <div className="text-[12px] text-faint mt-0.5 flex items-center gap-1.5">
          {live ? (
            <span className="text-coral font-bold">● LIVE</span>
          ) : (
            <span>🕐 {fmtTime(event.start, lang)}</span>
          )}
          {isMaybe && <span className="text-gold">· maybe</span>}
          {event.privacy === "ghost" && <span>· 👻</span>}
          {event.going.length > 1 && <span>· {event.going.length} {t("going", lang)}</span>}
        </div>
      </div>
      {past ? (
        <span className="w-6 h-6 rounded-full bg-mint/15 text-mint flex items-center justify-center shrink-0">
          <Check size={13} strokeWidth={3} />
        </span>
      ) : (
        <ChevronRight size={16} className="text-faint shrink-0" />
      )}
    </button>
  );
}

export function BirthdayRow({ user, ts }: { user: User; ts: number }) {
  const openSheet = useNav((s) => s.openSheet);
  const cardsSent = useApp((s) => s.cardsSent);
  const lang = useApp((s) => s.lang);
  const sent = cardsSent.includes(user.id);
  const d = new Date(ts);
  return (
    <div className="w-full rounded-[22px] hairline p-3 flex items-center gap-3"
      style={{ background: "linear-gradient(120deg, rgba(255,106,194,0.10), rgba(138,108,255,0.08)), rgb(var(--c-raise))" }}
    >
      <div className="w-12 text-center shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-faint">
          {d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { weekday: "short" })}
        </div>
        <div className="font-display font-bold text-[20px] leading-tight">{d.getDate()}</div>
      </div>
      <Avatar user={user} size={44} />
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold truncate">
          {user.name}'s birthday <Cake size={13} className="inline -mt-0.5 text-coral" />
        </div>
        <div className="text-[12px] text-faint">{lang === "de" ? "Nicht wie letztes Jahr vergessen 🙈" : "Don't find out via Instagram this time 🙈"}</div>
      </div>
      <Btn size="sm" variant={sent ? "soft" : "primary"} disabled={sent} onClick={() => openSheet({ kind: "card", userId: user.id })}>
        {sent ? "Sent ✓" : t("sendCard", lang)}
      </Btn>
    </div>
  );
}
