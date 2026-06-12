import { Cake, MapPin, ReceiptText } from "lucide-react";
import { useApp } from "../store";
import { useNav } from "../nav";
import { ME, USERS } from "../data";
import { t } from "../i18n";
import { DAY, startOfDay } from "../util";
import { Avatar } from "../components/Avatar";
import { StackScreen } from "../components/StackScreen";
import { Btn } from "../components/Primitives";
import { AgendaRow, BirthdayRow } from "./Calendar";

const MOOD_LABEL = {
  open: "🟢 Open to plans",
  "not-today": "🌙 Not today",
  "lazy-week": "😴 Lazy week",
} as const;

export function PersonScreen({ id }: { id: string }) {
  const lang = useApp((s) => s.lang);
  const events = useApp((s) => s.events);
  const following = useApp((s) => s.following);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const openSheet = useNav((s) => s.openSheet);
  const user = USERS.find((u) => u.id === id);
  if (!user) return null;

  const isF = following.includes(user.id);
  const visible = events.filter(
    (e) =>
      (e.going.includes(user.id) || e.createdBy === user.id) &&
      e.privacy !== "ghost" &&
      (e.privacy !== "list" || e.invited.includes(ME) || e.going.includes(ME))
  );
  const upcoming = visible.filter((e) => e.end >= Date.now()).sort((a, b) => a.start - b.start);
  const together = visible.filter((e) => e.end < Date.now() && (e.going.includes(ME) || e.createdBy === ME));

  /* birthday within next 30 days? */
  let bdayTs: number | null = null;
  if (user.birthday) {
    const now = new Date();
    for (const y of [now.getFullYear(), now.getFullYear() + 1]) {
      const ts = new Date(y, user.birthday.month - 1, user.birthday.day, 12).getTime();
      if (ts >= startOfDay(Date.now()) && ts < Date.now() + 30 * DAY) {
        bdayTs = ts;
        break;
      }
    }
  }

  return (
    <StackScreen title={`@${user.handle}`}>
      <div className="px-4 pt-4 pb-16 space-y-4">
        {/* identity */}
        <div className="flex items-center gap-4 px-1">
          <Avatar user={user} size={76} mood />
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[21px] tracking-tight truncate">
              {user.name}
              {user.verified && <span className="text-accent text-[15px]"> ✓</span>}
            </div>
            <div className="flex items-center gap-3 text-[12.5px] text-faint mt-1">
              {user.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} /> {user.city}
                </span>
              )}
              <span>
                {user.mutuals} {user.mutuals === 1 ? t("mutual", lang) : t("mutuals", lang)}
              </span>
            </div>
            {user.mood && (
              <div className="text-[12.5px] font-semibold mt-1.5">{MOOD_LABEL[user.mood]}</div>
            )}
          </div>
        </div>
        {user.bio && <p className="text-[13.5px] text-dim px-1">{user.bio}</p>}

        <div className="flex gap-2">
          <Btn
            className="flex-1"
            variant={isF ? "soft" : "primary"}
            onClick={() => toggleFollow(user.id)}
          >
            {isF ? t("following", lang) + " ✓" : "+ " + t("follow", lang)}
          </Btn>
          {together.length > 0 && (
            <Btn variant="outline" className="flex-1" onClick={() => openSheet({ kind: "receipt", userId: user.id })}>
              <ReceiptText size={15} /> {t("friendshipReceipt", lang)}
            </Btn>
          )}
        </div>

        {bdayTs && <BirthdayRow user={user} ts={bdayTs} />}

        {/* their plans I can see */}
        {upcoming.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-1 mb-2">
              {lang === "de" ? "Demnächst unterwegs" : "Where they'll be"}
            </div>
            <div className="space-y-2">
              {upcoming.slice(0, 5).map((e) => (
                <AgendaRow key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}

        {together.length > 0 && (
          <div className="rounded-3xl bg-raise hairline p-4 flex items-center gap-3">
            <span className="text-2xl">🎞️</span>
            <div className="flex-1 text-[13.5px] text-dim">
              <b className="text-ink">{together.length}</b>{" "}
              {lang === "de" ? "gemeinsame Nächte archiviert" : `nights archived together`}
            </div>
            <Cake size={0} className="hidden" />
          </div>
        )}
      </div>
    </StackScreen>
  );
}
