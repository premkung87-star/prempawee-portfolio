// Server-side feature flags. Env-gated booleans with optional query-param
// override for lightweight A/B testing. Client code should call `getFlag()`
// via a server action or API so the flag state is authoritative.
//
// Convention: env var name `FLAG_<KEY>` → value "1" / "true" / "on" enables.
// Anything else (including unset) means off.

export type FlagKey =
  | "lead_capture_card"
  | "rich_analytics"
  | "experimental_tone"
  | "rag_semantic_retrieval"
  | "suggested_prompts";

const DEFAULTS: Record<FlagKey, boolean> = {
  lead_capture_card: true,
  rich_analytics: false,
  experimental_tone: false,
  rag_semantic_retrieval: true,
  suggested_prompts: true,
};

function isTruthy(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.toLowerCase();
  return t === "1" || t === "true" || t === "on" || t === "yes";
}

/**
 * Read a flag. Order of precedence:
 *   1. Query-param override (if `overrides` supplied): `?ff=lead_capture_card:0,rich_analytics:1`
 *   2. Env var `FLAG_<KEY>`
 *   3. Hardcoded DEFAULTS
 */
export function getFlag(
  key: FlagKey,
  overrides?: URLSearchParams | Record<string, string>,
): boolean {
  if (overrides) {
    const ff =
      overrides instanceof URLSearchParams
        ? overrides.get("ff")
        : overrides.ff;
    if (ff) {
      for (const pair of ff.split(",")) {
        const [k, v] = pair.split(":");
        if (k === key) return v === "1" || v === "true";
      }
    }
  }
  const envVal = process.env[`FLAG_${key.toUpperCase()}`];
  if (envVal !== undefined) return isTruthy(envVal);
  return DEFAULTS[key];
}

export function allFlags(
  overrides?: URLSearchParams | Record<string, string>,
): Record<FlagKey, boolean> {
  const result = {} as Record<FlagKey, boolean>;
  for (const key of Object.keys(DEFAULTS) as FlagKey[]) {
    result[key] = getFlag(key, overrides);
  }
  return result;
}
