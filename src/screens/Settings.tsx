import React from "react";
import {
  Banknote,
  Bell,
  Globe,
  LogOut,
  Moon,
  RefreshCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import { useApp } from "../store";
import { useNav } from "../nav";
import { t } from "../i18n";
import { StackScreen } from "../components/StackScreen";
import { Field, Row, Seg, Toggle, inputCls, Btn } from "../components/Primitives";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint px-2 mb-1.5">
        {title}
      </div>
      <div className="rounded-3xl bg-raise hairline divide-y divide-line/[0.06] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const s = useApp();
  const { toast, popAll } = useNav();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [notifPrefs, setNotifPrefs] = React.useState({ pulse: true, door: true, capsule: true });

  return (
    <StackScreen title={t("settings", s.lang)}>
      <div className="px-4 pt-4 pb-16 space-y-5">
        <Group title={t("appearance", s.lang)}>
          <Row
            icon={<Moon size={17} />}
            label={t("darkMode", s.lang)}
            right={<Toggle on={s.theme === "dark"} onChange={(v) => s.setTheme(v ? "dark" : "light")} />}
          />
          <Row
            icon={<Globe size={17} />}
            label={t("language", s.lang)}
            right={
              <Seg
                className="w-[140px]"
                value={s.lang}
                onChange={(l) => s.setLang(l)}
                options={[
                  { value: "en", label: "EN" },
                  { value: "de", label: "DE" },
                ]}
              />
            }
          />
        </Group>

        <Group title={t("mode", s.lang)}>
          <div className="px-4 py-3.5">
            <Seg
              value={s.mode}
              onChange={(m) => {
                s.setMode(m);
                toast(m === "organizer" ? "🏛️" : "🙋", `Switched to ${m} mode`);
              }}
              options={[
                { value: "person", label: `🙋 ${t("person", s.lang)}` },
                { value: "organizer", label: `🏛️ ${t("organizer", s.lang)}` },
              ]}
            />
            <p className="text-[12px] text-faint mt-2.5 leading-relaxed">
              {s.mode === "organizer"
                ? "Verified badge, feed priority, event analytics, exit-poll reachback and a venue DNA."
                : "Go to events with friends, save plans, split tabs, share photo capsules."}
            </p>
            {s.mode === "organizer" && (
              <div className="space-y-3 mt-3">
                <Field label="Organizer name">
                  <input
                    className={inputCls}
                    value={s.me.orgName}
                    onChange={(e) => s.updateMe({ orgName: e.target.value })}
                    placeholder="Your brand or venue name"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Instagram">
                    <input
                      className={inputCls}
                      value={s.me.orgInstagram}
                      onChange={(e) => s.updateMe({ orgInstagram: e.target.value })}
                      placeholder="@yourbrand"
                    />
                  </Field>
                  <Field label="Website">
                    <input
                      className={inputCls}
                      value={s.me.orgWebsite}
                      onChange={(e) => s.updateMe({ orgWebsite: e.target.value })}
                      placeholder="https://…"
                    />
                  </Field>
                </div>
                <Btn
                  variant={s.me.stripeConnected ? "soft" : "primary"}
                  onClick={() => {
                    s.updateMe({ stripeConnected: !s.me.stripeConnected });
                    toast("💳", s.me.stripeConnected ? "Stripe disconnected" : "Stripe connected (test)", "Ticket sales ready");
                  }}
                >
                  💳 {s.me.stripeConnected ? "Stripe connected ✓" : "Connect Stripe for payments"}
                </Btn>
              </div>
            )}
          </div>
        </Group>

        <Group title={t("payments", s.lang)}>
          <div className="px-4 py-3.5 space-y-3">
            <p className="text-[12px] text-faint leading-relaxed -mt-1">
              Add your handles so friends can settle Tabs in one tap.
            </p>
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
                  value={s.me[key]}
                  onChange={(e) => s.updateMe({ [key]: e.target.value })}
                  placeholder={ph}
                />
              </Field>
            ))}
          </div>
        </Group>

        <Group title={t("notifications", s.lang)}>
          {(
            [
              ["pulse", "📣 Pulses & pacts"],
              ["door", "🚪 Door & line alerts"],
              ["capsule", "🎞️ Capsule unlocks"],
            ] as const
          ).map(([k, label]) => (
            <Row
              key={k}
              icon={<Bell size={16} />}
              label={label}
              right={
                <Toggle
                  on={notifPrefs[k]}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, [k]: v }))}
                />
              }
            />
          ))}
        </Group>

        <Group title="Demo">
          <Row
            icon={<RefreshCcw size={16} />}
            label="Refresh demo timeline"
            sub="Re-seeds events around today — there's always a live one"
            onClick={() => {
              s.reseed();
              toast("🔄", "Demo data refreshed");
            }}
          />
        </Group>

        <Group title="Account">
          <Row
            icon={<UserRound size={16} />}
            label={`@${s.me.handle}`}
            sub="Signed in · Stuttgart"
          />
          <Row
            icon={<LogOut size={16} />}
            label={t("logout", s.lang)}
            onClick={() => {
              popAll();
              useApp.setState({ onboarded: false });
            }}
          />
          <Row
            icon={<Trash2 size={16} />}
            label={confirmDelete ? "Tap again to confirm — wipes everything" : t("deleteAccount", s.lang)}
            danger
            onClick={() => {
              if (!confirmDelete) setConfirmDelete(true);
              else s.resetAll();
            }}
          />
        </Group>

        <p className="text-center text-[11px] text-faint pt-2">
          I am (IN) 2.0 · made with 💜 in Stuttgart
        </p>
      </div>
    </StackScreen>
  );
}
