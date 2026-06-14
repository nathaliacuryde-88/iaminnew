import { Bell, Settings } from "lucide-react";
import { useApp } from "../store";
import { useNav } from "../nav";
import { IconBtn } from "./StackScreen";

/** Shared top row for the organizer tabs: logo + ORGANIZER pill + bell + settings. */
export function OrgTopBar() {
  const push = useNav((s) => s.push);
  const unread = useApp((s) => s.notifs.filter((n) => !n.read).length);
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-display font-bold text-[22px] tracking-tight select-none flex items-center gap-2">
        <span>
          I am{" "}
          <span className="text-accent">
            (IN<span className="text-accent2">)</span>
          </span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent bg-accent/14 rounded-full px-2 py-1 leading-none">
          Organizer
        </span>
      </h1>
      <div className="flex items-center gap-2">
        <IconBtn onClick={() => push({ kind: "notifications" })} badge={unread}>
          <Bell size={18} strokeWidth={2.2} />
        </IconBtn>
        <IconBtn onClick={() => push({ kind: "settings" })}>
          <Settings size={17} />
        </IconBtn>
      </div>
    </div>
  );
}
