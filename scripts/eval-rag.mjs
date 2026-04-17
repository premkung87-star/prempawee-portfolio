// Ragas-style answer-quality eval for the RAG chat. Two classes of check:
//
//   (1) Behavioral assertions — Claude must invoke the expected tool or
//       include expected keywords. Hard pass/fail.
//   (2) LLM-as-judge scoring — Claude Haiku scores each answer on
//       faithfulness (grounded in retrieved context?) and answer_relevancy
//       (does it answer the question asked?). Averaged into a quality score.
//       Soft threshold configurable via EVAL_MIN_SCORE.
//
// Exits 0 on all-pass + average score >= threshold, 1 otherwise.
//
// Usage:
//   npm run eval:rag                           # hits prod by default
//   EVAL_TARGET=http://localhost:3000 npm run eval:rag
//   EVAL_MIN_SCORE=0.7 npm run eval:rag        # default 0.7
//   EVAL_SKIP_JUDGE=1 npm run eval:rag         # behavioral-only (no Claude judge)
//
// Requires ANTHROPIC_API_KEY (for the judge phase) unless EVAL_SKIP_JUDGE=1.

const TARGET =
  process.env.EVAL_TARGET || "https://prempawee-portfolio.vercel.app";
const MIN_SCORE = parseFloat(process.env.EVAL_MIN_SCORE ?? "0.7");
const SKIP_JUDGE = process.env.EVAL_SKIP_JUDGE === "1";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

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

  // Extract the concatenated assistant text for scoring
  const textDeltas = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const json = JSON.parse(line.slice(6));
      if (json.type === "text-delta" && typeof json.delta === "string") {
        textDeltas.push(json.delta);
      }
    } catch {}
  }
  const answer = textDeltas.join("");

  if (probe.expectsTool) {
    const found = text.includes(`"toolName":"${probe.expectsTool}"`);
    if (!found) {
      return {
        ok: false,
        probe,
        answer,
        reason: `expected tool ${probe.expectsTool} not invoked`,
      };
    }
    return { ok: true, probe, answer };
  }

  if (probe.expectsAnyKeyword) {
    const lower = (answer || text).toLowerCase();
    const hit = probe.expectsAnyKeyword.find((k) =>
      lower.includes(k.toLowerCase()),
    );
    if (!hit) {
      return {
        ok: false,
        probe,
        answer,
        reason: `none of keywords [${probe.expectsAnyKeyword.join(", ")}] found`,
      };
    }
    return { ok: true, probe, answer };
  }

  return { ok: false, probe, answer, reason: "probe has no assertions configured" };
}

/**
 * LLM-as-judge scoring. Uses Claude Haiku to rate each answer on:
 *   - faithfulness: 0-1, does the answer stay grounded in likely context?
 *   - relevancy:    0-1, does the answer address the question asked?
 *
 * Returns { faithfulness, relevancy, note } or null on judge failure.
 */
async function judgeAnswer(question, answer) {
  if (SKIP_JUDGE || !ANTHROPIC_KEY) return null;
  if (!answer || answer.length < 10) {
    return { faithfulness: 0, relevancy: 0, note: "empty-answer" };
  }
  const judgePrompt = `You are a RAG quality judge. A chatbot for a LINE OA developer portfolio answered a visitor question. Rate the answer on two dimensions, each from 0.0 to 1.0:

- faithfulness: Does the answer contain only claims a reasonable portfolio AI could make (no invented clients, no fabricated metrics, no hallucinated tech)? 1.0 = completely grounded, 0.5 = one plausible but unverifiable claim, 0.0 = clear hallucination.
- relevancy: Does the answer address the visitor's actual question? 1.0 = direct + complete, 0.5 = partial, 0.0 = off-topic.

Output ONLY a JSON object: {"faithfulness": <0-1>, "relevancy": <0-1>, "note": "<one short sentence>"}. No markdown, no extra text.

Question: ${question}

Answer: ${answer.slice(0, 3000)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: judgePrompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const clamp = (n) => Math.max(0, Math.min(1, Number(n) || 0));
    return {
      faithfulness: clamp(parsed.faithfulness),
      relevancy: clamp(parsed.relevancy),
      note: String(parsed.note ?? "").slice(0, 200),
    };
  } catch {
    return null;
  }
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
      // LLM-as-judge scoring (soft)
      r.judge = await judgeAnswer(probe.text, r.answer ?? "");
      results.push(r);
      console.log(
        JSON.stringify({
          level: r.ok ? "info" : "warn",
          probe: probe.name,
          ok: r.ok,
          reason: r.reason,
          judge: r.judge,
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

  // Average judge scores across probes that got judged
  const judged = results.filter((r) => r.judge);
  const avgFaith = judged.length
    ? judged.reduce((a, r) => a + r.judge.faithfulness, 0) / judged.length
    : null;
  const avgRelev = judged.length
    ? judged.reduce((a, r) => a + r.judge.relevancy, 0) / judged.length
    : null;
  const overall = avgFaith !== null && avgRelev !== null ? (avgFaith + avgRelev) / 2 : null;

  const scoreGateOk = overall === null || overall >= MIN_SCORE;
  const allOk = failed === 0 && scoreGateOk;

  console.log(
    JSON.stringify({
      level: allOk ? "info" : "error",
      message: "eval.complete",
      passed,
      failed,
      total: results.length,
      avg_faithfulness: avgFaith,
      avg_relevancy: avgRelev,
      overall_score: overall,
      threshold: MIN_SCORE,
      gate: allOk ? "pass" : "fail",
    }),
  );

  process.exit(allOk ? 0 : 1);
}

await main();
