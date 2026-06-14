// @vitest-environment jsdom
import { describe, expect, it, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import React from "react";
import App from "./App";
import { useApp } from "./store";
import { useNav } from "./nav";

beforeAll(() => {
  // jsdom misses a few browser APIs framer-motion / app code touch
  window.scrollTo = vi.fn();
  Element.prototype.scrollTo = vi.fn() as never;
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
  window.matchMedia =
    window.matchMedia ||
    ((q: string) =>
      ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), onchange: null, dispatchEvent: vi.fn() }) as never);
});

describe("I am (IN) smoke", () => {
  it("onboards, then renders every tab and key screens without crashing", async () => {
    render(<App />);

    // ── onboarding: welcome → mode → person steps
    // AnimatePresence keeps exiting steps mounted briefly — click the newest match
    const clickLast = async (re: RegExp) => {
      const els = await screen.findAllByText(re);
      fireEvent.click(els[els.length - 1]);
    };
    await clickLast(/Get started/);
    await clickLast(/^Person$/);
    await clickLast(/Continue/); // birthday
    await clickLast(/Continue/); // name
    await clickLast(/Let's go 🎉/);

    // feed
    expect(useApp.getState().onboarded).toBe(true);
    expect(await screen.findByText("Inner Circle")).toBeTruthy();
    expect(screen.getAllByText(/VORSICHT DRAUFSICHT/).length).toBeGreaterThan(0);

    // open the live event detail via store-level nav (UI-level click also works)
    act(() => useNav.getState().push({ kind: "event", id: "vorsicht" }));
    expect((await screen.findAllByText(/Radar/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Line/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tab/).length).toBeGreaterThan(0);

    // rsvp from sticky bar
    const inBtns = screen.getAllByText(/I'm in|You're in/);
    fireEvent.click(inBtns[inBtns.length - 1]);

    // pop and visit other tabs
    act(() => useNav.getState().popAll());
    act(() => useNav.getState().setTab("calendar"));
    expect((await screen.findAllByText("Show maybes")).length).toBeGreaterThan(0);

    act(() => useNav.getState().setTab("capsule"));
    expect((await screen.findAllByText(/Greeklish Day/)).length).toBeGreaterThan(0);

    act(() => useNav.getState().setTab("profile"));
    expect((await screen.findAllByText(/@nathcury/)).length).toBeGreaterThan(0);

    // capsule detail with predictions
    act(() => useNav.getState().push({ kind: "capsule", id: "greeklish" }));
    expect((await screen.findAllByText(/Revealed/)).length).toBeGreaterThan(0);
    act(() => useNav.getState().popAll());

    // sparks ("across the room") on a public venue night
    act(() => useNav.getState().push({ kind: "capsule", id: "kellernacht5" }));
    expect((await screen.findAllByText(/Across the room/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/silver rings/i)).length).toBeGreaterThan(0);
    act(() => useNav.getState().openSheet({ kind: "spark", eventId: "kellernacht5" }));
    expect((await screen.findAllByText(/What caught your eye/i)).length).toBeGreaterThan(0);
    act(() => useNav.getState().closeSheet());
    act(() => useNav.getState().popAll());

    // person + receipt data exists
    act(() => useNav.getState().push({ kind: "person", id: "felice" }));
    expect((await screen.findAllByText(/Felice/)).length).toBeGreaterThan(0);
    act(() => useNav.getState().popAll());

    // search screen
    act(() => useNav.getState().push({ kind: "search" }));
    const input = await screen.findByPlaceholderText(/house music/);
    fireEvent.change(input, { target: { value: "house music this weekend" } });
    act(() => useNav.getState().popAll());

    // notifications + settings
    act(() => useNav.getState().push({ kind: "notifications" }));
    expect((await screen.findAllByText(/pact/i)).length).toBeGreaterThan(0);
    act(() => useNav.getState().popAll());
    act(() => useNav.getState().push({ kind: "settings" }));
    expect((await screen.findAllByText("Dark mode")).length).toBeGreaterThan(0);

    // create sheet opens
    act(() => useNav.getState().openSheet({ kind: "create" }));
    expect((await screen.findAllByText("Drop screenshots")).length).toBeGreaterThan(0);

    // decision roulette spins
    act(() => useNav.getState().openSheet({ kind: "roulette" }));
    expect((await screen.findAllByText(/who's free/i)).length).toBeGreaterThan(0);
    act(() => useNav.getState().closeSheet());

    // morning-after receipt renders from a past night
    act(() => useNav.getState().openSheet({ kind: "nightReceipt", eventId: "greeklish" }));
    expect((await screen.findAllByText(/MORNING-AFTER RECEIPT/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/THE VERDICT/)).length).toBeGreaterThan(0);
    act(() => useNav.getState().closeSheet());

    // organizer mode: mode-aware tab bar + the three organizer screens
    act(() => useApp.getState().setMode("organizer"));
    act(() => useNav.getState().setTab("dashboard"));
    act(() => useNav.getState().popAll());
    expect((await screen.findAllByText(/hosting deck/i)).length).toBeGreaterThan(0);

    // projected fill + convert maybes on a hosted event
    act(() => useNav.getState().push({ kind: "event", id: "flohmarkt" }));
    expect((await screen.findAllByText(/Projected fill/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/one friend away/i)).length).toBeGreaterThan(0);

    act(() => useNav.getState().openSheet({ kind: "convertMaybes", eventId: "flohmarkt" }));
    expect((await screen.findAllByText(/on the fence/i)).length).toBeGreaterThan(0);
    act(() => useNav.getState().closeSheet());
    act(() => useNav.getState().popAll());

    // city scouting + metrics intelligence
    act(() => useNav.getState().setTab("city"));
    expect((await screen.findAllByText(/Stuttgart/i)).length).toBeGreaterThan(0);

    act(() => useNav.getState().setTab("metrics"));
    expect((await screen.findAllByText(/track record/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/super-hosts/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Crowd DNA/i)).length).toBeGreaterThan(0);
  });

  it("store actions: rsvp, expense, pact, poll, block day", () => {
    const s = useApp.getState();
    s.rsvp("flohmarkt", "in");
    expect(useApp.getState().events.find((e) => e.id === "flohmarkt")!.going).toContain("me");

    s.addExpense("flohmarkt", 12, "Coffee", "me", ["me", "felice"]);
    const ev = useApp.getState().events.find((e) => e.id === "flohmarkt")!;
    expect(ev.expenses.length).toBe(1);

    const pactId = s.proposePact("flohmarkt", "erick");
    s.sealPact("flohmarkt", pactId);
    const ev2 = useApp.getState().events.find((e) => e.id === "flohmarkt")!;
    expect(ev2.pacts.find((p) => p.id === pactId)!.status).toBe("sealed");
    expect(ev2.going).toContain("erick");

    s.votePoll("greeklish", "fire");
    expect(useApp.getState().events.find((e) => e.id === "greeklish")!.exitPoll.me).toBe("fire");

    s.toggleBlockedDay("2026-07-01");
    expect(useApp.getState().blockedDays).toContain("2026-07-01");
  });
});
