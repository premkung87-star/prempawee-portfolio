import { describe, expect, test } from "vitest";
import { PROJECTS } from "@/lib/portfolio-data";

const SLUG_RE = /^[a-z0-9-]+$/;

function isBilingualShape(val: unknown): val is { en: string; th: string } {
  return (
    typeof val === "object" &&
    val !== null &&
    "en" in val &&
    "th" in val &&
    typeof (val as { en: unknown }).en === "string" &&
    typeof (val as { th: unknown }).th === "string"
  );
}

// Walk any nested object/array and return all Bilingual-shaped values found.
// Used to assert no Bilingual field was left with an empty string on either
// side — a structural safeguard in addition to the per-section checks below.
function collectBilingualsDeep(
  node: unknown,
  acc: Array<{ en: string; th: string }> = [],
): Array<{ en: string; th: string }> {
  if (isBilingualShape(node)) {
    acc.push(node);
    return acc;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectBilingualsDeep(item, acc);
    return acc;
  }
  if (typeof node === "object" && node !== null) {
    for (const v of Object.values(node)) collectBilingualsDeep(v, acc);
  }
  return acc;
}

describe("PROJECTS array integrity", () => {
  test("every entry has a non-empty slug", () => {
    for (const p of PROJECTS) {
      expect(p.slug).toBeTruthy();
      expect(p.slug.length).toBeGreaterThan(0);
    }
  });

  test("all slugs are unique", () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("all slugs are URL-safe kebab-case", () => {
    for (const p of PROJECTS) {
      expect(p.slug).toMatch(SLUG_RE);
    }
  });

  test("this-portfolio entry has caseStudy defined", () => {
    const portfolio = PROJECTS.find((p) => p.slug === "this-portfolio");
    expect(portfolio).toBeDefined();
    expect(portfolio?.caseStudy).toBeDefined();
  });

  test("verdex entry has caseStudy defined", () => {
    const verdex = PROJECTS.find((p) => p.slug === "verdex");
    expect(verdex).toBeDefined();
    expect(verdex?.caseStudy).toBeDefined();
  });

  test("nwl-club entry has no caseStudy", () => {
    const nwl = PROJECTS.find((p) => p.slug === "nwl-club");
    expect(nwl).toBeDefined();
    expect(nwl?.caseStudy).toBeUndefined();
  });
});

describe("VerdeX CaseStudy shape", () => {
  const verdex = PROJECTS.find((p) => p.slug === "verdex");
  const cs = verdex?.caseStudy;

  test("caseStudy is defined (precondition)", () => {
    expect(cs).toBeDefined();
  });

  test("metrics has exactly 4 items", () => {
    expect(cs?.metrics.length).toBe(4);
  });

  test("screenshots has exactly 5 items", () => {
    expect(cs?.screenshots.length).toBe(5);
  });

  test("all screenshots are currently stubbed (stub-first release)", () => {
    // First PR ships infrastructure; follow-up PR flips stubbed=false with
    // real WebP assets in public/case-studies/verdex/.
    expect(cs?.screenshots.every((s) => s.stubbed === true)).toBe(true);
  });

  test("security has exactly 4 items", () => {
    expect(cs?.security.length).toBe(4);
  });

  test("cta.mailto starts with mailto:prempaweet20@gmail.com", () => {
    expect(cs?.cta.mailto.startsWith("mailto:prempaweet20@gmail.com")).toBe(
      true,
    );
  });

  test("all Bilingual fields in caseStudy have non-empty en and th", () => {
    const bilinguals = collectBilingualsDeep(cs);
    expect(bilinguals.length).toBeGreaterThan(0);
    for (const b of bilinguals) {
      expect(b.en.trim().length).toBeGreaterThan(0);
      expect(b.th.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("Portfolio CaseStudy shape", () => {
  const portfolio = PROJECTS.find((p) => p.slug === "this-portfolio");
  const cs = portfolio?.caseStudy;

  test("caseStudy is defined (precondition)", () => {
    expect(cs).toBeDefined();
  });

  test("metrics has exactly 4 items", () => {
    expect(cs?.metrics.length).toBe(4);
  });

  test("screenshots has exactly 4 items", () => {
    expect(cs?.screenshots.length).toBe(4);
  });

  test("all screenshots are non-stubbed (real images landed)", () => {
    expect(cs?.screenshots.every((s) => s.stubbed === false)).toBe(true);
  });

  test("security has exactly 6 items", () => {
    expect(cs?.security.length).toBe(6);
  });

  test("cta.mailto starts with mailto:prempaweet20@gmail.com", () => {
    expect(cs?.cta.mailto.startsWith("mailto:prempaweet20@gmail.com")).toBe(
      true,
    );
  });

  test("all Bilingual fields in caseStudy have non-empty en and th", () => {
    const bilinguals = collectBilingualsDeep(cs);
    expect(bilinguals.length).toBeGreaterThan(0);
    for (const b of bilinguals) {
      expect(b.en.trim().length).toBeGreaterThan(0);
      expect(b.th.trim().length).toBeGreaterThan(0);
    }
  });
});
