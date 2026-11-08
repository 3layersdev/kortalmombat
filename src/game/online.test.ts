import { describe, expect, it } from "vitest";
import { cleanName, ONLINE_STAGES } from "./online";
describe("online cup", () => {
  it("has 8 live stages", () => expect(ONLINE_STAGES).toBe(8));
  it("names are uppercase, safe and at most 14 chars", () => expect(cleanName("adrian<script>!!long-name")).toBe("ADRIANSCRIPTLO"));
});
