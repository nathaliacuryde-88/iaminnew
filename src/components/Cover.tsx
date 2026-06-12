import { VIBES, cx } from "../util";
import type { EventT } from "../types";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/** Deterministic generated poster art for an event. */
export function Cover({
  event,
  className,
  emojiSize = 56,
  children,
  rounded = "rounded-3xl",
}: {
  event: Pick<EventT, "emoji" | "vibe" | "art" | "title">;
  className?: string;
  emojiSize?: number;
  children?: React.ReactNode;
  rounded?: string;
}) {
  const [a, b] = VIBES[event.vibe]?.hue ?? ["#8A6CFF", "#FF6A8E"];
  const s = event.art ?? 1;
  const x1 = 18 + ((s * 37) % 55);
  const y1 = 12 + ((s * 23) % 40);
  const x2 = 55 + ((s * 13) % 40);
  const y2 = 58 + ((s * 31) % 38);
  const angle = (s * 47) % 360;

  return (
    <div className={cx("relative overflow-hidden", rounded, className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(120% 90% at ${x1}% ${y1}%, ${a}E6, transparent 60%),
            radial-gradient(110% 100% at ${x2}% ${y2}%, ${b}CC, transparent 65%),
            linear-gradient(${angle}deg, #15121f, #0b0a12)
          `,
        }}
      />
      {/* glow orb */}
      <div
        className="absolute rounded-full blur-2xl opacity-50"
        style={{
          width: "55%",
          paddingBottom: "55%",
          left: `${(x1 + x2) / 2 - 24}%`,
          top: `${(y1 + y2) / 2 - 28}%`,
          background: `radial-gradient(circle, ${b}, transparent 70%)`,
        }}
      />
      {/* fine grain */}
      <div
        className="absolute inset-0 opacity-[0.13] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: NOISE, backgroundSize: "140px 140px" }}
      />
      {/* emoji mark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
          style={{ fontSize: emojiSize, lineHeight: 1 }}
        >
          {event.emoji}
        </span>
      </div>
      {children}
    </div>
  );
}

/** small square thumb used in lists */
export function CoverThumb({
  event,
  size = 48,
  className,
}: {
  event: Pick<EventT, "emoji" | "vibe" | "art" | "title">;
  size?: number;
  className?: string;
}) {
  return (
    <Cover
      event={event}
      rounded="rounded-2xl"
      emojiSize={size * 0.46}
      className={cx("shrink-0", className)}
    >
      <div style={{ width: size, height: size }} />
    </Cover>
  );
}

/** generated "photo" for capsules — colourful memory-like tile */
export function PhotoTile({
  seed,
  emoji,
  src,
  className,
}: {
  seed: number;
  emoji: string;
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cx("relative overflow-hidden rounded-2xl", className)}>
        <img src={src} className="w-full h-full object-cover" alt="" />
      </div>
    );
  }
  const hues = [
    ["#FF8E53", "#FE6B8B"],
    ["#36D1DC", "#5B86E5"],
    ["#A8E063", "#56AB2F"],
    ["#F953C6", "#B91D73"],
    ["#FFD26F", "#3677FF"],
    ["#C33764", "#1D2671"],
    ["#11998E", "#38EF7D"],
    ["#FC466B", "#3F5EFB"],
  ];
  const [a, b] = hues[seed % hues.length];
  const px = 20 + ((seed * 29) % 60);
  const py = 20 + ((seed * 53) % 60);
  return (
    <div className={cx("relative overflow-hidden rounded-2xl", className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(100% 100% at ${px}% ${py}%, ${a}, ${b})`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: NOISE, backgroundSize: "120px 120px" }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow-lg">
        {emoji}
      </div>
    </div>
  );
}
