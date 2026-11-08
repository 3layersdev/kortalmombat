import { describe, expect, it } from "vitest";
import { cleanName, ONLINE_STAGES } from "./online";
describe("online cup", () => {
  it("has 8 live stages", () => expect(ONLINE_STAGES).toBe(8));
  it("names are uppercase, safe and at most 14 chars", () => expect(cleanName("adrian<script>!!long-name")).toBe("ADRIANSCRIPTLO"));
});
import { netVerdict, NET_TIMEOUT_MS } from "./online";
describe("lost connection", () => {
  it("decides after 20 seconds", () => expect(NET_TIMEOUT_MS).toBe(20000));
  it("more health wins for either side", () => {
    expect(netVerdict(70, 40, false)).toBe("win");
    expect(netVerdict(70, 40, true)).toBe("loss");
  });
  it("equal health is a draw", () => expect(netVerdict(55, 55, true)).toBe("draw"));
});
