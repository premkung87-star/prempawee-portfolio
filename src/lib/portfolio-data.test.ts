import { describe, it, expect } from "vitest";
import {
  PROJECTS,
  PACKAGES,
  PORTFOLIO_METRICS,
  TECH_STACK,
} from "./portfolio-data";

describe("portfolio-data", () => {
  it("PROJECTS always has the three canonical projects", () => {
    const ids = PROJECTS.map((p) => p.id).sort();
    expect(ids).toEqual(["nwl_club", "portfolio", "verdex"]);
  });

  it("PROJECTS.components list only uses absolute https urls or null", () => {
    for (const p of PROJECTS) {
      for (const c of p.components) {
        if (c.url !== null) {
          expect(c.url.startsWith("https://")).toBe(true);
        }
      }
    }
  });

  it("PORTFOLIO_METRICS web-property count matches PROJECTS component count (excluding LINE bot)", () => {
    let webCount = 0;
    for (const p of PROJECTS) {
      for (const c of p.components) {
        if (c.url !== null && !c.label.toLowerCase().includes("line bot")) {
          webCount++;
        }
      }
      // Portfolio's single component has url=null but IS a web property (this site)
      if (p.id === "portfolio") webCount++;
    }
    const headlineMetric = PORTFOLIO_METRICS.find(
      (m) => m.label === "Web Properties",
    );
    expect(headlineMetric?.value).toBe(String(webCount));
  });

  it("PACKAGES exposes exactly three tiers with distinct ids", () => {
    expect(PACKAGES).toHaveLength(3);
    const ids = PACKAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).toContain("starter");
    expect(ids).toContain("pro");
    expect(ids).toContain("enterprise");
  });

  it("every package has non-empty features", () => {
    for (const p of PACKAGES) {
      expect(p.features.length).toBeGreaterThan(0);
      expect(p.price).toMatch(/฿\d/);
    }
  });

  it("TECH_STACK entries are unique by name", () => {
    const names = TECH_STACK.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
