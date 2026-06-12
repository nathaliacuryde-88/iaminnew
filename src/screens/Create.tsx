import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Dices, Link2, PencilLine, Sparkles, Upload, WandSparkles } from "lucide-react";
import type { EventT, Privacy, Vibe } from "../types";
import { ME, PARSE_TEMPLATES, USERS } from "../data";
import { useApp } from "../store";
import { useNav, openEvent } from "../nav";
import { t } from "../i18n";
import { at, cx, uid, VIBES } from "../util";
import { Sheet } from "../components/Sheet";
import { Btn, Chip, Field, inputCls, Seg, Toggle } from "../components/Primitives";
import { Avatar } from "../components/Avatar";
import { Cover } from "../components/Cover";

type Mode = "photo" | "url" | "manual";

interface Draft {
  title: string;
  emoji: string;
  art: number;
  vibe: Vibe;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  city: string;
  description: string;
  privacy: Privacy;
  rsvp: "in" | "maybe";
  bringEnabled: boolean;
  invited: string[];
  coCreators: string[];
  sourceType?: "screenshot" | "url";
  sourceUrl?: string;
}

const toDateInput = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const toTimeInput = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const blankDraft = (): Draft => ({
  title: "",
  emoji: "🎉",
  art: Math.ceil(Math.random() * 40),
  vibe: "party",
  date: toDateInput(at(3, 19)),
  startTime: "19:00",
  endTime: "",
  venue: "",
  city: "Stuttgart",
  description: "",
  privacy: "circle",
  rsvp: "in",
  bringEnabled: false,
  invited: [],
  coCreators: [],
});

const EMOJIS = ["🎉","🪩","🎸","🌀","🎪","🧺","🥐","🍝","🍸","🎂","🛍️","🏃","🎬","🌤️","🎤","📀","🌅","🍻","⚽","🎨","🃏","🎳","🌊","🔥"];

export function CreateSheet() {
  const sheet = useNav((s) => s.sheet);
  const open = sheet?.kind === "create";
  const editId = open && sheet.kind === "create" ? sheet.editId : undefined;

  const lang = useApp((s) => s.lang);
  const appMode = useApp((s) => s.mode);
  const events = useApp((s) => s.events);
  const { closeSheet, toast } = useNav();
  const editing = editId ? events.find((e) => e.id === editId) : undefined;

  const [mode, setMode] = React.useState<Mode>("photo");
  const [draft, setDraft] = React.useState<Draft>(blankDraft);
  const [banner, setBanner] = React.useState<string | null>(null);
  const [queued, setQueued] = React.useState(0);

  // reset state each time the sheet opens
  React.useEffect(() => {
    if (!open) return;
    setBanner(null);
    setQueued(0);
    if (editing) {
      setMode("manual");
      setDraft({
        title: editing.title,
        emoji: editing.emoji,
        art: editing.art,
        vibe: editing.vibe,
        date: toDateInput(editing.start),
        startTime: toTimeInput(editing.start),
        endTime: toTimeInput(editing.end),
        venue: editing.venue ?? "",
        city: editing.city,
        description: editing.description ?? "",
        privacy: editing.privacy,
        rsvp: "in",
        bringEnabled: editing.bringEnabled,
        invited: editing.invited,
        coCreators: editing.coCreators,
        sourceType: editing.sourceType,
        sourceUrl: editing.sourceUrl,
      });
    } else {
      setMode("photo");
      setDraft(blankDraft());
    }
  }, [open, editId]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const applyTemplate = (i: number, source: "screenshot" | "url", url?: string) => {
    const tpl = PARSE_TEMPLATES[i % PARSE_TEMPLATES.length];
    setDraft({
      ...blankDraft(),
      title: tpl.title,
      emoji: tpl.emoji,
      vibe: tpl.vibe,
      venue: tpl.venue,
      description: tpl.description,
      date: toDateInput(at(tpl.days, tpl.hour)),
      startTime: `${String(tpl.hour).padStart(2, "0")}:00`,
      sourceType: source,
      sourceUrl: url ?? `https://instagram.com/p/${uid()}`,
      art: Math.ceil(Math.random() * 40),
    });
    setBanner(
      source === "screenshot" ? "✨ Parsed from your screenshot — check & go" : "✨ Extracted from the link — check & go"
    );
    setMode("manual");
  };

  const create = () => {
    const start = new Date(`${draft.date}T${draft.startTime || "19:00"}`).getTime();
    let end = draft.endTime ? new Date(`${draft.date}T${draft.endTime}`).getTime() : start + 3 * 3600000;
    if (end <= start) end += 24 * 3600000;

    if (editing) {
      useApp.getState().updateEvent(editing.id, {
        title: draft.title,
        emoji: draft.emoji,
        art: draft.art,
        vibe: draft.vibe,
        start,
        end,
        venue: draft.venue || undefined,
        city: draft.city,
        description: draft.description || undefined,
        privacy: draft.privacy,
        bringEnabled: draft.bringEnabled,
        invited: draft.invited,
        coCreators: draft.coCreators,
      });
      closeSheet();
      toast("✅", "Event updated");
      return;
    }

    const e: EventT = {
      id: uid(),
      title: draft.title,
      emoji: draft.emoji,
      art: draft.art,
      vibe: draft.vibe,
      start,
      end,
      venue: draft.venue || undefined,
      city: draft.city,
      description: draft.description || undefined,
      privacy: draft.privacy,
      createdBy: ME,
      coCreators: draft.coCreators,
      sourceType: draft.sourceType,
      sourceUrl: draft.sourceUrl,
      going: draft.rsvp === "in" ? [ME] : [],
      maybe: draft.rsvp === "maybe" ? [ME] : [],
      invited: draft.invited,
      bringEnabled: draft.bringEnabled,
      bring: draft.bringEnabled
        ? [
            { id: uid(), label: "Speaker", emoji: "🔊", claimedBy: null },
            { id: uid(), label: "Snacks", emoji: "🥨", claimedBy: null },
          ]
        : [],
      expenses: [],
      comments: [],
      predictions: [],
      photos: [],
      pacts: [],
      radar: {},
      exitPoll: {},
      weather: { icon: "🌤️", temp: 21, label: "Looking good" },
    };
    useApp.getState().addEvent(e);
    closeSheet();
    toast("🎉", "It's on!", draft.invited.length ? `${draft.invited.length} invites sent` : "Share it with your people");
    setTimeout(() => openEvent(e.id), 250);
    if (queued > 0) {
      setQueued((q) => q - 1);
      setTimeout(() => {
        useNav.getState().openSheet({ kind: "create" });
      }, 600);
    }
  };

  const valid = draft.title.trim().length > 1 && draft.date;

  return (
    <Sheet open={open} onClose={closeSheet} full title={editing ? "Edit event" : t("newEvent", lang)}>
      <div className="px-5 pb-10 pt-2">
        {!editing && (
          <Seg<Mode>
            value={mode}
            onChange={(m) => setMode(m)}
            className="mb-5"
            options={[
              { value: "photo", label: <span className="inline-flex items-center gap-1.5"><Camera size={14} /> {t("photo", lang)}</span> },
              { value: "url", label: <span className="inline-flex items-center gap-1.5"><Link2 size={14} /> {t("url", lang)}</span> },
              { value: "manual", label: <span className="inline-flex items-center gap-1.5"><PencilLine size={14} /> {t("manual", lang)}</span> },
            ]}
          />
        )}

        {mode === "photo" && <PhotoIngest onParsed={applyTemplate} onQueue={setQueued} />}
        {mode === "url" && <UrlIngest onParsed={applyTemplate} />}

        {mode === "manual" && (
          <div className="space-y-5">
            <AnimatePresence>
              {banner && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl px-4 py-3 text-[13px] font-semibold text-accent hairline"
                  style={{ background: "rgba(138,108,255,0.10)" }}
                >
                  {banner}
                </motion.div>
              )}
            </AnimatePresence>

            {/* cover preview */}
            <div className="flex gap-4 items-stretch">
              <Cover
                event={{ emoji: draft.emoji, vibe: draft.vibe, art: draft.art, title: draft.title }}
                className="w-[112px] h-[112px] shrink-0"
                emojiSize={40}
              />
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div className="flex flex-wrap gap-1 max-h-[76px] overflow-y-auto no-scrollbar">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => set({ emoji: e })}
                      className={cx(
                        "w-8 h-8 rounded-lg text-[17px] press",
                        draft.emoji === e ? "bg-accent/20 ring-1 ring-accent" : "bg-card"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => set({ art: Math.ceil(Math.random() * 999) })}
                  className="press self-start mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-dim bg-card hairline rounded-full h-8 px-3"
                >
                  <Dices size={14} /> Shuffle the art
                </button>
              </div>
            </div>

            <Field label={t("eventName", lang) + " *"}>
              <input
                className={inputCls}
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Rooftop sunset drinks"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date *">
                <input type="date" className={inputCls} value={draft.date} onChange={(e) => set({ date: e.target.value })} />
              </Field>
              <Field label="Start">
                <input type="time" className={inputCls} value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="End (opt.)">
                <input type="time" className={inputCls} value={draft.endTime} onChange={(e) => set({ endTime: e.target.value })} />
              </Field>
              <Field label="City *">
                <input className={inputCls} value={draft.city} onChange={(e) => set({ city: e.target.value })} />
              </Field>
            </div>

            <Field label="Venue / address">
              <input
                className={inputCls}
                value={draft.venue}
                onChange={(e) => set({ venue: e.target.value })}
                placeholder="Where's it happening?"
              />
            </Field>

            <Field label="Vibe">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(VIBES) as Vibe[]).map((v) => (
                  <Chip key={v} active={draft.vibe === v} onClick={() => set({ vibe: v })}>
                    {VIBES[v].emoji} {VIBES[v].label}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label={t("description", lang)}>
              <textarea
                rows={4}
                className="w-full rounded-2xl bg-card hairline px-4 py-3 text-[15px] resize-none"
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="What should people know?"
              />
              <div className="flex gap-2 mt-2">
                <AiWriteButton draft={draft} onText={(d) => set({ description: d })} />
              </div>
            </Field>

            <Field label={t("privacy", lang)}>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["circle", "🫂", "Circle", "Only mutual friends see it"],
                    ["list", "🔒", "List", "Only people you invite"],
                    ["public", "🌍", "Public", "On the City Pulse feed"],
                    ["ghost", "👻", "Ghost", "Just you. Pure planning"],
                  ] as Array<[Privacy, string, string, string]>
                ).map(([p, emoji, label, desc]) => {
                  const disabled = appMode === "organizer" && (p === "circle" || p === "ghost");
                  return (
                    <button
                      key={p}
                      disabled={disabled}
                      onClick={() => set({ privacy: p })}
                      className={cx(
                        "press rounded-2xl p-3 text-left hairline",
                        draft.privacy === p ? "bg-accent/14 ring-1 ring-accent" : "bg-card",
                        disabled && "opacity-30 pointer-events-none"
                      )}
                    >
                      <div className="text-lg">{emoji}</div>
                      <div className="text-[13.5px] font-bold mt-1">{label}</div>
                      <div className="text-[11px] text-faint leading-tight mt-0.5">{desc}</div>
                    </button>
                  );
                })}
              </div>
            </Field>

            {draft.privacy !== "ghost" && (
              <>
                <Field label={t("yourRsvp", lang)}>
                  <div className="flex gap-2">
                    <Chip active={draft.rsvp === "in"} onClick={() => set({ rsvp: "in" })}>
                      ✅ {t("imIn", lang)}
                    </Chip>
                    <Chip active={draft.rsvp === "maybe"} onClick={() => set({ rsvp: "maybe" })}>
                      🤔 {t("maybe", lang)}
                    </Chip>
                  </div>
                </Field>

                <div className="flex items-center justify-between rounded-2xl bg-card hairline px-4 py-3.5">
                  <div>
                    <div className="text-[14.5px] font-semibold">📦 “{t("bringWhat", lang)}” list</div>
                    <div className="text-[12px] text-faint mt-0.5">Let people claim snacks, speaker, ball…</div>
                  </div>
                  <Toggle on={draft.bringEnabled} onChange={(v) => set({ bringEnabled: v })} />
                </div>

                <FriendPicker
                  label={t("inviteFriends", lang)}
                  selected={draft.invited}
                  onChange={(invited) => set({ invited })}
                />
                <FriendPicker
                  label={t("coCreators", lang)}
                  selected={draft.coCreators}
                  onChange={(coCreators) => set({ coCreators })}
                />
              </>
            )}

            <Btn size="lg" disabled={!valid} onClick={create}>
              <Sparkles size={17} />
              {editing ? "Save changes" : t("createEvent", lang)}
              {queued > 0 && ` · ${queued} more queued`}
            </Btn>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/* ── AI description writer ── */
function AiWriteButton({ draft, onText }: { draft: Draft; onText: (s: string) => void }) {
  const [busy, setBusy] = React.useState(false);
  const lang = useApp((s) => s.lang);

  const generate = () => {
    setBusy(true);
    const v = VIBES[draft.vibe].label;
    const lines = [
      draft.title
        ? `${draft.title} — the kind of ${v} you'll be talking about all week.`
        : `The kind of ${v} you'll be talking about all week.`,
      draft.venue ? `We're taking over ${draft.venue}.` : `Location locked, vibes loaded.`,
      `Come as you are, bring whoever makes you laugh. ${VIBES[draft.vibe].emoji}`,
    ];
    const full = (draft.description ? draft.description.trim() + "\n\n" : "") + lines.join(" ");
    let i = 0;
    const step = () => {
      i = Math.min(full.length, i + 4);
      onText(full.slice(0, i));
      if (i < full.length) setTimeout(step, 14);
      else setBusy(false);
    };
    setTimeout(step, 350);
  };

  return (
    <button
      onClick={generate}
      disabled={busy}
      className={cx(
        "press inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-bold",
        "bg-gradient-to-r from-accent/20 to-accent2/20 text-accent hairline",
        busy && "opacity-60"
      )}
    >
      <WandSparkles size={14} className={busy ? "animate-pulse" : ""} />
      {busy ? "Writing…" : draft.description ? t("improve", lang) : `✨ ${t("generate", lang)}`}
    </button>
  );
}

/* ── friend multi-select ── */
function FriendPicker({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const following = useApp((s) => s.following);
  const friends = USERS.filter((u) => u.id !== ME && following.includes(u.id));
  return (
    <Field label={`${label} · ${selected.length}`}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
        {friends.map((u) => {
          const on = selected.includes(u.id);
          return (
            <button
              key={u.id}
              onClick={() =>
                onChange(on ? selected.filter((s) => s !== u.id) : [...selected, u.id])
              }
              className={cx("press shrink-0 flex flex-col items-center gap-1.5 w-[62px]")}
            >
              <div className={cx("rounded-full p-0.5", on ? "ring-2 ring-accent" : "")}>
                <Avatar user={u} size={48} />
              </div>
              <span className={cx("text-[10.5px] font-medium truncate w-full text-center", on ? "text-ink" : "text-faint")}>
                {u.name}
              </span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/* ── Photo ingest with fake AI parse ── */
function PhotoIngest({
  onParsed,
  onQueue,
}: {
  onParsed: (tplIndex: number, source: "screenshot") => void;
  onQueue: (n: number) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<string[]>([]);
  const [stage, setStage] = React.useState(0);
  const stages = ["Reading the flyer…", "Found a date & venue 👀", "Drafting your event…"];

  const start = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const urls = Array.from(list).map((f) => URL.createObjectURL(f));
    setFiles(urls);
    onQueue(Math.max(0, urls.length - 1));
    setStage(0);
    setTimeout(() => setStage(1), 900);
    setTimeout(() => setStage(2), 1800);
    setTimeout(() => onParsed(Math.floor(Math.random() * 3), "screenshot"), 2700);
  };

  return (
    <div>
      {files.length === 0 ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="press w-full rounded-3xl border-2 border-dashed border-line/15 bg-raise/50 p-10 flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/12 text-accent flex items-center justify-center mb-4">
            <Upload size={24} />
          </div>
          <div className="font-display font-semibold text-[16px]">Drop screenshots</div>
          <p className="text-[13px] text-faint mt-1.5 max-w-[240px]">
            Each screenshot becomes its own event — flyers, IG stories, posters. We read them all at once.
          </p>
        </button>
      ) : (
        <div className="rounded-3xl bg-raise hairline p-4">
          <div className="flex gap-2 mb-4">
            {files.slice(0, 4).map((src, i) => (
              <div key={i} className="relative w-16 h-20 rounded-xl overflow-hidden hairline">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 shimmer opacity-50" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent"
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={stage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-[14px] font-semibold text-ink"
              >
                {stages[stage]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => start(e.target.files)}
      />
      <p className="text-center text-[11.5px] text-faint mt-4">
        Vision AI · screenshots stay on your device in this demo
      </p>
    </div>
  );
}

/* ── URL ingest ── */
function UrlIngest({ onParsed }: { onParsed: (tplIndex: number, source: "url", url: string) => void }) {
  const [url, setUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const extract = () => {
    if (!url.trim()) return;
    setBusy(true);
    setTimeout(() => {
      const i = url.includes("ra.co") ? 1 : url.includes("markt") ? 2 : Math.floor(Math.random() * 3);
      onParsed(i, "url", url.trim());
    }, 1800);
  };

  return (
    <div className="rounded-3xl bg-raise hairline p-5">
      <div className="w-12 h-12 rounded-2xl bg-accent/12 text-accent flex items-center justify-center mb-4">
        <Link2 size={20} />
      </div>
      <input
        className={inputCls}
        placeholder="Paste event URL (Eventbrite, RA, Insta…)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        inputMode="url"
      />
      <Btn className="w-full mt-3" size="lg" disabled={!url.trim() || busy} onClick={extract}>
        {busy ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2 border-white border-t-transparent"
            />
            Reading the page…
          </>
        ) : (
          <>
            <Sparkles size={16} /> Extract event details
          </>
        )}
      </Btn>
    </div>
  );
}
