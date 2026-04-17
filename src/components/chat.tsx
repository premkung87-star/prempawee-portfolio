"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import {
  PricingCard,
  PortfolioOverviewCard,
  CaseStudyCard,
  TechStackCard,
  ContactCard,
  LeadCaptureCard,
} from "./tool-results";
import {
  CONTACT,
  TRUST_FACTS,
  SUGGESTED_PROMPTS,
} from "@/lib/portfolio-data";

const MAX_MESSAGES = 20;
// Server accepts /^[a-zA-Z0-9-]{1,64}$/ — UUIDs qualify.
const SESSION_ID_RE = /^[a-zA-Z0-9-]{1,64}$/;
const SESSION_STORAGE_KEY = "chat-session-id";

// Support both AI SDK v5 `args` and v6 `input` on tool parts.
// Returns an empty object if neither exists or they aren't plain objects.
function readToolInput<T extends Record<string, unknown>>(part: unknown): T {
  if (typeof part !== "object" || part === null) return {} as T;
  const p = part as Record<string, unknown>;
  const candidate = p.args ?? p.input;
  if (typeof candidate === "object" && candidate !== null) {
    return candidate as T;
  }
  return {} as T;
}

export function Chat() {
  // Stable per-browser chat session ID, persisted in localStorage so one user's
  // turns land on a single conversation thread server-side. Without this, each
  // turn got a fresh server-generated `srv-*` ID and analytics saw every
  // follow-up as a brand-new stranger (AUDIT_LOG bug discovered 2026-04-17).
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let sid = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sid || !SESSION_ID_RE.test(sid)) {
        sid = crypto.randomUUID();
        localStorage.setItem(SESSION_STORAGE_KEY, sid);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage
      setSessionId(sid);
    } catch {
      // localStorage disabled — fall back to a fresh per-mount ID.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fallback when storage unavailable
      setSessionId(crypto.randomUUID());
    }
  }, []);

  const transport = useMemo(
    () =>
      sessionId
        ? new DefaultChatTransport({
            api: "/api/chat",
            headers: { "x-session-id": sessionId },
          })
        : undefined,
    [sessionId],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const [input, setInput] = useState("");
  const [consented, setConsented] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<"en" | "th">("en");

  // Initial lang from URL query param or localStorage. Also sync the
  // <html lang> attribute so screen readers and assistive tech pick up the
  // language change mid-session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const fromQuery = url.searchParams.get("lang");
      const fromStorage = localStorage.getItem("lang");
      const initial =
        fromQuery === "th" || fromQuery === "en"
          ? fromQuery
          : fromStorage === "th" || fromStorage === "en"
            ? fromStorage
            : null;
      if (initial) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from persisted preference
        setLang(initial as "en" | "th");
      }
    } catch {
      // No-op on disabled storage / non-browser contexts
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("lang", lang);
    } catch {
      // localStorage disabled — OK, in-session language still works
    }
  }, [lang]);

  const isLoading = status === "submitted" || status === "streaming";
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isLimitReached = userMessageCount >= MAX_MESSAGES;

  // Check consent from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating initial state from localStorage is the standard pattern
      setConsented(localStorage.getItem("pdpa-consent") === "yes");
    } catch {
      // localStorage may throw in private mode / disabled storage; stay unconsented
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (consented) inputRef.current?.focus();
  }, [consented]);

  function onConsent() {
    localStorage.setItem("pdpa-consent", "yes");
    setConsented(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading || isLimitReached) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }

  function sendSuggestion(text: string) {
    if (isLoading || isLimitReached) return;
    sendMessage({ text });
  }

  function retryLast() {
    // Re-send the last user message. Used by the error banner's Retry button.
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (!lastUser) return;
    const text = lastUser.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .trim();
    if (text) sendMessage({ text });
  }

  const placeholders = {
    en: "Ask me anything about LINE OA chatbots...",
    th: "ถามอะไรก็ได้เกี่ยวกับ LINE OA Chatbot...",
  };

  return (
    <div className="flex flex-col h-dvh bg-[#0a0a0a] bg-grid">
      {/* Visually hidden h1 for SEO + screen readers. Visible header below
          is stylized terminal-brand markup. */}
      <h1 className="sr-only">
        Prempawee — LINE OA Chatbot Developer for Thai Businesses
      </h1>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-sm tracking-[3px] uppercase text-white">
          PREMPAWEE <span className="text-[#666]" aria-hidden="true">{"// AI"}</span>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="text-[11px]"
            role="group"
            aria-label="Display language"
          >
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={
                lang === "en"
                  ? "text-white"
                  : "text-[#aaa] hover:text-white transition-colors"
              }
            >
              EN
            </button>
            <span className="text-[#888]" aria-hidden="true">
              {" / "}
            </span>
            <button
              type="button"
              onClick={() => setLang("th")}
              aria-pressed={lang === "th"}
              className={
                lang === "th"
                  ? "text-white"
                  : "text-[#aaa] hover:text-white transition-colors"
              }
            >
              TH
            </button>
          </div>
          <div
            className="flex items-center gap-1.5 text-[11px] text-[#aaa]"
            role="status"
            aria-live="polite"
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-white status-pulse"
              aria-hidden="true"
            />
            {lang === "th" ? "AI ออนไลน์" : "AI Online"}
          </div>
          {/* Primary CTA — visible + reachable even if the chat is slow */}
          <a
            href={CONTACT.contactUrl}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded transition-colors"
          >
            {lang === "th" ? "ติดต่อ" : "Contact"}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </header>

      {/* Trust ticker — first-viewport proof without requiring chat
          interaction. Four concrete facts, all verifiable. */}
      <div
        className="shrink-0 border-b border-white/10 bg-white/[0.015] px-4 py-2"
        aria-label="About this practice"
      >
        <div className="max-w-[800px] mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-[#aaa]">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">📍</span>
            {TRUST_FACTS.location[lang]}
          </span>
          <span aria-hidden="true" className="text-[#555]">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">⚡</span>
            {TRUST_FACTS.responseTime[lang]}
          </span>
          <span aria-hidden="true" className="text-[#555]">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">🏆</span>
            {TRUST_FACTS.projects[lang]}
          </span>
          <span aria-hidden="true" className="text-[#555]">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">🤖</span>
            {TRUST_FACTS.stack[lang]}
          </span>
        </div>
      </div>

      {/* Skip link — keyboard-only access to main content */}
      <a
        href="#chat-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-white focus:text-black focus:text-sm focus:rounded"
      >
        {lang === "th" ? "ข้ามไปแชท" : "Skip to chat"}
      </a>

      {/* Chat area */}
      <main
        id="chat-main"
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 max-w-[800px] w-full mx-auto"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        aria-atomic="false"
      >
        {/* Welcome message */}
        <div className="mb-6 message-enter">
          <div className="text-[10px] uppercase tracking-[2px] text-[#888] mb-1.5">
            {lang === "th" ? "PREMPAWEE AI" : "PREMPAWEE AI"}
          </div>
          <div className="text-[15px] text-[#ccc] leading-relaxed max-w-[85%] whitespace-pre-wrap">
            {lang === "th" ? (
              <>
                สวัสดีครับ ผมเป็น AI ของ Prempawee{"\n\n"}ผมสร้าง{" "}
                <strong className="text-white font-medium">
                  LINE OA Chatbot
                </strong>{" "}
                สำหรับธุรกิจไทย — แชทบอทที่ใช้ Claude AI เข้าใจภาษาไทยธรรมชาติ ไม่ใช่แค่จับคีย์เวิร์ด
                {"\n\n"}มีอะไรให้ช่วยครับ? เล่าเรื่องธุรกิจของคุณ หรือถามอะไรก็ได้
              </>
            ) : (
              <>
                Welcome. I&apos;m Prempawee&apos;s portfolio AI.{"\n\n"}I build{" "}
                <strong className="text-white font-medium">
                  LINE OA Chatbots
                </strong>{" "}
                for Thai businesses — Claude-powered, fluent in natural Thai,
                not just keyword matching.{"\n\n"}What brings you here? Tell me about
                your business, or ask me anything.
              </>
            )}
          </div>
        </div>

        {/* Chat messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-6 message-enter ${msg.role === "user" ? "flex flex-col items-end" : ""}`}
          >
            <div className="text-[10px] uppercase tracking-[2px] text-[#888] mb-1.5">
              {msg.role === "user"
                ? lang === "th"
                  ? "คุณ"
                  : "YOU"
                : "PREMPAWEE AI"}
            </div>

            {msg.parts.map((part, i) => {
              const partKey = `${msg.id}-${i}`;

              if (part.type === "text") {
                if (msg.role === "user") {
                  return (
                    <div
                      key={partKey}
                      className="inline-block bg-white/5 rounded px-3 py-2 text-[15px] text-white leading-relaxed max-w-[85%]"
                    >
                      {part.text}
                    </div>
                  );
                }
                return (
                  <div
                    key={partKey}
                    className="text-[15px] text-[#ccc] leading-relaxed max-w-[85%] whitespace-pre-wrap"
                  >
                    {part.text.split(/\*\*(.*?)\*\*/g).map((segment, j) =>
                      j % 2 === 1 ? (
                        <strong
                          key={`${partKey}-bold-${j}`}
                          className="text-white font-medium"
                        >
                          {segment}
                        </strong>
                      ) : (
                        <span key={`${partKey}-text-${j}`}>{segment}</span>
                      )
                    )}
                  </div>
                );
              }

              if (part.type === "tool-show_pricing") {
                const input = readToolInput<{ highlight?: string }>(part);
                const highlight =
                  input.highlight === "starter" ||
                  input.highlight === "pro" ||
                  input.highlight === "enterprise"
                    ? input.highlight
                    : undefined;
                return <PricingCard key={partKey} highlight={highlight} />;
              }
              if (part.type === "tool-show_portfolio")
                // argless tool — no args/input read needed
                return <PortfolioOverviewCard key={partKey} />;
              if (part.type === "tool-show_case_study") {
                const input = readToolInput<{ project?: unknown }>(part);
                const project =
                  typeof input.project === "string"
                    ? input.project
                    : undefined;
                return <CaseStudyCard key={partKey} project={project} />;
              }
              if (part.type === "tool-show_tech_stack")
                return <TechStackCard key={partKey} />;
              if (part.type === "tool-show_contact")
                return <ContactCard key={partKey} lang={lang} />;
              if (part.type === "tool-capture_lead") {
                // Read the `output` (tool result), not the input. Support
                // both `output` (v6 canonical) and `result` (v5 alias).
                const p = part as unknown as Record<string, unknown>;
                const output = (p.output ?? p.result ?? {}) as {
                  id?: number;
                  name?: string | null;
                  email?: string | null;
                  line_id?: string | null;
                  package_interest?: string | null;
                  error?: string;
                  message?: string;
                };
                return (
                  <LeadCaptureCard
                    key={partKey}
                    id={output.id}
                    name={output.name}
                    email={output.email}
                    line_id={output.line_id}
                    package_interest={output.package_interest}
                    error={output.error}
                    message={output.message}
                  />
                );
              }

              return null;
            })}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mb-6 message-enter">
            <div className="text-[10px] uppercase tracking-[2px] text-[#888] mb-1.5">
              PREMPAWEE AI
            </div>
            <div className="flex items-center gap-1.5 text-[#888]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#555] status-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#555] status-pulse [animation-delay:0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#555] status-pulse [animation-delay:0.6s]" />
            </div>
          </div>
        )}

        {/* Message limit reached */}
        {isLimitReached && (
          <div className="mb-6 p-4 border border-white/10 rounded bg-white/[0.02]">
            <p className="text-[#ccc] text-sm mb-2">
              {lang === "th"
                ? "ขอบคุณที่สนใจครับ! คุยกันต่อทาง LINE หรืออีเมลได้เลย"
                : "Thanks for your interest! Let's continue the conversation on LINE or email."}
            </p>
            <div className="flex gap-3 text-xs">
              <a
                href="mailto:prempaweet20@gmail.com"
                className="text-white underline underline-offset-2 decoration-white/30"
              >
                prempaweet20@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/prempawee"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline underline-offset-2 decoration-white/30"
              >
                LinkedIn
              </a>
            </div>
          </div>
        )}

        {/* Error — role=alert for screen readers, Retry button to re-send
            the last user message, fallback link to /fallback if retry keeps
            failing. */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 p-3 border border-red-500/20 rounded bg-red-500/5 text-red-400 text-xs"
          >
            <div className="mb-2">
              {lang === "th"
                ? "การเชื่อมต่อขาด ลองอีกครั้งได้เลย หรือดูข้อมูลแบบออฟไลน์"
                : "Connection hiccup. Try again, or see the offline portfolio."}
            </div>
            {error.message ? (
              <div className="mb-2 text-red-300/70 font-mono text-[11px] break-words">
                {error.message.slice(0, 300)}
              </div>
            ) : null}
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                onClick={retryLast}
                className="px-3 py-1 border border-red-500/30 rounded text-red-300 hover:bg-red-500/10 transition-colors"
              >
                {lang === "th" ? "ลองอีกครั้ง" : "Retry"}
              </button>
              <a
                href="/fallback"
                className="px-3 py-1 border border-white/10 rounded text-[#ccc] hover:bg-white/5 transition-colors"
              >
                {lang === "th" ? "ดูแบบออฟไลน์ →" : "See offline portfolio →"}
              </a>
            </div>
          </div>
        )}

        {/* Suggested prompt chips — shown before the first user turn so
            visitors see a starting point, not a blank page. Each chip
            sends a canned message that invokes a specific tool. */}
        {messages.length === 0 && consented && !isLimitReached && (
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[2px] text-[#888] mb-2">
              {lang === "th" ? "ลองเริ่มจาก" : "Or try"}
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.en}
                  type="button"
                  onClick={() => sendSuggestion(prompt.send[lang])}
                  className="px-3 py-1.5 text-xs text-[#ccc] border border-white/10 rounded bg-white/[0.02] hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  {prompt[lang]}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* PDPA consent banner */}
      {!consented && (
        <div className="shrink-0 border-t border-white/10 bg-[#111] px-4 py-3">
          <div className="max-w-[800px] mx-auto flex items-center justify-between gap-4">
            <p
              id="chat-privacy-notice"
              className="text-[#aaa] text-xs leading-relaxed"
            >
              {lang === "th"
                ? "แชทนี้อาจบันทึกข้อความเพื่อปรับปรุงบริการ ข้อมูลจะไม่ถูกแบ่งปันกับบุคคลที่สาม"
                : "This chat may store messages to improve service. No data is shared with third parties."}
            </p>
            <button
              type="button"
              onClick={onConsent}
              className="shrink-0 px-4 py-1.5 text-xs text-white bg-white/10 rounded hover:bg-white/20 transition-colors"
            >
              {lang === "th" ? "เข้าใจแล้ว" : "I understand"}
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-white/10 px-4 py-4 max-w-[800px] w-full mx-auto"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#888] text-sm select-none">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isLimitReached
                ? lang === "th"
                  ? "ถึงขีดจำกัดแล้ว — ติดต่อทาง LINE หรืออีเมล"
                  : "Limit reached — contact via LINE or email"
                : placeholders[lang]
            }
            disabled={isLoading || !consented || isLimitReached}
            maxLength={4000}
            className="flex-1 bg-transparent text-white text-[15px] font-mono outline-none placeholder:text-[#888] disabled:opacity-50"
            aria-label="Chat input"
            aria-describedby="chat-privacy-notice"
          />
          {!input && !isLoading && consented && !isLimitReached && (
            <span className="w-2 h-4 bg-white cursor-blink" />
          )}
        </div>
      </form>
    </div>
  );
}
