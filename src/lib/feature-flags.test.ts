import { describe, it, expect, afterEach, vi } from "vitest";
import { getFlag, allFlags } from "./feature-flags";

describe("feature-flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the hardcoded default when env is unset", () => {
    expect(getFlag("lead_capture_card")).toBe(true);
    expect(getFlag("rich_analytics")).toBe(false);
  });

  it("env override takes precedence over default", () => {
    vi.stubEnv("FLAG_RICH_ANALYTICS", "1");
    expect(getFlag("rich_analytics")).toBe(true);
    vi.stubEnv("FLAG_LEAD_CAPTURE_CARD", "0");
    expect(getFlag("lead_capture_card")).toBe(false);
  });

  it("accepts multiple truthy strings", () => {
    for (const t of ["1", "true", "on", "yes", "TRUE", "On"]) {
      vi.stubEnv("FLAG_RICH_ANALYTICS", t);
      expect(getFlag("rich_analytics")).toBe(true);
    }
  });

  it("query-param override beats env", () => {
    vi.stubEnv("FLAG_RICH_ANALYTICS", "1");
    const overrides = new URLSearchParams("ff=rich_analytics:0");
    expect(getFlag("rich_analytics", overrides)).toBe(false);
  });

  it("allFlags returns every known flag", () => {
    const f = allFlags();
    expect(Object.keys(f).sort()).toEqual([
      "experimental_tone",
      "lead_capture_card",
      "rich_analytics",
    ]);
  });
});
