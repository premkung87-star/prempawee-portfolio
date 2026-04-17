// Answer-quality eval for the RAG chat. Runs a fixed set of probe
// questions against the live API and asserts that Claude's streamed
// response either (a) invokes the expected tool, or (b) contains the
// expected keyword. Exits 0 on all-pass, 1 on any fail.
//
// Usage:
//   npm run eval:rag                           # hits prod by default
//   EVAL_TARGET=http://localhost:3000 npm run eval:rag
//
// This is a spot-check, not a proper eval framework. For deeper quality
// tracking, graduate to Anthropic's eval harness or Promptfoo later.

const TARGET =
  process.env.EVAL_TARGET || "https://prempawee-portfolio.vercel.app";

/**
 * @typedef {Object} Probe
 * @property {string} name
 * @property {string} text
 * @property {string} [expectsTool]
 * @property {string[]} [expectsAnyKeyword]
 */

/** @type {Probe[]} */
const PROBES = [
  {
    name: "en.portfolio.breadth",
    text: "What's your portfolio?",
    expectsTool: "show_portfolio",
  },
  {
    name: "th.portfolio.breadth",
    text: "นายมีผลงานอะไรบ้าง",
    expectsTool: "show_portfolio",
  },
  {
    name: "en.verdex.drilldown",
    text: "Tell me more about VerdeX Farm specifically",
    expectsTool: "show_case_study",
  },
  {
    name: "en.pricing",
    text: "How much do your packages cost?",
    expectsTool: "show_pricing",
  },
  {
    name: "en.tech",
    text: "What technologies do you use to build the chatbots?",
    expectsTool: "show_tech_stack",
  },
  {
    name: "en.contact",
    text: "How do I get in touch with you?",
    expectsTool: "show_contact",
  },
  {
    name: "en.identity",
    text: "Who are you?",
    expectsAnyKeyword: ["prempawee", "line oa", "chatbot"],
  },
  {
    name: "th.location",
    text: "คุณอยู่ที่ไหน",
    expectsAnyKeyword: ["chiang mai", "เชียงใหม่"],
  },
  {
    name: "en.objection.one-project",
    text: "Only one project?",
    expectsAnyKeyword: ["6", "web properties", "iterations", "depth"],
  },
  {
    name: "en.claude.question",
    text: "Do your bots use Claude?",
    expectsAnyKeyword: ["claude", "anthropic"],
  },
];

/**
 * @param {Probe} probe
 * @returns {Promise<{ok: boolean, probe: Probe, reason?: string}>}
 */
async function runProbe(probe) {
  const body = {
    messages: [
      {
        role: "user",
        id: `eval-${probe.name}-${Date.now()}`,
        parts: [{ type: "text", text: probe.text }],
      },
    ],
  };

  const res = await fetch(`${TARGET}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": `eval-${probe.name}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    return {
      ok: false,
      probe,
      reason: `rate-limited (429); slow the eval or flush Upstash`,
    };
  }
  if (!res.ok) {
    return { ok: false, probe, reason: `HTTP ${res.status}` };
  }

  const text = await res.text();

  if (probe.expectsTool) {
    const found = text.includes(`"toolName":"${probe.expectsTool}"`);
    if (!found) {
      return {
        ok: false,
        probe,
        reason: `expected tool ${probe.expectsTool} not invoked`,
      };
    }
    return { ok: true, probe };
  }

  if (probe.expectsAnyKeyword) {
    const lower = text.toLowerCase();
    const hit = probe.expectsAnyKeyword.find((k) =>
      lower.includes(k.toLowerCase()),
    );
    if (!hit) {
      return {
        ok: false,
        probe,
        reason: `none of keywords [${probe.expectsAnyKeyword.join(", ")}] found`,
      };
    }
    return { ok: true, probe };
  }

  return { ok: false, probe, reason: "probe has no assertions configured" };
}

async function main() {
  console.log(
    JSON.stringify({
      level: "info",
      message: "eval.start",
      target: TARGET,
      probes: PROBES.length,
    }),
  );

  const results = [];
  for (const probe of PROBES) {
    try {
      const r = await runProbe(probe);
      results.push(r);
      console.log(
        JSON.stringify({
          level: r.ok ? "info" : "warn",
          probe: probe.name,
          ok: r.ok,
          reason: r.reason,
        }),
      );
      // Soft rate between probes so we don't burn the 10/hr cap instantly
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err) {
      results.push({ ok: false, probe, reason: String(err) });
      console.log(
        JSON.stringify({
          level: "error",
          probe: probe.name,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log(
    JSON.stringify({
      level: failed === 0 ? "info" : "error",
      message: "eval.complete",
      passed,
      failed,
      total: results.length,
    }),
  );

  process.exit(failed === 0 ? 0 : 1);
}

await main();
