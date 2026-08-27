import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createOAuthState, safeReturnTo, statesMatch } from "@/server/auth/state";

describe("OAuth state", () => {
  it("generates unique high-entropy values", () => {
    const first = createOAuthState();
    const second = createOAuthState();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
  });

  it("compares state values safely", () => {
    expect(statesMatch("expected-state", "expected-state")).toBe(true);
    expect(statesMatch("expected-state", "different-state")).toBe(false);
    expect(statesMatch("short", "much-longer")).toBe(false);
  });

  it("allows only local return paths", () => {
    expect(safeReturnTo("/report")).toBe("/report");
    expect(safeReturnTo("https://evil.example")).toBe("/data");
    expect(safeReturnTo("//evil.example")).toBe("/data");
  });
});
