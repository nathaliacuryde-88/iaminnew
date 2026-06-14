import React from "react";
import { useApp } from "../store";
import { useNav } from "../nav";
import { t } from "../i18n";
import { ago, cx, startOfDay } from "../util";
import type { Notif } from "../types";
import { StackScreen } from "../components/StackScreen";

const ICONS: Record<Notif["kind"], string> = {
  tab: "💸",
  invite: "💌",
  rsvp: "✅",
  pact: "🤝",
  follow: "👋",
  pulse: "📣",
  capsule: "🎞️",
  birthday: "🎂",
  line: "🚪",
  reminder: "⏰",
  spark: "✨",
};

export function NotificationsScreen() {
  const lang = useApp((s) => s.lang);
  const notifs = useApp((s) => s.notifs);
  const markNotifsRead = useApp((s) => s.markNotifsRead);
  const { push, pop } = useNav();

  React.useEffect(() => {
    const id = setTimeout(markNotifsRead, 1200);
    return () => clearTimeout(id);
  }, []);

  const today = notifs.filter((n) => n.ts >= startOfDay(Date.now()));
  const earlier = notifs.filter((n) => n.ts < startOfDay(Date.now()));

  const row = (n: Notif) => (
    <button
      key={n.id}
      onClick={() => {
        if (n.kind === "spark" && n.eventId) push({ kind: "capsule", id: n.eventId });
        else if (n.eventId) push({ kind: "event", id: n.eventId });
        else if (n.userId) push({ kind: "person", id: n.userId });
      }}
      className="press w-full flex items-start gap-3 px-4 py-3.5 text-left"
    >
      <div className="w-10 h-10 rounded-2xl bg-card hairline flex items-center justify-center text-lg shrink-0">
        {ICONS[n.kind]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cx("text-[13.5px] leading-snug", n.read ? "text-dim" : "text-ink font-medium")}>
          {n.text}
        </p>
        <div className="text-[11px] text-faint mt-1">{ago(n.ts, lang)}</div>
      </div>
      {!n.read && <span className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />}
    </button>
  );

  return (
    <StackScreen title={t("notifications", lang)}>
      <div className="pt-2 pb-16">
        {today.length > 0 && (
          <>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-5 pt-3 pb-1">
              {t("today", lang)}
            </div>
            <div className="divide-y divide-line/[0.05]">{today.map(row)}</div>
          </>
        )}
        {earlier.length > 0 && (
          <>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-5 pt-4 pb-1">
              {t("earlier", lang)}
            </div>
            <div className="divide-y divide-line/[0.05]">{earlier.map(row)}</div>
          </>
        )}
        {notifs.length === 0 && (
          <div className="p-10 text-center text-faint text-sm">All quiet. Go make some noise.</div>
        )}
      </div>
    </StackScreen>
  );
}
