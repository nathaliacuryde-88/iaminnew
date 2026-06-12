import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { EventT } from "../types";
import { ME, USERS } from "../data";
import { useApp } from "../store";
import { openEvent } from "../nav";
import { fmtTime, relDay, VIBES, cx } from "../util";
import { t } from "../i18n";
import { Cover } from "./Cover";
import { Facepile } from "./Avatar";
import { RsvpButtons } from "./RSVP";

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full bg-coral text-white text-[11px] font-bold px-2.5 h-6 tracking-wide",
        className
      )}
    >
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-75 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
      </span>
      LIVE
    </span>
  );
}

export function EventCard({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const rsvp = useApp((s) => s.rsvp);
  const live = Date.now() >= event.start && Date.now() <= event.end;
  const mine = event.going.includes(ME) ? "in" : event.maybe.includes(ME) ? "maybe" : null;
  const goingUsers = event.going.map((id) => USERS.find((u) => u.id === id));
  const vibe = VIBES[event.vibe];

  return (
    <motion.article
      layout
      whileTap={{ scale: 0.98 }}
      onClick={() => openEvent(event.id)}
      className="rounded-[26px] bg-raise hairline overflow-hidden cursor-pointer"
    >
      <Cover event={event} rounded="rounded-none" className="h-[168px]">
        {/* top chips */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between">
          <span className="glass hairline rounded-full h-7 px-3 inline-flex items-center text-[12px] font-bold text-ink">
            {live ? <LiveBadge className="-mx-2.5 h-7" /> : relDay(event.start, lang)}
          </span>
          <span className="glass hairline rounded-full h-7 px-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-ink">
            {vibe.emoji} {vibe.label}
            {event.privacy === "ghost" && " · 👻"}
          </span>
        </div>
        {/* bottom scrim + venue */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
        {event.venue && (
          <div className="absolute bottom-3 left-3.5 flex items-center gap-1 text-[12px] font-medium text-white/90">
            <MapPin size={13} strokeWidth={2.4} />
            <span className="truncate max-w-[230px]">{event.venue}</span>
          </div>
        )}
      </Cover>

      <div className="p-4 pt-3.5">
        <h2 className="font-display font-bold text-[19px] leading-[1.15] tracking-tight text-balance">
          {event.title}
        </h2>
        <div className="text-[13px] text-dim mt-1">
          {fmtTime(event.start, lang)}
          {event.privacy !== "ghost" && (
            <>
              {" · "}
              <span className="text-faint">
                {t("hostedBy", lang)}{" "}
                {USERS.find((u) => u.id === event.createdBy)?.name ?? "you"}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <Facepile users={goingUsers} size={26} max={3} />
            <span className="text-[12.5px] text-faint font-medium shrink-0">
              {event.going.length} {t("going", lang)}
              {event.maybe.length > 0 && ` · ${event.maybe.length} ${t("maybe", lang).toLowerCase()}`}
            </span>
          </div>
          {event.privacy !== "ghost" && (
            <RsvpButtons value={mine} onChange={(r) => rsvp(event.id, r)} />
          )}
        </div>
      </div>
    </motion.article>
  );
}
