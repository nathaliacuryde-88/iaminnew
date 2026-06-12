import React from "react";
import { UserRoundPlus } from "lucide-react";
import { useApp } from "../store";
import { openPerson } from "../nav";
import { ME, USERS } from "../data";
import { t } from "../i18n";
import { Avatar } from "../components/Avatar";
import { StackScreen } from "../components/StackScreen";
import { Btn, inputCls } from "../components/Primitives";

export function PeopleScreen() {
  const lang = useApp((s) => s.lang);
  const following = useApp((s) => s.following);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const [q, setQ] = React.useState("");

  const list = USERS.filter(
    (u) =>
      u.id !== ME &&
      (q.trim() === "" ||
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.handle.toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => Number(following.includes(a.id)) - Number(following.includes(b.id)) || b.mutuals - a.mutuals);

  return (
    <StackScreen title={t("peopleYouMayKnow", lang)}>
      <div className="px-4 pt-4 pb-16">
        <input
          className={inputCls}
          placeholder={t("search", lang) + "…"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="mt-3 space-y-2">
          {list.map((u) => {
            const isF = following.includes(u.id);
            return (
              <div
                key={u.id}
                onClick={() => openPerson(u.id)}
                className="press flex items-center gap-3 rounded-3xl bg-raise hairline p-3 cursor-pointer"
              >
                <Avatar user={u} size={46} mood />
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-semibold truncate">
                    {u.name}
                    {u.verified && <span className="text-accent"> ✓</span>}
                  </div>
                  <div className="text-[12px] text-faint">
                    {u.mutuals > 0 && (
                      <>
                        {u.mutuals} {u.mutuals === 1 ? t("mutual", lang) : t("mutuals", lang)} ·{" "}
                      </>
                    )}
                    {u.city}
                    {u.organizer && " · organizer"}
                  </div>
                </div>
                <Btn
                  size="sm"
                  variant={isF ? "soft" : "primary"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow(u.id);
                  }}
                >
                  {isF ? t("following", lang) : (
                    <>
                      <UserRoundPlus size={13} /> {t("follow", lang)}
                    </>
                  )}
                </Btn>
              </div>
            );
          })}
        </div>
      </div>
    </StackScreen>
  );
}
