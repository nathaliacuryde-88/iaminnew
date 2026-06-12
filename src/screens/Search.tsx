import React from "react";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import { useApp } from "../store";
import { useNav, openPerson } from "../nav";
import { ME, USERS } from "../data";
import { t } from "../i18n";
import { DAY, startOfDay, VIBES } from "../util";
import type { EventT } from "../types";
import { StackScreen } from "../components/StackScreen";
import { Avatar } from "../components/Avatar";
import { AgendaRow } from "./Calendar";

/** tiny "semantic" matcher: tokens, synonyms and time phrases */
const SYNONYMS: Record<string, string[]> = {
  house: ["club", "party", "techno", "rave"],
  techno: ["club", "party"],
  music: ["concert", "club", "festival", "party"],
  food: ["brunch", "dinner", "picnic"],
  outside: ["picnic", "run", "market", "day"],
  free: ["market", "picnic", "run", "day"],
  dance: ["club", "party", "festival"],
};

function searchEvents(events: EventT[], q: string): EventT[] {
  const ql = q.toLowerCase();
  let list = events.filter((e) => e.end >= Date.now() || e.end > Date.now() - 30 * DAY);

  // time phrases
  if (/weekend|wochenende/.test(ql)) {
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // Mon=0
    const satStart = startOfDay(Date.now()) + (5 - day) * DAY;
    list = list.filter((e) => e.start >= satStart - (day >= 5 ? 2 * DAY : 0) && e.start < satStart + 2 * DAY);
  }
  if (/tonight|today|heute/.test(ql)) list = list.filter((e) => startOfDay(e.start) === startOfDay(Date.now()));
  if (/tomorrow|morgen/.test(ql)) list = list.filter((e) => startOfDay(e.start) === startOfDay(Date.now()) + DAY);

  const tokens = ql
    .replace(/this|the|weekend|tonight|today|tomorrow|wochenende|heute|morgen|am|im/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (tokens.length === 0) return list.filter((e) => e.end >= Date.now());

  return list
    .map((e) => {
      const hay = `${e.title} ${e.venue ?? ""} ${e.city} ${e.vibe} ${e.description ?? ""}`.toLowerCase();
      let score = 0;
      for (const tk of tokens) {
        if (hay.includes(tk)) score += 2;
        for (const syn of SYNONYMS[tk] ?? []) if (hay.includes(syn) || e.vibe === syn) score += 1;
      }
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);
}

export function SearchScreen() {
  const lang = useApp((s) => s.lang);
  const events = useApp((s) => s.events);
  const [q, setQ] = React.useState("");
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const id = setTimeout(() => ref.current?.focus(), 420);
    return () => clearTimeout(id);
  }, []);

  const results = q.trim().length > 1 ? searchEvents(events, q) : [];
  const people =
    q.trim().length > 1
      ? USERS.filter(
          (u) =>
            u.id !== ME &&
            (u.name.toLowerCase().includes(q.toLowerCase()) || u.handle.toLowerCase().includes(q.toLowerCase()))
        )
      : [];

  const suggestions = ["house music this weekend", "picnic", "flohmarkt", "concert im wizemann", "brunch sunday"];

  return (
    <StackScreen
      title={
        <div className="flex items-center gap-2 bg-card hairline rounded-full h-10 px-3.5 -my-0.5">
          <SearchIcon size={15} className="text-faint shrink-0" />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchHint", lang)}
            className="flex-1 bg-transparent text-[14px] font-normal min-w-0"
          />
        </div>
      }
    >
      <div className="px-4 pt-4 pb-16 space-y-4">
        {q.trim().length <= 1 ? (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-1 mb-2.5">
              <Sparkles size={12} /> {lang === "de" ? "Frag einfach" : "Just ask"}
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="press h-9 px-4 rounded-full bg-card hairline text-[13px] text-dim"
                >
                  “{s}”
                </button>
              ))}
            </div>
            <p className="text-[12px] text-faint mt-5 px-1 leading-relaxed">
              {lang === "de"
                ? "Semantische Suche — beschreib einfach, worauf du Lust hast."
                : "Semantic search — describe what you feel like, we find the plan."}
            </p>
          </div>
        ) : (
          <>
            {people.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4">
                {people.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => openPerson(u.id)}
                    className="press shrink-0 flex items-center gap-2 bg-raise hairline rounded-full pl-1.5 pr-4 h-11"
                  >
                    <Avatar user={u} size={32} />
                    <span className="text-[13.5px] font-semibold">{u.name}</span>
                  </button>
                ))}
              </div>
            )}
            {results.length === 0 && people.length === 0 ? (
              <div className="rounded-3xl bg-raise hairline p-10 text-center">
                <div className="text-3xl mb-2">🫥</div>
                <div className="text-[14px] text-dim">
                  {lang === "de" ? "Nichts gefunden — erstell es doch selbst?" : "Nothing found — maybe you create it?"}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((e) => (
                  <AgendaRow key={e.id} event={e} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StackScreen>
  );
}
