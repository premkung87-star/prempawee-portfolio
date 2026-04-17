"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import {
  PricingCard,
  PortfolioOverviewCard,
  CaseStudyCard,
  TechStackCard,
  ContactCard,
  LeadCaptureCard,
} from "./tool-results";

const MAX_MESSAGES = 20;

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
  const { messages, sendMessage, status, error } = useChat();

  const [input, setInput] = useState("");
  const [consented, setConsented] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<"en" | "th">("en");

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

  const placeholders = {
    en: "Ask me anything about LINE OA chatbots...",
    th: "ถามอะไรก็ได้เกี่ยวกับ LINE OA Chatbot...",
  };

  return (
    <div className="flex flex-col h-dvh bg-[#0a0a0a] bg-grid">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-sm tracking-[3px] uppercase text-white">
          PREMPAWEE <span className="text-[#666]">{"// AI"}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[11px]">
            <button
              onClick={() => setLang("en")}
              className={lang === "en" ? "text-white" : "text-[#666]"}
            >
              EN
            </button>
            {" / "}
            <button
              onClick={() => setLang("th")}
              className={lang === "th" ? "text-white" : "text-[#666]"}
            >
              TH
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#4a4a4a]">
            <span className="w-1.5 h-1.5 rounded-full bg-white status-pulse" />
            AI Online
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 max-w-[800px] w-full mx-auto"
        role="log"
        aria-label="Chat messages"
      >
        {/* Welcome message */}
        <div className="mb-6 message-enter">
          <div className="text-[10px] uppercase tracking-[2px] text-[#555] mb-1.5">
            PREMPAWEE AI
          </div>
          <div className="text-[15px] text-[#ccc] leading-relaxed max-w-[85%] whitespace-pre-wrap">
            {lang === "th" ? (
              <>
                สวัสดีครับ ผมเป็น AI ของ Prempawee{"\n\n"}ผมสร้าง{" "}
                <strong className="text-white font-medium">
                  LINE OA Chatbot อัจฉริยะ
                </strong>{" "}
                สำหรับธุรกิจไทย — แชทบอทที่เข้าใจภาษาธรรมชาติ ไม่ใช่แค่คีย์เวิร์ด
                {"\n\n"}มีอะไรให้ช่วยครับ? เล่าเรื่องธุรกิจของคุณ หรือถามอะไรก็ได้
              </>
            ) : (
              <>
                Welcome. I&apos;m Prempawee&apos;s portfolio AI.{"\n\n"}I build{" "}
                <strong className="text-white font-medium">
                  intelligent LINE OA Chatbots
                </strong>{" "}
                for Thai businesses — chatbots that understand natural language,
                not just keywords.{"\n\n"}What brings you here? Tell me about
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
            <div className="text-[10px] uppercase tracking-[2px] text-[#555] mb-1.5">
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
                return <ContactCard key={partKey} />;
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
            <div className="text-[10px] uppercase tracking-[2px] text-[#555] mb-1.5">
              PREMPAWEE AI
            </div>
            <div className="flex items-center gap-1.5 text-[#555]">
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

        {/* Error */}
        {error && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 p-3 border border-red-500/20 rounded bg-red-500/5 text-red-400 text-xs"
          >
            <div>Something went wrong. Send another message to continue.</div>
            {error.message ? (
              <div className="mt-1 text-red-300/70 font-mono text-[11px] break-words">
                {error.message.slice(0, 300)}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* PDPA consent banner */}
      {!consented && (
        <div className="shrink-0 border-t border-white/10 bg-[#111] px-4 py-3">
          <div className="max-w-[800px] mx-auto flex items-center justify-between gap-4">
            <p className="text-[#888] text-xs leading-relaxed">
              {lang === "th"
                ? "แชทนี้อาจบันทึกข้อความเพื่อปรับปรุงบริการ ข้อมูลจะไม่ถูกแบ่งปันกับบุคคลที่สาม"
                : "This chat may store messages to improve service. No data is shared with third parties."}
            </p>
            <button
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
          <span className="text-[#555] text-sm select-none">&gt;</span>
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
            className="flex-1 bg-transparent text-white text-[15px] font-mono outline-none placeholder:text-[#333] disabled:opacity-50"
            aria-label="Chat input"
          />
          {!input && !isLoading && consented && !isLimitReached && (
            <span className="w-2 h-4 bg-white cursor-blink" />
          )}
        </div>
      </form>
    </div>
  );
}
