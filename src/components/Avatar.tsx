import type { User } from "../types";
import { cx, initials } from "../util";

const moodDot: Record<string, { bg: string; label: string }> = {
  open: { bg: "bg-mint", label: "open" },
  "not-today": { bg: "bg-coral", label: "not today" },
  "lazy-week": { bg: "bg-gold", label: "lazy week" },
};

export function Avatar({
  user,
  size = 40,
  ring,
  mood,
  className,
}: {
  user?: User;
  size?: number;
  ring?: boolean;
  mood?: boolean;
  className?: string;
}) {
  if (!user) return null;
  const m = mood && user.mood ? moodDot[user.mood] : null;
  return (
    <div className={cx("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div
        className={cx(
          "w-full h-full rounded-full flex items-center justify-center overflow-hidden select-none",
          ring && "ring-2 ring-accent/70 ring-offset-2 ring-offset-bg"
        )}
        style={{
          background: `linear-gradient(135deg, ${user.gradient[0]}, ${user.gradient[1]})`,
          fontSize: size * 0.42,
        }}
      >
        {user.emoji ? (
          <span style={{ fontSize: size * 0.5 }}>{user.emoji}</span>
        ) : (
          <span className="font-display font-bold text-white" style={{ fontSize: size * 0.36 }}>
            {initials(user.name)}
          </span>
        )}
      </div>
      {m && (
        <span
          className={cx(
            "absolute bottom-0 right-0 rounded-full border-2 border-bg",
            m.bg
          )}
          style={{ width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28) }}
        />
      )}
    </div>
  );
}

export function Facepile({
  users,
  size = 24,
  max = 4,
  extra,
}: {
  users: Array<User | undefined>;
  size?: number;
  max?: number;
  extra?: number;
}) {
  const shown = users.filter(Boolean).slice(0, max) as User[];
  const more = (extra ?? 0) + Math.max(0, users.filter(Boolean).length - max);
  return (
    <div className="flex items-center">
      {shown.map((u, i) => (
        <div
          key={u.id}
          className="rounded-full border-2 border-bg"
          style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: 10 - i }}
        >
          <Avatar user={u} size={size} />
        </div>
      ))}
      {more > 0 && (
        <div
          className="rounded-full bg-card hairline text-faint font-semibold flex items-center justify-center border-2 border-bg"
          style={{
            width: size + 4,
            height: size + 4,
            marginLeft: -size * 0.32,
            fontSize: Math.max(9, size * 0.36),
          }}
        >
          +{more}
        </div>
      )}
    </div>
  );
}
