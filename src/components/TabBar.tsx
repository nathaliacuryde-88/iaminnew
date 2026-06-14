import { motion } from "framer-motion";
import { Archive, BarChart3, Calendar, LayoutGrid, MapPin, Plus, Sparkles, UserRound } from "lucide-react";
import { useNav, defaultTab, tabsFor, type Tab } from "../nav";
import { useApp } from "../store";
import { t, type TKey } from "../i18n";
import { cx } from "../util";

type Item = { tab: Tab; icon: typeof Sparkles; key: TKey };

const PERSON: Item[] = [
  { tab: "feed", icon: Sparkles, key: "feed" },
  { tab: "calendar", icon: Calendar, key: "calendar" },
  { tab: "capsule", icon: Archive, key: "capsule" },
  { tab: "profile", icon: UserRound, key: "profile" },
];
const ORGANIZER: Item[] = [
  { tab: "dashboard", icon: LayoutGrid, key: "dashboard" },
  { tab: "city", icon: MapPin, key: "city" },
  { tab: "metrics", icon: BarChart3, key: "metrics" },
  { tab: "profile", icon: UserRound, key: "profile" },
];

export function TabBar() {
  const tab = useNav((s) => s.tab);
  const setTab = useNav((s) => s.setTab);
  const openSheet = useNav((s) => s.openSheet);
  const sheet = useNav((s) => s.sheet);
  const lang = useApp((s) => s.lang);
  const mode = useApp((s) => s.mode);
  const createOpen = sheet?.kind === "create";

  const items = mode === "organizer" ? ORGANIZER : PERSON;
  const activeTab = tabsFor(mode).includes(tab) ? tab : defaultTab(mode);

  const renderItem = (it: Item) => {
    const active = activeTab === it.tab;
    const Icon = it.icon;
    return (
      <button
        key={it.tab}
        onClick={() => setTab(it.tab)}
        className="relative flex flex-col items-center justify-center w-[52px] h-12 press"
        aria-label={t(it.key, lang)}
      >
        <Icon
          size={21}
          strokeWidth={active ? 2.4 : 1.9}
          className={cx("transition-colors duration-200", active ? "text-ink" : "text-faint")}
        />
        <span
          className={cx(
            "text-[9px] font-semibold mt-1 transition-colors duration-200 tracking-wide",
            active ? "text-ink" : "text-faint/70"
          )}
        >
          {t(it.key, lang)}
        </span>
        {active && (
          <motion.div
            layoutId="tab-glow"
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
            className="absolute -top-[5px] w-5 h-1 rounded-full bg-accent shadow-[0_0_12px_var(--glow)]"
          />
        )}
      </button>
    );
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto glass hairline rounded-[26px] px-2.5 py-1.5 flex items-center gap-0.5 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
        {items.slice(0, 2).map(renderItem)}
        {/* center create */}
        <motion.button
          onClick={() => openSheet({ kind: "create" })}
          whileTap={{ scale: 0.88 }}
          animate={{ rotate: createOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="relative mx-1.5 w-[52px] h-[52px] -mt-5 rounded-[20px] flex items-center justify-center text-white bg-gradient-to-br from-accent via-[#7A5BFF] to-[#B16CFF] shadow-[0_10px_30px_-6px_var(--glow),inset_0_1px_0_rgba(255,255,255,0.35)]"
          aria-label="Create"
        >
          <Plus size={26} strokeWidth={2.6} />
        </motion.button>
        {items.slice(2).map(renderItem)}
      </div>
    </div>
  );
}
