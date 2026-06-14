import React from "react";
import { AnimatePresence } from "framer-motion";
import { useApp } from "./store";
import { useNav, defaultTab, tabsFor } from "./nav";
import { cx, HOUR } from "./util";
import { TabBar } from "./components/TabBar";
import { Toasts } from "./components/Toasts";
import { Onboarding } from "./screens/Onboarding";
import { FeedScreen } from "./screens/Feed";
import { CalendarScreen } from "./screens/Calendar";
import { CapsuleScreen, CapsuleDetailScreen } from "./screens/Capsule";
import { ProfileScreen } from "./screens/Profile";
import { EventDetailScreen } from "./screens/EventDetail";
import { PersonScreen } from "./screens/Person";
import { SearchScreen } from "./screens/Search";
import { NotificationsScreen } from "./screens/Notifications";
import { SettingsScreen } from "./screens/Settings";
import { PeopleScreen } from "./screens/People";
import { OrganizerDashboardScreen } from "./screens/OrganizerDashboard";
import { OrganizerCityScreen } from "./screens/OrganizerCity";
import { MetricsScreen } from "./screens/Metrics";
import { CreateSheet } from "./screens/Create";
import { SheetHost } from "./sheets/SheetHost";

export default function App() {
  const onboarded = useApp((s) => s.onboarded);
  const theme = useApp((s) => s.theme);
  const seededAt = useApp((s) => s.seededAt);
  const reseed = useApp((s) => s.reseed);
  const mode = useApp((s) => s.mode);
  const tab = useNav((s) => s.tab);
  const stack = useNav((s) => s.stack);
  const activeTab = tabsFor(mode).includes(tab) ? tab : defaultTab(mode);

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  /* keep the demo timeline anchored around "today" */
  React.useEffect(() => {
    if (Date.now() - seededAt > 20 * HOUR) reseed();
  }, []);

  return (
    <div className="stage">
      <div className="device">
        {!onboarded ? (
          <Onboarding />
        ) : (
          <>
            {/* tab pages stay mounted to preserve scroll */}
            {mode === "organizer" ? (
              <>
                <div className={cx("absolute inset-0", activeTab !== "dashboard" && "hidden")}>
                  <OrganizerDashboardScreen />
                </div>
                <div className={cx("absolute inset-0", activeTab !== "city" && "hidden")}>
                  <OrganizerCityScreen />
                </div>
                <div className={cx("absolute inset-0", activeTab !== "metrics" && "hidden")}>
                  <MetricsScreen />
                </div>
                <div className={cx("absolute inset-0", activeTab !== "profile" && "hidden")}>
                  <ProfileScreen />
                </div>
              </>
            ) : (
              <>
                <div className={cx("absolute inset-0", activeTab !== "feed" && "hidden")}>
                  <FeedScreen />
                </div>
                <div className={cx("absolute inset-0", activeTab !== "calendar" && "hidden")}>
                  <CalendarScreen />
                </div>
                <div className={cx("absolute inset-0", activeTab !== "capsule" && "hidden")}>
                  <CapsuleScreen />
                </div>
                <div className={cx("absolute inset-0", activeTab !== "profile" && "hidden")}>
                  <ProfileScreen />
                </div>
              </>
            )}

            <TabBar />

            {/* pushed stack */}
            <AnimatePresence>
              {stack.map((s) => {
                switch (s.kind) {
                  case "event":
                    return <EventDetailScreen key={s.key} id={s.id} />;
                  case "person":
                    return <PersonScreen key={s.key} id={s.id} />;
                  case "capsule":
                    return <CapsuleDetailScreen key={s.key} id={s.id} />;
                  case "search":
                    return <SearchScreen key={s.key} />;
                  case "notifications":
                    return <NotificationsScreen key={s.key} />;
                  case "settings":
                    return <SettingsScreen key={s.key} />;
                  case "people":
                    return <PeopleScreen key={s.key} />;
                  default:
                    return null;
                }
              })}
            </AnimatePresence>

            <CreateSheet />
            <SheetHost />
          </>
        )}
        <Toasts />
      </div>
    </div>
  );
}
