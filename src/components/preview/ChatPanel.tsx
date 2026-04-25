"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import {
  PricingCard,
  PortfolioOverviewCard,
  CaseStudyCard,
  TechStackCard,
  ContactCard,
  LeadCaptureCard,
} from "@/components/tool-results";
import { STR, type Lang } from "./preview-strings";

// Preview-route chat panel. Mirrors the contract of src/components/chat.tsx
// but with the redesign's brutalist chrome. Uses useChat() against /api/chat,
// installs the same x-session-id fetch interceptor, renders the same 6
// tool-use cards, honors PDPA via localStorage, and caps at 20 user messages.
// Isolated from chat.tsx (watchlist file) — duplication is intentional for
// the Phase 1 sketch; cutover PR will refactor to share code.

const MAX_MESSAGES = 20;
const SESSION_ID_RE = /^[a-zA-Z0-9-]{1,64}$/;
const SESSION_KEY = "chat-session-id";
const PDPA_KEY = "pdpa-consent";

function installSessionIdFetchOverride(): () => void {
  if (typeof window === "undefined") return () => {};
  const original = window.fetch;
  function getOrCreateSid(): string {
    try {
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid || !SESSION_ID_RE.test(sid)) {
        sid = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch {
      return "";
    }
  }
  const patched: typeof fetch = async (input, init) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      const method = (
        init?.method ||
        (input as Request)?.method ||
        "GET"
      ).toUpperCase();
      if (method === "POST" && url.includes("/api/chat")) {
        const sid = getOrCreateSid();
        if (sid) {
          const headers = new Headers(
            init?.headers || (input as Request)?.headers,
          );
          headers.set("x-session-id", sid);
          init = { ...(init || {}), headers };
        }
      }
    } catch {
      // never break the underlying fetch
    }
    return original(input as RequestInfo, init);
  };
  window.fetch = patched;
  return () => {
    if (window.fetch === patched) window.fetch = original;
  };
}

function readToolInput<T extends Record<string, unknown>>(part: unknown): T {
  if (typeof part !== "object" || part === null) return {} as T;
  const p = part as Record<string, unknown>;
  const candidate = p.args ?? p.input;
  if (typeof candidate === "object" && candidate !== null) {
    return candidate as T;
  }
  return {} as T;
}

export function ChatPanel({ lang }: { lang: Lang }) {
  const t = STR[lang];
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const [consented, setConsented] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return installSessionIdFetchOverride();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
      setConsented(localStorage.getItem(PDPA_KEY) === "yes");
    } catch {}
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [messages]);

  // Note: NO auto-focus on consented-on-mount. Auto-focusing the chat input
  // when the chat is embedded in the middle of a longer page (the /preview
  // layout) causes the browser to scroll past the hero to bring the input
  // into view. Bug found 2026-04-25 mobile audit. Focus only fires on the
  // explicit consent click below.

  function onConsent() {
    try {
      localStorage.setItem(PDPA_KEY, "yes");
    } catch {}
    setConsented(true);
    inputRef.current?.focus();
  }

  const isLoading = status === "submitted" || status === "streaming";
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isLimitReached = userMessageCount >= MAX_MESSAGES;

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

  if (!consented) {
    return (
      <div className="border border-white p-6 bg-black text-white">
        <div className="font-mono text-[11px] tracking-[0.3em] opacity-60 mb-3.5">
          [ PDPA_CONSENT ]
        </div>
        <p className="font-mono text-[13px] leading-relaxed m-0 mb-4 [text-wrap:pretty]">
          {t.pdpa}
        </p>
        <button
          onClick={onConsent}
          className="bg-white text-black border-none px-5 py-2.5 font-mono text-xs tracking-[0.18em] cursor-pointer min-h-[44px]"
        >
          {t.pdpa_accept}
        </button>
      </div>
    );
  }

  return (
    <div className="border border-white bg-black text-white flex flex-col h-[600px]">
      <div className="border-b border-white px-3.5 py-2.5 flex justify-between items-center font-mono text-[11px] tracking-[0.18em]">
        <span>:: CHAT_v2 · sonnet · edge</span>
        <span className="opacity-60">
          {userMessageCount}/{MAX_MESSAGES} ·{" "}
          {isLimitReached ? "cap" : "ok"}
        </span>
      </div>
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        aria-atomic="false"
        className="flex-1 overflow-auto p-4 font-mono text-[13px]"
      >
        {messages.length === 0 && (
          <div>
            <div className="opacity-70 mb-3.5 leading-relaxed [text-wrap:pretty]">
              {t.welcome}
            </div>
            <div className="opacity-55 mb-3.5 tracking-[0.06em]">
              {t.chat_help}
            </div>
            <div className="flex flex-col gap-2">
              {t.suggest.map((s) => (
                <button
                  key={s}
                  onClick={() => sendSuggestion(s)}
                  className="text-left border border-white/45 bg-transparent text-white px-3 py-2.5 font-mono text-xs cursor-pointer tracking-[0.04em] min-h-[36px]"
                >
                  &gt; {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="mb-3.5">
            <div className="opacity-50 text-[10px] tracking-[0.2em] mb-1">
              {msg.role === "user" ? "YOU //" : "PREMPAWEE //"}
            </div>
            {msg.parts.map((part, i) => {
              const partKey = `${msg.id}-${i}`;
              if (part.type === "text") {
                if (msg.role === "user") {
                  return (
                    <div
                      key={partKey}
                      className="border border-white/35 px-3 py-2 max-w-[85%] ml-auto leading-relaxed [text-wrap:pretty]"
                    >
                      {part.text}
                    </div>
                  );
                }
                return (
                  <div
                    key={partKey}
                    className="leading-relaxed [text-wrap:pretty] whitespace-pre-wrap"
                  >
                    {part.text.split(/\*\*(.*?)\*\*/g).map((seg, j) =>
                      j % 2 === 1 ? (
                        <strong
                          key={`${partKey}-b-${j}`}
                          className="text-white font-bold"
                        >
                          {seg}
                        </strong>
                      ) : (
                        <span key={`${partKey}-t-${j}`}>{seg}</span>
                      ),
                    )}
                  </div>
                );
              }
              if (part.type === "tool-show_pricing") {
                const inp = readToolInput<{ highlight?: string }>(part);
                const hl =
                  inp.highlight === "starter" ||
                  inp.highlight === "pro" ||
                  inp.highlight === "enterprise"
                    ? inp.highlight
                    : undefined;
                return <PricingCard key={partKey} highlight={hl} />;
              }
              if (part.type === "tool-show_portfolio") {
                return <PortfolioOverviewCard key={partKey} />;
              }
              if (part.type === "tool-show_case_study") {
                const inp = readToolInput<{ project?: unknown }>(part);
                const project =
                  typeof inp.project === "string" ? inp.project : undefined;
                return <CaseStudyCard key={partKey} project={project} />;
              }
              if (part.type === "tool-show_tech_stack") {
                return <TechStackCard key={partKey} />;
              }
              if (part.type === "tool-show_contact") {
                return <ContactCard key={partKey} lang={lang} />;
              }
              if (part.type === "tool-capture_lead") {
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
        {isLoading && (
          <div className="opacity-70 text-xs">
            retrieving<span className="animate-pulse">…</span>
          </div>
        )}
      </div>
      <form
        onSubmit={onSubmit}
        className="border-t border-white flex"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isLimitReached ? t.cap_reached : t.placeholder
          }
          disabled={isLoading || isLimitReached}
          maxLength={4000}
          aria-label="Chat input"
          className="flex-1 bg-transparent border-none text-white px-4 py-3.5 font-mono text-[13px] outline-none placeholder:text-white/55 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || isLimitReached || !input.trim()}
          className="bg-white text-black border-none px-5 font-mono text-xs tracking-[0.18em] cursor-pointer disabled:opacity-40 min-w-[80px]"
        >
          {t.send} ↵
        </button>
      </form>
    </div>
  );
}
