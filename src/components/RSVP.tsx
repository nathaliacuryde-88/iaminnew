import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleHelp } from "lucide-react";
import type { Rsvp } from "../types";
import { useApp } from "../store";
import { t } from "../i18n";
import { cx, haptic } from "../util";

const COLORS = ["#3EE6A0", "#8A6CFF", "#FFC65C", "#FF6A8E", "#6CC6FF"];

export function Burst({ trigger }: { trigger: number }) {
  if (!trigger) return null;
  return (
    <AnimatePresence>
      <motion.div key={trigger} className="absolute inset-0 pointer-events-none overflow-visible">
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (i / 14) * Math.PI * 2 + (trigger % 7) * 0.3;
          const dist = 34 + ((i * 13 + trigger) % 26);
          return (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.4, 1] }}
              className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

export function RsvpButtons({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: Rsvp;
  onChange: (r: Rsvp) => void;
  size?: "md" | "lg";
  className?: string;
}) {
  const lang = useApp((s) => s.lang);
  const [burst, setBurst] = React.useState(0);
  const h = size === "lg" ? "h-12 text-[14.5px]" : "h-9 text-[13px]";

  return (
    <div className={cx("flex items-center gap-2", className)}>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={(e) => {
          e.stopPropagation();
          haptic(8);
          onChange(value === "maybe" ? null : "maybe");
        }}
        className={cx(
          "press rounded-full px-4 font-semibold inline-flex items-center gap-1.5 transition-colors duration-200",
          h,
          value === "maybe" ? "bg-gold text-[#3A2A00]" : "bg-card hairline text-dim"
        )}
      >
        <CircleHelp size={size === "lg" ? 17 : 15} strokeWidth={2.4} />
        {t("maybe", lang)}
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={(e) => {
          e.stopPropagation();
          haptic(value === "in" ? 8 : 18);
          if (value !== "in") setBurst((b) => b + 1);
          onChange(value === "in" ? null : "in");
        }}
        className={cx(
          "press relative rounded-full px-4 font-bold inline-flex items-center gap-1.5 transition-colors duration-200",
          h,
          value === "in"
            ? "bg-mint text-[#06281A] shadow-[0_6px_20px_-6px_rgba(62,230,160,0.6)]"
            : "bg-gradient-to-br from-accent to-[#6E4DFF] text-white shadow-[0_6px_20px_-6px_var(--glow)]"
        )}
      >
        {value === "in" && <Check size={size === "lg" ? 17 : 15} strokeWidth={3} />}
        {value === "in" ? t("youreIn", lang) : t("imIn", lang)}
        <Burst trigger={burst} />
      </motion.button>
    </div>
  );
}
