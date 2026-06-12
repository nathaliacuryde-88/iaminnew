import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useApp, type MeProfile } from "../store";
import { Btn, Field, inputCls } from "../components/Primitives";
import { cx } from "../util";

type Step = "welcome" | "mode" | "p1" | "p2" | "p3" | "o1" | "o2" | "o3";

const SLIDES = [
  {
    emoji: "📲",
    title: "Before",
    text: "Screenshot a flyer, paste a link, or start from scratch — AI turns it into a plan your friends can join in one tap.",
  },
  {
    emoji: "📍",
    title: "During",
    text: "Live radar shows who's there or on the way. Line mode tells you when the door clears. Tabs split the costs.",
  },
  {
    emoji: "🎞️",
    title: "After",
    text: "Photos land in a shared capsule, sealed predictions get revealed, and the exit poll settles how good it really was.",
  },
];

export function Onboarding() {
  const completeOnboarding = useApp((s) => s.completeOnboarding);
  const me = useApp((s) => s.me);
  const [step, setStep] = React.useState<Step>("welcome");
  const [slide, setSlide] = React.useState(0);
  const [form, setForm] = React.useState<Partial<MeProfile>>({
    name: me.name,
    handle: me.handle,
    birthday: me.birthday,
    paypal: "",
    revolut: "",
    iban: "",
    orgName: "",
    orgInstagram: "",
    orgWebsite: "",
  });

  const back: Partial<Record<Step, Step>> = {
    mode: "welcome",
    p1: "mode",
    p2: "p1",
    p3: "p2",
    o1: "mode",
    o2: "o1",
    o3: "o2",
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-bg">
      {/* ambient orbs */}
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30 float-y" style={{ background: "radial-gradient(circle,#8A6CFF,transparent 70%)" }} />
      <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle,#FF6A8E,transparent 70%)" }} />

      {back[step] && (
        <button
          onClick={() => setStep(back[step]!)}
          className="absolute left-4 z-20 press w-10 h-10 rounded-full glass hairline flex items-center justify-center"
          style={{ top: "max(16px, env(safe-area-inset-top))" }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <AnimatePresence mode="popLayout">
        {step === "welcome" && (
          <Wrap key="welcome">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.h1
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="font-display font-bold text-[44px] tracking-tight"
              >
                I am{" "}
                <span className="text-accent">
                  (IN<span className="text-accent2">)</span>
                </span>
              </motion.h1>
              <p className="text-dim text-[15px] mt-2">The whole night. One app.</p>

              {/* value slides */}
              <div className="w-full mt-10 relative h-[190px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(_, i) => {
                      if (i.offset.x < -50) setSlide((slide + 1) % 3);
                      else if (i.offset.x > 50) setSlide((slide + 2) % 3);
                    }}
                    className="absolute inset-0 rounded-[28px] bg-raise hairline p-6 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing"
                  >
                    <div className="text-4xl mb-3">{SLIDES[slide].emoji}</div>
                    <div className="font-display font-bold text-[12px] uppercase tracking-[0.22em] text-accent">
                      {SLIDES[slide].title}
                    </div>
                    <p className="text-[13.5px] text-dim leading-relaxed mt-2 max-w-[280px]">
                      {SLIDES[slide].text}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex gap-1.5 mt-4">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={cx("h-1.5 rounded-full transition-all", i === slide ? "w-5 bg-accent" : "w-1.5 bg-faint/40")}
                  />
                ))}
              </div>
            </div>
            <Btn size="lg" onClick={() => setStep("mode")}>
              Get started
            </Btn>
          </Wrap>
        )}

        {step === "mode" && (
          <Wrap key="mode">
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="font-display font-bold text-[26px] tracking-tight text-center">
                How will you use it?
              </h2>
              <p className="text-faint text-[13.5px] text-center mt-1 mb-8">You can switch anytime in settings.</p>
              {(
                [
                  ["p1", "🙋", "Person", "Go to events with friends, split tabs, share photo capsules."],
                  ["o1", "🏛️", "Organizer", "Create events for crowds, sell tickets, get analytics and a verified badge."],
                ] as const
              ).map(([next, emoji, label, desc]) => (
                <button
                  key={label}
                  onClick={() => setStep(next)}
                  className="press w-full rounded-3xl bg-raise hairline p-5 flex items-center gap-4 text-left mb-3"
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="flex-1">
                    <span className="block font-display font-bold text-[17px]">{label}</span>
                    <span className="block text-[12.5px] text-faint mt-1 leading-snug">{desc}</span>
                  </span>
                  <span className="text-faint">→</span>
                </button>
              ))}
            </div>
          </Wrap>
        )}

        {step === "p1" && (
          <Wrap key="p1">
            <StepShell
              emoji="🎂"
              title="When's your birthday?"
              sub="Friends get it on their calendar automatically — no more forgetting."
              cta="Continue"
              onNext={() => setStep("p2")}
              skip={() => setStep("p2")}
            >
              <input
                type="date"
                className={inputCls}
                value={form.birthday}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
              />
            </StepShell>
          </Wrap>
        )}

        {step === "p2" && (
          <Wrap key="p2">
            <StepShell
              emoji="👋"
              title="What should we call you?"
              sub="This is the name friends see on your profile and events."
              cta="Continue"
              disabled={!form.name?.trim()}
              onNext={() => setStep("p3")}
            >
              <div className="space-y-3">
                <input
                  className={inputCls}
                  placeholder="Display name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="@handle"
                  value={form.handle}
                  onChange={(e) => setForm({ ...form, handle: e.target.value.replace(/[@\s]/g, "") })}
                />
              </div>
            </StepShell>
          </Wrap>
        )}

        {step === "p3" && (
          <Wrap key="p3">
            <StepShell
              emoji="🌼"
              title="Get paid back, friction-free"
              sub="Add your handles so friends can settle a Tab in one tap. All optional."
              cta="Let's go 🎉"
              onNext={() => completeOnboarding("person", form)}
              skip={() => completeOnboarding("person", { ...form, paypal: "", revolut: "", iban: "" })}
            >
              <div className="space-y-3">
                {(
                  [
                    ["paypal", "PayPal", "@yourname"],
                    ["revolut", "Revolut", "@yourname"],
                    ["iban", "IBAN", "DE00 0000…"],
                  ] as const
                ).map(([key, label, ph]) => (
                  <Field key={key} label={label}>
                    <input
                      className={inputCls}
                      placeholder={ph}
                      value={(form[key] as string) ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </Field>
                ))}
              </div>
            </StepShell>
          </Wrap>
        )}

        {step === "o1" && (
          <Wrap key="o1">
            <StepShell
              emoji="👋"
              title="What's your organizer name?"
              sub="The brand or venue name that appears on your events."
              cta="Continue"
              disabled={!form.orgName?.trim()}
              onNext={() => setStep("o2")}
            >
              <input
                className={inputCls}
                placeholder="e.g. Im Wizemann"
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              />
            </StepShell>
          </Wrap>
        )}

        {step === "o2" && (
          <Wrap key="o2">
            <StepShell
              emoji="🔗"
              title="Where can people find you?"
              sub="Your Instagram and website show up on your organizer profile."
              cta="Continue"
              onNext={() => setStep("o3")}
              skip={() => setStep("o3")}
            >
              <div className="space-y-3">
                <input
                  className={inputCls}
                  placeholder="@ your.brand"
                  value={form.orgInstagram}
                  onChange={(e) => setForm({ ...form, orgInstagram: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="https://yoursite.com"
                  value={form.orgWebsite}
                  onChange={(e) => setForm({ ...form, orgWebsite: e.target.value })}
                />
              </div>
            </StepShell>
          </Wrap>
        )}

        {step === "o3" && (
          <Wrap key="o3">
            <StepShell
              emoji="💳"
              title="Connect Stripe for payments"
              sub="Sell tickets and accept payments directly from your events. You can do this later from settings."
              cta="Connect Stripe"
              onNext={() => completeOnboarding("organizer", { ...form, stripeConnected: true })}
              skip={() => completeOnboarding("organizer", form)}
            >
              <div className="rounded-3xl bg-raise hairline p-5 text-center">
                <div className="text-3xl mb-2">🎟️</div>
                <p className="text-[13px] text-dim leading-relaxed">
                  Ticket sales with a small % cut · payouts to your bank · door scanning included.
                </p>
              </div>
            </StepShell>
          </Wrap>
        )}
      </AnimatePresence>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      className="absolute inset-0 flex flex-col px-6"
      style={{
        paddingTop: "max(24px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      {children}
    </motion.div>
  );
}

function StepShell({
  emoji,
  title,
  sub,
  children,
  cta,
  onNext,
  skip,
  disabled,
}: {
  emoji: string;
  title: string;
  sub: string;
  children: React.ReactNode;
  cta: string;
  onNext: () => void;
  skip?: () => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-4xl text-center mb-4">{emoji}</div>
        <h2 className="font-display font-bold text-[24px] tracking-tight text-center text-balance">{title}</h2>
        <p className="text-faint text-[13.5px] text-center mt-2 mb-8 leading-relaxed max-w-[300px] mx-auto">{sub}</p>
        {children}
      </div>
      <div className="space-y-2">
        <Btn size="lg" onClick={onNext} disabled={disabled}>
          {cta}
        </Btn>
        {skip && (
          <button onClick={skip} className="press w-full text-center text-[13.5px] text-faint py-2.5">
            Skip for now
          </button>
        )}
      </div>
    </>
  );
}
