import React from "react";
import { motion } from "framer-motion";
import { cx, haptic } from "../util";

/* ---------- Button ---------- */
export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "soft" | "ghost" | "outline" | "danger" | "mint";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  const base =
    "press inline-flex items-center justify-center gap-1.5 font-semibold select-none whitespace-nowrap";
  const sizes = {
    sm: "h-8 px-3.5 text-[13px] rounded-full",
    md: "h-10 px-5 text-sm rounded-full",
    lg: "h-[52px] px-6 text-[15px] rounded-2xl w-full",
  };
  const variants = {
    primary:
      "bg-gradient-to-br from-accent to-[#6E4DFF] text-white shadow-[0_8px_24px_-8px_var(--glow)]",
    mint: "bg-mint text-[#06281A]",
    soft: "bg-card text-ink hairline",
    ghost: "text-dim",
    outline: "hairline text-ink bg-transparent",
    danger: "bg-coral/15 text-coral",
  };
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        haptic(8);
        onClick?.(e);
      }}
      className={cx(base, sizes[size], variants[variant], disabled && "opacity-40 pointer-events-none", className)}
    >
      {children}
    </button>
  );
}

/* ---------- Chip ---------- */
export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={() => {
        haptic(5);
        onClick?.();
      }}
      className={cx(
        "press h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium inline-flex items-center gap-1",
        active ? "bg-ink text-bg" : "bg-card text-dim hairline",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ---------- Section card ---------- */
export function Section({
  icon,
  title,
  aside,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-3xl bg-raise hairline p-4", className)}>
      {(title || aside) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-ink">
            {icon}
            <h3 className="font-display font-semibold text-[15px] tracking-tight">{title}</h3>
          </div>
          {aside}
        </div>
      )}
      {children}
    </div>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => {
        haptic(8);
        onChange(!on);
      }}
      className={cx(
        "w-12 h-7 rounded-full p-[3px] transition-colors duration-200 shrink-0",
        on ? "bg-accent" : "bg-card hairline"
      )}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
        className={cx("w-[22px] h-[22px] rounded-full bg-white shadow", on ? "ml-auto" : "")}
      />
    </button>
  );
}

/* ---------- Field ---------- */
export function Field({
  label,
  children,
  hint,
}: {
  label?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      {label && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint mb-1.5 px-1">
          {label}
        </div>
      )}
      {children}
      {hint && <div className="text-xs text-faint mt-1.5 px-1">{hint}</div>}
    </label>
  );
}

export const inputCls =
  "w-full h-12 rounded-2xl bg-card hairline px-4 text-[15px] text-ink placeholder:text-faint focus:border-accent/60 transition-colors";

/* ---------- Segmented control with sliding indicator ---------- */
export function Seg<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: React.ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={cx("relative flex rounded-full bg-card hairline p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => {
              haptic(6);
              onChange(o.value);
            }}
            className="relative flex-1 h-9 rounded-full text-[13px] font-semibold"
          >
            {active && (
              <motion.div
                layoutId={`seg-${id}`}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-full bg-raise shadow-[0_2px_12px_rgba(0,0,0,0.25)] hairline"
              />
            )}
            <span className={cx("relative z-10", active ? "text-ink" : "text-faint")}>
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Row (settings-style) ---------- */
export function Row({
  icon,
  label,
  sub,
  right,
  onClick,
  danger,
}: {
  icon?: React.ReactNode;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cx(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left",
        onClick && "press"
      )}
    >
      {icon && (
        <div
          className={cx(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            danger ? "bg-coral/12 text-coral" : "bg-card text-dim"
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={cx("text-[15px] font-medium", danger ? "text-coral" : "text-ink")}>{label}</div>
        {sub && <div className="text-[12.5px] text-faint mt-0.5">{sub}</div>}
      </div>
      {right}
    </Comp>
  );
}
