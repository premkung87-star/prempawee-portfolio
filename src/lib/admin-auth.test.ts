import { describe, it, expect, afterEach, vi } from "vitest";
import { validateAdminSecret } from "./admin-auth";

describe("validateAdminSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when ADMIN_SECRET is not set", () => {
    vi.stubEnv("ADMIN_SECRET", "");
    expect(validateAdminSecret("anything")).toBe(false);
  });

  it("returns true on exact match", () => {
    vi.stubEnv("ADMIN_SECRET", "s3cr3t");
    expect(validateAdminSecret("s3cr3t")).toBe(true);
  });

  it("returns false on length mismatch (short-circuit)", () => {
    vi.stubEnv("ADMIN_SECRET", "abcdefgh");
    expect(validateAdminSecret("abc")).toBe(false);
  });

  it("returns false on content mismatch of equal length", () => {
    vi.stubEnv("ADMIN_SECRET", "abcdefgh");
    expect(validateAdminSecret("abcdefgi")).toBe(false);
  });
});
