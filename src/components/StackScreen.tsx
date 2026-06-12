import React from "react";
import { motion, useDragControls } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useNav } from "../nav";
import { cx } from "../util";

/**
 * Full-screen pushed view with iOS-style slide-in and
 * edge-swipe-to-go-back (drag from the left edge).
 */
export function StackScreen({
  children,
  title,
  right,
  chrome = "bar",
  noPad,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  right?: React.ReactNode;
  /** bar = solid header · float = transparent header over hero */
  chrome?: "bar" | "float";
  noPad?: boolean;
}) {
  const pop = useNav((s) => s.pop);
  const controls = useDragControls();

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 40 }}
      drag="x"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.9 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 90 || info.velocity.x > 500) pop();
      }}
      className="absolute inset-0 z-40 bg-bg flex flex-col"
      style={{ boxShadow: "-24px 0 60px rgba(0,0,0,0.45)" }}
    >
      {/* edge swipe-back zone */}
      <div
        className="absolute left-0 top-0 bottom-0 w-6 z-50 touch-none"
        onPointerDown={(e) => controls.start(e)}
      />

      {chrome === "bar" ? (
        <div
          className="shrink-0 z-20 glass hairline-b flex items-center gap-2 px-3"
          style={{ paddingTop: "max(10px, env(safe-area-inset-top))", paddingBottom: 10 }}
        >
          <BackBtn onClick={pop} plain />
          <div className="flex-1 font-display font-semibold text-[17px] tracking-tight truncate">
            {title}
          </div>
          {right}
        </div>
      ) : (
        <div
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pointer-events-none"
          style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
        >
          <BackBtn onClick={pop} />
          <div className="flex items-center gap-2 pointer-events-auto">{right}</div>
        </div>
      )}

      <div className={cx("flex-1 min-h-0 scroll-y no-scrollbar", !noPad && "pb-10")}>{children}</div>
    </motion.div>
  );
}

export function BackBtn({ onClick, plain }: { onClick: () => void; plain?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "press pointer-events-auto flex items-center justify-center rounded-full",
        plain ? "w-9 h-9 text-ink" : "w-10 h-10 glass hairline text-ink shadow-lg"
      )}
      aria-label="Back"
    >
      <ChevronLeft size={22} strokeWidth={2.4} />
    </button>
  );
}

export function IconBtn({
  children,
  onClick,
  className,
  badge,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "press relative w-10 h-10 rounded-full glass hairline flex items-center justify-center text-ink pointer-events-auto",
        className
      )}
    >
      {children}
      {badge ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center border-2 border-bg">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}
