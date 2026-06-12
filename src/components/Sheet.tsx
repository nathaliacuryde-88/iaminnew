import React from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { cx } from "../util";

export function Sheet({
  open,
  onClose,
  children,
  full,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  full?: boolean;
  title?: React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: "var(--scrim)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
          />
          <motion.div
            initial={{ y: "104%" }}
            animate={{ y: 0 }}
            exit={{ y: "104%" }}
            transition={{ type: "spring", stiffness: 420, damping: 42 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 500) onClose();
            }}
            className={cx(
              "absolute inset-x-0 bottom-0 flex flex-col rounded-t-[28px] bg-raise hairline overflow-hidden",
              full ? "top-[6%]" : "max-h-[92%]"
            )}
            style={{ boxShadow: "0 -20px 60px rgba(0,0,0,0.5)" }}
          >
            {/* grab zone */}
            <div
              onPointerDown={(e) => controls.start(e)}
              className="shrink-0 pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="mx-auto w-10 h-[5px] rounded-full bg-ink/15" />
              {title && (
                <div className="text-center font-display font-semibold text-[16px] mt-3 px-6">
                  {title}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 scroll-y no-scrollbar">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
