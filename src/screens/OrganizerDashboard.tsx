import { ArrowRight, MapPin, Users, Zap } from "lucide-react";
import { useApp } from "../store";
import { useNav, openEvent } from "../nav";
import { ME } from "../data";
import { cx, fmtTime, forecast, locale } from "../util";
import type { EventT } from "../types";
import { Cover } from "../components/Cover";
import { Btn } from "../components/Primitives";
import { OrgTopBar } from "../components/OrgHeader";

const compactDate = (ts: number, lang: "en" | "de") =>
  new Date(ts).toLocaleDateString(locale(lang), { weekday: "short", month: "short", day: "numeric" }) +
  " · " +
  fmtTime(ts, lang);

export function OrganizerDashboardScreen() {
  const lang = useApp((s) => s.lang);
  const me = useApp((s) => s.me);
  const events = useApp((s) => s.events);
  const setTab = useNav((s) => s.setTab);
  const now = Date.now();

  const hosted = events
    .filter((e) => e.createdBy === ME && e.end >= now && e.privacy !== "ghost")
    .sort((a, b) => a.start - b.start);
  const next = hosted[0];
  const rest = hosted.slice(1);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 px-5 pb-3" style={{ paddingTop: "max(18px, env(safe-area-inset-top))" }}>
        <OrgTopBar />
        <h2 className="font-display font-bold text-[24px] tracking-tight mt-3">
          {lang === "de" ? `Hey ${me.orgName || me.name} 👋` : `Hey ${me.orgName || me.name} 👋`}
        </h2>
        <p className="text-[13px] text-faint mt-0.5">{lang === "de" ? "Dein Veranstalter-Deck." : "Your hosting deck."}</p>
      </div>

      <div className="flex-1 min-h-0 scroll-y no-scrollbar px-4 pb-32 space-y-3.5">
        {!next && (
          <div className="rounded-3xl bg-raise hairline p-8 text-center text-faint text-sm">
            Nothing on your calendar yet — hit + to host your first.
          </div>
        )}

        {next && (
          <>
            <SectionLabel>Next up</SectionLabel>
            <HostCard event={next} hero />
          </>
        )}

        {rest.length > 0 && (
          <>
            <SectionLabel>Upcoming</SectionLabel>
            {rest.map((e) => (
              <HostCard key={e.id} event={e} />
            ))}
          </>
        )}

        <button
          onClick={() => setTab("city")}
          className="press w-full rounded-3xl p-4 text-left hairline flex items-center gap-3"
          style={{ background: "linear-gradient(120deg, rgba(138,108,255,0.16), rgba(62,230,160,0.07)), rgb(var(--c-raise))" }}
        >
          <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-xl shrink-0">🌃</div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-[15px]">See what else is happening</div>
            <div className="text-[12.5px] text-dim">Scout the city & dodge date clashes</div>
          </div>
          <ArrowRight size={18} className="text-accent shrink-0" />
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-1 pt-1">{children}</div>;
}

function HostCard({ event, hero }: { event: EventT; hero?: boolean }) {
  const lang = useApp((s) => s.lang);
  const openSheet = useNav((s) => s.openSheet);
  const f = forecast(event);
  const live = Date.now() >= event.start && Date.now() <= event.end;

  return (
    <div
      onClick={() => openEvent(event.id)}
      className={cx("press rounded-[26px] bg-raise hairline overflow-hidden cursor-pointer", hero && "ring-1 ring-accent/55")}
    >
      <div className="px-4 pt-3.5 pb-3">
        <div className="font-display font-bold text-[18px] tracking-tight leading-tight">{event.title}</div>
        <div className="text-[12.5px] text-faint mt-0.5">
          {live ? <span className="text-coral font-bold">● LIVE NOW</span> : compactDate(event.start, lang)}
        </div>
      </div>

      <Cover event={event} rounded="rounded-none" className="h-[140px]" emojiSize={60} />

      <div className="flex items-center justify-between px-4 py-2.5 text-[12.5px] text-faint">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <MapPin size={13} className="shrink-0" /> <span className="truncate">{event.venue ?? event.city}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 shrink-0">
          <Users size={13} /> {event.going.length}
        </span>
      </div>

      {/* projected fill strip */}
      <div className="px-4 pb-4">
        <div className="rounded-2xl bg-card hairline p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-faint">Projected fill</div>
            <div className="font-display font-bold text-[20px] leading-tight">
              ~{f.projected} <span className="text-faint text-[12px] font-normal">expected</span>
            </div>
            {f.pact > 0 ? (
              <div className="text-[11.5px] text-accent">🔗 {f.pact} one friend away</div>
            ) : (
              <div className="text-[11.5px] text-faint">{f.confirmed} confirmed · {f.maybe} maybe</div>
            )}
          </div>
          {f.maybe > 0 && (
            <Btn
              size="sm"
              variant="soft"
              onClick={(e) => {
                e.stopPropagation();
                openSheet({ kind: "convertMaybes", eventId: event.id });
              }}
            >
              <Zap size={13} className="text-gold" /> Convert {f.maybe}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
