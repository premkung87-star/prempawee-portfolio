import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logInfo, logWarn, logError } from "./logger";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("logInfo emits valid JSON with level=info", () => {
    logInfo("test.message", { foo: "bar" });
    expect(logSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload.level).toBe("info");
    expect(payload.message).toBe("test.message");
    expect(payload.foo).toBe("bar");
    expect(typeof payload.timestamp).toBe("string");
  });

  it("logWarn uses console.warn", () => {
    logWarn("warn.msg");
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("logError uses console.error and flattens Error objects", () => {
    const err = new Error("boom");
    logError("err.msg", { error: err });
    expect(errorSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload.error.name).toBe("Error");
    expect(payload.error.message).toBe("boom");
    expect(typeof payload.error.stack).toBe("string");
  });

  it("handles circular references without throwing", () => {
    const circ: Record<string, unknown> = { name: "self" };
    circ.me = circ;
    expect(() => logInfo("circ", { circ })).not.toThrow();
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload.circ.me).toBe("[Circular]");
  });

  it("coerces bigint to string", () => {
    logInfo("big", { n: BigInt(42) });
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload.n).toBe("42");
  });
});
