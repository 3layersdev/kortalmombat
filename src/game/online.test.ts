import { describe, expect, it } from "vitest";
import { buildBracket, duelWinner, ONLINE_STAGES } from "./online";

describe("online tournament", () => {
  it("fills empty bracket slots with bots after real players", () => {
    const b = buildBracket([{ name: "ANA", fighterId: "vesper", wins: 3, bot: false }], ["aegis"], () => 0);
    expect(b).toHaveLength(ONLINE_STAGES);
    expect(b[0]?.bot).toBe(false);
    expect(b.slice(1).every(g => g.bot)).toBe(true);
  });
  it("duel: a win beats a loss even with less health", () => {
    expect(duelWinner({ won: true, health: 5, damage: 10, time: 90 }, { won: false, health: 90, damage: 99, time: 20 })).toBe("host");
  });
  it("duel: both win → more health left wins; identical → draw", () => {
    expect(duelWinner({ won: true, health: 40, damage: 0, time: 0 }, { won: true, health: 60, damage: 0, time: 0 })).toBe("guest");
    const r = { won: true, health: 50, damage: 50, time: 50 };
    expect(duelWinner(r, r)).toBe("draw");
  });
});
