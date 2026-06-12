import { AnimatePresence, motion } from "framer-motion";
import { useNav } from "../nav";

export function Toasts() {
  const toasts = useNav((s) => s.toasts);
  const dismiss = useNav((s) => s.dismissToast);
  return (
    <div className="absolute top-0 inset-x-0 z-[80] flex flex-col items-center gap-2 px-4 pointer-events-none" style={{ paddingTop: "max(14px, env(safe-area-inset-top))" }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            initial={{ y: -80, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 480, damping: 34 }}
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto w-full max-w-[360px] glass hairline rounded-2xl px-4 py-3 flex items-center gap-3 text-left shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          >
            <span className="text-xl shrink-0">{t.icon}</span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold text-ink leading-tight truncate">
                {t.title}
              </span>
              {t.sub && (
                <span className="block text-[12px] text-dim leading-tight mt-0.5 truncate">
                  {t.sub}
                </span>
              )}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
