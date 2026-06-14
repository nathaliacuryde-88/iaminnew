import React from "react";
import { motion } from "framer-motion";
import { Flag, ImagePlus, Lock, Receipt, Sparkles } from "lucide-react";
import { useApp, userById } from "../store";
import { useNav } from "../nav";
import { ME } from "../data";
import { t } from "../i18n";
import { ago, countdown, cx, fmtDay, uid } from "../util";
import type { CapsulePhoto, EventT, Spark, User } from "../types";
import { PhotoTile, Cover, CoverThumb } from "../components/Cover";
import { Avatar, Facepile } from "../components/Avatar";
import { StackScreen } from "../components/StackScreen";
import { Btn, Section } from "../components/Primitives";

const attended = (e: EventT) => e.going.includes(ME) || e.createdBy === ME;

/* ════════ Capsules tab ════════ */
export function CapsuleScreen() {
  const lang = useApp((s) => s.lang);
  const events = useApp((s) => s.events);
  const push = useNav((s) => s.push);

  const unlocked = events
    .filter((e) => e.end < Date.now() && attended(e))
    .sort((a, b) => b.start - a.start);
  const sealed = events
    .filter((e) => e.end >= Date.now() && attended(e) && e.privacy !== "ghost")
    .sort((a, b) => a.start - b.start);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 px-5 pb-3" style={{ paddingTop: "max(18px, env(safe-area-inset-top))" }}>
        <h1 className="font-display font-bold text-[24px] tracking-tight">{t("capsule", lang)}</h1>
        <p className="text-[13px] text-faint mt-0.5">
          {lang === "de" ? "Geteilte Erinnerungen, pro Nacht." : "Shared memories, one per night."}
        </p>
      </div>

      <div className="flex-1 min-h-0 scroll-y no-scrollbar px-4 pb-32 space-y-3.5">
        {unlocked.map((e) => (
          <CapsuleCard key={e.id} event={e} onOpen={() => push({ kind: "capsule", id: e.id })} />
        ))}

        {sealed.length > 0 && (
          <>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-1 pt-2">
              {lang === "de" ? "Noch versiegelt" : "Still sealed"}
            </div>
            {sealed.map((e) => (
              <div key={e.id} className="rounded-3xl bg-raise hairline p-4 flex items-center gap-3.5 opacity-80">
                <CoverThumb event={e} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-semibold truncate">{e.title}</div>
                  <div className="text-[12px] text-faint flex items-center gap-1 mt-0.5">
                    <Lock size={11} /> {t("unlocks", lang)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display font-bold text-[15px] text-accent">{countdown(e.end)}</div>
                  {e.predictions.length > 0 && (
                    <div className="text-[11px] text-faint">🔮 {e.predictions.length} {t("sealed", lang)}</div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function CapsuleCard({ event, onOpen }: { event: EventT; onOpen: () => void }) {
  const lang = useApp((s) => s.lang);
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="press w-full rounded-[26px] bg-raise hairline p-4 text-left"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-display font-bold text-[18px] tracking-tight truncate">{event.title}</h2>
        <span className="text-[12px] text-faint shrink-0 ml-3">{fmtDay(event.start, lang)}</span>
      </div>

      {event.photos.length > 0 ? (
        <div className="relative h-[150px] mt-3">
          {event.photos.slice(0, 3).map((p, i) => (
            <div
              key={p.id}
              className="absolute w-[118px] h-[130px] rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
              style={{
                left: `${8 + i * 26}%`,
                top: i === 1 ? 0 : 10,
                transform: `rotate(${i === 0 ? -7 : i === 1 ? 3 : 9}deg)`,
                zIndex: i,
              }}
            >
              <PhotoTile seed={p.seed} emoji={p.emoji} src={p.src} className="w-full h-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-card/60 hairline h-[96px] flex flex-col items-center justify-center text-faint">
          <ImagePlus size={20} />
          <span className="text-[12.5px] mt-1.5">{t("noPhotos", lang)} — {lang === "de" ? "füge das erste hinzu" : "add the first"}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-[12.5px] text-faint">
          {event.photos.length} photos · 🔮 {event.predictions.length} · {event.going.length} people
        </span>
        <span className="text-accent text-[13px] font-bold">{lang === "de" ? "Öffnen" : "Open"} →</span>
      </div>
    </motion.button>
  );
}

/* ════════ Capsule detail (pushed) ════════ */
export function CapsuleDetailScreen({ id }: { id: string }) {
  const event = useApp((s) => s.events.find((e) => e.id === id));
  const lang = useApp((s) => s.lang);
  const addPhotos = useApp((s) => s.addPhotos);
  const toast = useNav((s) => s.toast);
  const openSheet = useNav((s) => s.openSheet);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = React.useState<CapsulePhoto | null>(null);

  if (!event) return null;
  const ended = event.end < Date.now();
  const going = event.going.map(userById).filter(Boolean);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list).slice(0, 8);
    Promise.all(
      files.map(
        (f) =>
          new Promise<CapsulePhoto>((res) => {
            const r = new FileReader();
            r.onload = () => res({ id: uid(), by: ME, seed: 1, emoji: "📷", src: String(r.result) });
            r.readAsDataURL(f);
          })
      )
    ).then((photos) => {
      addPhotos(event.id, photos);
      toast("🎞️", `${photos.length} added to the capsule`, "Everyone from the night can see them");
    });
  };

  return (
    <StackScreen title={event.title}>
      <div className="px-4 pt-4 pb-16 space-y-3.5">
        {/* hero strip */}
        <div className="rounded-3xl bg-raise hairline p-4 flex items-center gap-3.5">
          <CoverThumb event={event} size={56} />
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[16px] truncate">{event.title}</div>
            <div className="text-[12.5px] text-faint">{fmtDay(event.start, lang)} · {event.venue}</div>
          </div>
          <Facepile users={going} size={24} max={3} />
        </div>

        {/* morning-after receipt */}
        {ended && (
          <Btn variant="soft" className="w-full" onClick={() => openSheet({ kind: "nightReceipt", eventId: event.id })}>
            <Receipt size={16} /> {lang === "de" ? "Quittung vom Morgen danach" : "Morning-after receipt"}
          </Btn>
        )}

        {/* sparks — across the room (public venue nights) */}
        {event.privacy === "public" && <SparksSection event={event} />}

        {/* predictions */}
        {event.predictions.length > 0 && (
          <Section
            icon={<span className="text-base">🔮</span>}
            title={ended ? t("revealed", lang) : t("sealedNote", lang)}
            aside={!ended ? <Lock size={13} className="text-gold" /> : undefined}
          >
            <div className="space-y-2">
              {event.predictions.map((p, i) => {
                const u = userById(p.by);
                return ended ? (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, rotateX: 90 }}
                    animate={{ opacity: 1, rotateX: 0 }}
                    transition={{ delay: i * 0.12, type: "spring", stiffness: 200, damping: 20 }}
                    className="rounded-2xl bg-card hairline p-3.5"
                  >
                    <p className="text-[14px] leading-snug">“{p.text}”</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11.5px] text-faint">
                      <Avatar user={u} size={18} /> {u?.id === ME ? "you" : u?.name} · {lang === "de" ? "versiegelt vor dem Event" : "sealed before the night"}
                    </div>
                  </motion.div>
                ) : (
                  <div key={p.id} className="rounded-2xl bg-card/60 hairline p-3.5 flex items-center gap-2 text-faint">
                    <Lock size={13} className="text-gold shrink-0" />
                    <span className="text-[13px]">{u?.id === ME ? "Your prediction" : `${u?.name}'s prediction`} — {t("unlocks", lang).toLowerCase()}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* photos */}
        <Section
          icon={<span className="text-base">🎞️</span>}
          title={`Photos (${event.photos.length})`}
          aside={
            <button onClick={() => fileRef.current?.click()} className="press text-[12.5px] font-bold text-accent inline-flex items-center gap-1">
              <ImagePlus size={14} /> {t("addPhotos", lang)}
            </button>
          }
        >
          {event.photos.length === 0 ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="press w-full rounded-2xl border-2 border-dashed border-line/15 p-8 flex flex-col items-center text-faint"
            >
              <ImagePlus size={22} />
              <span className="text-[13px] mt-2">{t("noPhotos", lang)} — {lang === "de" ? "sei der Anfang" : "be the first"}</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {event.photos.map((p) => (
                <button key={p.id} onClick={() => setZoom(p)} className="press">
                  <PhotoTile seed={p.seed} emoji={p.emoji} src={p.src} className="aspect-square w-full" />
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Btn
              variant="soft"
              size="sm"
              onClick={() => {
                const emojis = ["🥂", "💃", "🌃", "😂", "🫶", "🎶"];
                addPhotos(
                  event.id,
                  Array.from({ length: 3 }, (_, i) => ({
                    id: uid(),
                    by: ME,
                    seed: Math.ceil(Math.random() * 99),
                    emoji: emojis[Math.floor(Math.random() * emojis.length)],
                  }))
                );
                toast("✨", "Demo shots added", "In the real app these come from your camera roll");
              }}
            >
              <Sparkles size={13} /> {lang === "de" ? "Demo-Fotos" : "Add demo shots"}
            </Btn>
          </div>
        </Section>

        {/* poll snapshot */}
        {ended && Object.keys(event.exitPoll).length > 0 && (
          <div className="rounded-3xl bg-raise hairline p-4 flex items-center justify-between">
            <div className="text-[13.5px] text-dim">
              {t("exitPoll", lang)} · {Object.keys(event.exitPoll).length} votes
            </div>
            <div className="flex gap-2 text-[15px]">
              {(["fire", "mid", "dead"] as const).map((v) => {
                const c = Object.values(event.exitPoll).filter((x) => x === v).length;
                return c > 0 ? (
                  <span key={v} className="bg-card hairline rounded-full px-2.5 h-7 inline-flex items-center gap-1 text-[13px] font-bold">
                    {v === "fire" ? "🔥" : v === "mid" ? "😐" : "💀"} {c}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />

      {/* lightbox */}
      {zoom && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setZoom(null)}
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(5,5,9,0.88)", backdropFilter: "blur(8px)" }}
        >
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="w-full max-w-[340px]">
            <PhotoTile seed={zoom.seed} emoji={zoom.emoji} src={zoom.src} className="w-full aspect-square rounded-3xl" />
            <div className="text-center text-[12.5px] text-dim mt-3">
              by {userById(zoom.by)?.id === ME ? "you" : userById(zoom.by)?.name} · {event.title}
            </div>
          </motion.div>
        </motion.button>
      )}
    </StackScreen>
  );
}

/* ════════ Sparks — "across the room" missed connections ════════ */
const SPARK_BG = "linear-gradient(135deg, rgba(138,108,255,0.16), rgba(255,106,194,0.10)), rgb(var(--c-raise))";

function SparksSection({ event }: { event: EventT }) {
  const lang = useApp((s) => s.lang);
  const allSparks = useApp((s) => s.sparks);
  const sparks = allSparks.filter((sp) => sp.eventId === event.id && sp.status !== "passed");
  const openSheet = useNav((s) => s.openSheet);

  return (
    <Section
      icon={<span className="text-base">✨</span>}
      title={lang === "de" ? "Quer durch den Raum" : "Across the room"}
      aside={sparks.length > 0 ? <span className="text-[12px] text-faint">{sparks.length}</span> : undefined}
    >
      <p className="text-[12.5px] text-dim mb-3">
        {lang === "de"
          ? "Jemanden gesehen, aber verpasst? Poste es — nur Leute von diesem Abend sehen es. Anonym, bis ihr beide Ja sagt."
          : "See someone you didn't get to talk to? Post it — only people who were here see it. Anonymous until you both say yes."}
      </p>
      <div className="space-y-2">
        {sparks.map((sp) => (
          <SparkCard key={sp.id} spark={sp} eventTitle={event.title} />
        ))}
      </div>
      <Btn variant="soft" className="w-full mt-3" onClick={() => openSheet({ kind: "spark", eventId: event.id })}>
        <Sparkles size={15} className="text-accent" /> {lang === "de" ? "Spark posten" : "Post a spark"}
      </Btn>
    </Section>
  );
}

function SparkCard({ spark, eventTitle }: { spark: Spark; eventTitle: string }) {
  const lang = useApp((s) => s.lang);
  const claimSpark = useApp((s) => s.claimSpark);
  const respondSpark = useApp((s) => s.respondSpark);
  const addNotif = useApp((s) => s.addNotif);
  const toast = useNav((s) => s.toast);

  const mine = spark.by === ME;
  const claimedByMe = spark.claimedBy === ME;

  if (spark.status === "matched") {
    const other = userById(spark.by === ME ? spark.claimedBy! : spark.by);
    return <MatchReveal other={other} spark={spark} />;
  }

  // poster sees a claim → connect or not
  if (mine && spark.status === "claimed") {
    return (
      <div className="rounded-2xl hairline p-3.5" style={{ background: SPARK_BG }}>
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent mb-1">Your spark · someone bit 👀</div>
        <p className="text-[13.5px] leading-snug">“{spark.text}”</p>
        <div className="text-[12px] text-faint mt-2">An attendee thinks that's them. Want to connect?</div>
        <div className="flex gap-2 mt-2.5">
          <Btn size="sm" variant="soft" className="flex-1" onClick={() => { respondSpark(spark.id, false); toast("🫧", "No worries", "They're never told."); }}>
            Not this time
          </Btn>
          <Btn
            size="sm"
            className="flex-1"
            onClick={() => {
              respondSpark(spark.id, true);
              const u = userById(spark.claimedBy!);
              toast("✨", "It's a spark!", `You and ${u?.name} are connected`);
              addNotif({ kind: "spark", text: `You and ${u?.name} connected from ${eventTitle} ✨`, userId: spark.claimedBy });
            }}
          >
            Connect ✨
          </Btn>
        </div>
      </div>
    );
  }

  // I claimed someone's spark, waiting for them
  if (claimedByMe && spark.status === "claimed") {
    return (
      <div className="rounded-2xl bg-card/60 hairline p-3.5">
        <p className="text-[13.5px] leading-snug text-dim">“{spark.text}”</p>
        <div className="text-[12px] text-faint mt-2">⏳ You said this might be you — waiting for them to say yes…</div>
      </div>
    );
  }

  // my own spark, still live
  if (mine) {
    return (
      <div className="rounded-2xl bg-card hairline p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint mb-1">Your spark · live</div>
        <p className="text-[13.5px] leading-snug">“{spark.text}”</p>
        {spark.where && <div className="text-[11.5px] text-faint mt-1">📍 {spark.where}</div>}
        <div className="text-[11.5px] text-faint mt-2">You'll show as: {spark.selfHint}</div>
      </div>
    );
  }

  // someone else's open spark → claim or report
  return (
    <div className="rounded-2xl bg-card hairline p-3.5">
      <p className="text-[13.5px] leading-snug">“{spark.text}”</p>
      <div className="text-[11.5px] text-faint mt-1.5">
        {spark.where && <>📍 {spark.where} · </>}🕯️ anonymous · {ago(spark.ts, lang)}
      </div>
      <div className="text-[11.5px] text-faint mt-1">
        They'll know you by: <span className="text-dim">{spark.selfHint}</span>
      </div>
      <div className="flex gap-2 mt-2.5">
        <Btn
          size="sm"
          variant="soft"
          className="flex-1"
          onClick={() => {
            claimSpark(spark.id);
            toast("👀", "Sent anonymously", "If they say yes, you both reveal");
            setTimeout(() => {
              respondSpark(spark.id, true);
              const u = userById(spark.by);
              toast("✨", "It's a spark!", `You and ${u?.name} matched`);
              addNotif({ kind: "spark", text: `You matched with ${u?.name} from ${eventTitle} ✨`, userId: spark.by });
            }, 4500);
          }}
        >
          👀 This might be me
        </Btn>
        <button
          onClick={() => toast("🛡️", "Reported", "Thanks — we'll take a look")}
          className="press w-9 h-9 rounded-full bg-card hairline flex items-center justify-center text-faint shrink-0"
          aria-label="Report"
        >
          <Flag size={14} />
        </button>
      </div>
    </div>
  );
}

function MatchReveal({ other, spark }: { other?: User; spark: Spark }) {
  const toast = useNav((s) => s.toast);
  const opener = spark.where ? `${spark.where} — finally 👋` : "okay, that was a sign 👋";
  return (
    <motion.div
      initial={{ opacity: 0, rotateX: 90 }}
      animate={{ opacity: 1, rotateX: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="rounded-2xl hairline p-4 text-center"
      style={{ background: SPARK_BG }}
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">✨ It's a spark</div>
      <div className="flex items-center justify-center gap-3 my-3">
        <Avatar user={userById(ME)} size={46} />
        <span className="text-xl">✨</span>
        <Avatar user={other} size={46} />
      </div>
      <div className="font-display font-bold text-[16px]">You &amp; {other?.name}</div>
      <div className="text-[11.5px] text-faint mt-0.5">
        You're now following each other{other && other.mutuals > 0 ? ` · ${other.mutuals} mutual friends` : ""}
      </div>
      <div className="mt-3 rounded-xl bg-card/70 hairline p-2.5 text-[12.5px] text-dim">
        Opener: “{opener}”
      </div>
      <Btn size="sm" className="mt-3" onClick={() => toast("👋", "Wave sent", other?.name)}>
        Wave 👋
      </Btn>
    </motion.div>
  );
}
