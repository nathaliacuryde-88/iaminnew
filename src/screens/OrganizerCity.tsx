import React from "react";
import { AlertTriangle, ChevronDown, MapPin, Users } from "lucide-react";
import { useApp } from "../store";
import { openEvent } from "../nav";
import { ME } from "../data";
import { cx, DAY, fmtDay, locale, startOfDay, VIBES } from "../util";
import type { EventT } from "../types";
import { CoverThumb } from "../components/Cover";
import { Chip } from "../components/Primitives";
import { OrgTopBar } from "../components/OrgHeader";

type Range = "week" | "weekend" | "all";

const overlaps = (a: EventT, b: EventT) => a.start < b.end && b.start < a.end;

export function OrganizerCityScreen() {
  const lang = useApp((s) => s.lang);
  const events = useApp((s) => s.events);
  const [range, setRange] = React.useState<Range>("week");
  const now = Date.now();

  const mine = events.filter((e) => e.createdBy === ME);

  // window bounds for the date-range label + filter
  const today = startOfDay(now);
  const dow = (new Date(now).getDay() + 6) % 7; // Mon = 0
  const weekEnd = today + (7 - dow) * DAY;
  const satStart = today + (5 - dow) * DAY;
  const sunEnd = satStart + 2 * DAY;

  const inRange = (e: EventT) => {
    if (range === "all") return true;
    if (range === "week") return e.start >= now && e.start < weekEnd;
    return e.start >= satStart && e.start < sunEnd; // weekend
  };

  const city = events
    .filter((e) => e.createdBy !== ME && e.end >= now && e.privacy === "public" && inRange(e))
    .sort((a, b) => a.start - b.start);

  const rangeLabel =
    range === "weekend"
      ? `${fmtDay(satStart, lang)} – ${fmtDay(sunEnd - DAY, lang)}`
      : range === "week"
        ? `${fmtDay(now, lang)} – ${fmtDay(weekEnd - DAY, lang)}`
        : lang === "de" ? "Alle kommenden" : "All upcoming";

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 px-5 pb-3" style={{ paddingTop: "max(18px, env(safe-area-inset-top))" }}>
        <OrgTopBar />
        <div className="mt-3 flex items-center gap-1.5">
          <h2 className="font-display font-bold text-[24px] tracking-tight">Stuttgart</h2>
          <ChevronDown size={20} className="text-faint" />
        </div>
        <p className="text-[13px] text-faint mt-0.5">{rangeLabel}</p>

        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          <Chip active={range === "week"} onClick={() => setRange("week")}>This week</Chip>
          <Chip active={range === "weekend"} onClick={() => setRange("weekend")}>This weekend</Chip>
          <Chip active={range === "all"} onClick={() => setRange("all")}>All upcoming</Chip>
        </div>
      </div>

      <div className="flex-1 min-h-0 scroll-y no-scrollbar px-4 pb-32 space-y-2.5">
        {city.length === 0 && (
          <div className="rounded-3xl bg-raise hairline p-8 text-center text-faint text-sm">
            Quiet window — nothing else on in the city. Your night to own.
          </div>
        )}
        {city.map((e) => {
          const clash = mine.find((m) => overlaps(m, e));
          return <CityRow key={e.id} event={e} clash={clash} lang={lang} />;
        })}
      </div>
    </div>
  );
}

function CityRow({ event, clash, lang }: { event: EventT; clash?: EventT; lang: "en" | "de" }) {
  const vibe = VIBES[event.vibe];
  return (
    <button
      onClick={() => openEvent(event.id)}
      className={cx("press w-full rounded-[22px] bg-raise hairline p-3 text-left", clash && "ring-1 ring-coral/40")}
    >
      <div className="flex items-start gap-3">
        <CoverThumb event={event} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-display font-bold text-[15.5px] leading-tight truncate">{event.title}</div>
            <span className="text-[11.5px] text-faint shrink-0">
              {new Date(event.start).toLocaleDateString(locale(lang), { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1 text-[12px] text-faint">
            <span className="inline-flex items-center gap-1 min-w-0">
              <MapPin size={12} className="shrink-0" /> <span className="truncate">{event.venue ?? event.city}</span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Users size={12} /> {event.going.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/12 text-accent text-[11px] font-semibold px-2 h-6">
              {vibe.emoji} {vibe.label}
            </span>
            {clash && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral/14 text-coral text-[11px] font-semibold px-2 h-6">
                <AlertTriangle size={11} /> Clashes with your {new Date(clash.start).toLocaleDateString(locale(lang), { weekday: "short" })} {clash.title}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
