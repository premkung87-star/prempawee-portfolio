"use client";

import { useState } from "react";
import {
  PACKAGES,
  PROJECTS,
  PORTFOLIO_METRICS,
  TECH_STACK,
  VERDEX_METRICS,
  VERDEX_FEATURES,
  NWL_FEATURES,
  CONTACT,
} from "@/lib/portfolio-data";

export function PricingCard({
  highlight,
}: {
  highlight?: "starter" | "pro" | "enterprise";
}) {
  return (
    <div className="my-3 space-y-3">
      {PACKAGES.map((pkg) => {
        const isHighlighted = highlight === pkg.id;
        return (
          <div
            key={pkg.id}
            className={`border rounded p-4 transition-colors ${
              isHighlighted
                ? "border-white/30 bg-white/[0.04]"
                : "border-white/10 bg-white/[0.01]"
            }`}
          >
            <div className="flex items-baseline justify-between mb-1">
              <div>
                {isHighlighted && (
                  <span className="text-[10px] uppercase tracking-[2px] text-[#999] block mb-1">
                    Recommended
                  </span>
                )}
                <span className="text-white text-sm font-medium">
                  {pkg.name}
                </span>
              </div>
              <span className="text-white text-lg">{pkg.price}</span>
            </div>
            <p className="text-[#999] text-xs mb-3">
              {pkg.desc} — {pkg.delivery}
            </p>
            <ul className="space-y-1">
              {pkg.features.map((f, i) => (
                <li key={i} className="text-xs text-[#888]">
                  <span className="text-[#888] mr-1">→</span> {f}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function PortfolioOverviewCard() {
  return (
    <section
      className="my-3 border border-white/10 rounded overflow-hidden"
      aria-labelledby="portfolio-overview-heading"
    >
      <div className="p-4 bg-white/[0.02]">
        <h3
          id="portfolio-overview-heading"
          className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3"
        >
          Portfolio Overview
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-5 pb-4 border-b border-white/5">
          {PORTFOLIO_METRICS.map((m) => (
            <div
              key={m.label}
              role="group"
              aria-label={`${m.value} ${m.label}`}
              className="text-center"
            >
              <div className="text-white text-lg">{m.value}</div>
              <div className="text-[10px] text-[#888] uppercase tracking-[1px]">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {PROJECTS.map((p) => (
            <div key={p.id}>
              <h4 className="text-white text-sm font-medium mb-1">
                {p.name}
              </h4>
              <p className="text-[#aaa] text-xs leading-relaxed mb-2">
                {p.tagline}
              </p>
              <ul className="space-y-0.5 mb-2">
                {p.components.map((c, i) => (
                  <li key={i} className="text-xs text-[#aaa]">
                    <span className="text-[#888] mr-1" aria-hidden="true">
                      →
                    </span>
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60 transition-colors"
                      >
                        {c.label}
                      </a>
                    ) : (
                      <span className="text-[#ccc]">{c.label}</span>
                    )}
                    {c.note && (
                      <span className="text-[#888]"> — {c.note}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-[#888] leading-relaxed">
                <span className="text-[#888]">Stack:</span>{" "}
                {p.tech.join(" · ")}
              </p>
              <p className="text-[10px] text-[#888] leading-relaxed mt-1">
                <span className="text-[#888]">Depth:</span> {p.depth}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#888] mt-5 pt-3 border-t border-white/5 leading-relaxed">
          3 projects · 6 web properties · 1 LINE bot · all live.
        </p>
      </div>
    </section>
  );
}

export function CaseStudyCard({
  project,
}: {
  project?: string;
}) {
  const safeProject: "verdex" | "nwl_club" =
    project === "nwl_club" ? "nwl_club" : "verdex";

  if (safeProject === "nwl_club") {
    return (
      <div className="my-3 border border-white/10 rounded overflow-hidden">
        <div className="p-4 bg-white/[0.02]">
          <span className="text-[10px] uppercase tracking-[2px] text-[#888] block mb-2">
            Case Study
          </span>
          <h3 className="text-white text-base mb-2">
            NWL CLUB — Streetwear Brand Digital Ops
          </h3>
          <p className="text-[#888] text-xs leading-relaxed mb-4">
            Built 2 production web applications for NWL, a streetwear brand
            from Bangkok. Work Tracker handles employee check-in and work
            logging; Community Website serves the brand&apos;s customer
            community. Both running on Vercel.
          </p>
          <div className="space-y-2 mb-4">
            <a
              href="https://nwl-work-tracker.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60 transition-colors"
            >
              nwl-work-tracker.vercel.app
            </a>
            <a
              href="https://nwl-club-website.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60 transition-colors"
            >
              nwl-club-website.vercel.app
            </a>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[2px] text-[#888]">
              Features Built
            </p>
            {NWL_FEATURES.map((f, i) => (
              <p key={i} className="text-xs text-[#888]">
                <span className="text-[#888] mr-1">→</span> {f}
              </p>
            ))}
          </div>
          <p className="text-[10px] text-[#888] mt-3">
            <span className="text-[#888]">Stack:</span> Next.js · Supabase ·
            Tailwind CSS · Vercel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 border border-white/10 rounded overflow-hidden">
      <div className="p-4 bg-white/[0.02]">
        <span className="text-[10px] uppercase tracking-[2px] text-[#888] block mb-2">
          Case Study
        </span>
        <h3 className="text-white text-base mb-2">
          VerdeX Farm — AI Smart Greenhouse
        </h3>
        <p className="text-[#888] text-xs leading-relaxed mb-4">
          Built a complete LINE OA system for a smart greenhouse growing sweet
          basil (DWC Hydroponics) in Chiang Mai. The bot handles customer
          ordering, farm monitoring, stock management, and generates weekly AI
          analysis reports using Claude Opus.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {VERDEX_METRICS.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-white text-lg">{m.value}</div>
              <div className="text-[10px] text-[#888] uppercase tracking-[1px]">
                {m.label}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[2px] text-[#888]">
            Features Built
          </p>
          {VERDEX_FEATURES.map((f, i) => (
            <p key={i} className="text-xs text-[#888]">
              <span className="text-[#888] mr-1">→</span> {f}
            </p>
          ))}
        </div>
        <p className="text-[10px] text-[#888] mt-3">
          <span className="text-[#888]">Stack:</span> Cloudflare Workers ·
          Supabase · Claude Opus · LINE API
        </p>
        <div className="mt-3 space-y-1 pt-3 border-t border-white/5">
          <a
            href="https://verdex-web.verdexfarm.workers.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60 transition-colors"
          >
            verdex-web.verdexfarm.workers.dev
          </a>
          <a
            href="https://verdex-app.verdexfarm.workers.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60 transition-colors"
          >
            verdex-app.verdexfarm.workers.dev
          </a>
        </div>
      </div>
    </div>
  );
}

export function TechStackCard() {
  return (
    <div className="my-3 border border-white/10 rounded p-4 bg-white/[0.02]">
      <span className="text-[10px] uppercase tracking-[2px] text-[#888] block mb-3">
        Tech Stack
      </span>
      <div className="grid grid-cols-2 gap-3">
        {TECH_STACK.map((t) => (
          <div key={t.name}>
            <div className="text-white text-sm">{t.name}</div>
            <div className="text-[#888] text-[11px]">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadCaptureCard({
  id,
  name,
  email,
  line_id,
  package_interest,
  error,
  message,
}: {
  id?: number;
  name?: string | null;
  email?: string | null;
  line_id?: string | null;
  package_interest?: string | null;
  error?: string;
  message?: string;
}) {
  if (error) {
    return (
      <div className="my-3 border border-red-500/20 rounded p-4 bg-red-500/5">
        <span className="text-[10px] uppercase tracking-[2px] text-red-400 block mb-2">
          Lead capture · issue
        </span>
        <p className="text-[13px] text-red-300 leading-relaxed">
          {message ??
            "Something went wrong saving your info. Please reach out directly."}
        </p>
      </div>
    );
  }

  return (
    <div className="my-3 border border-white/20 rounded p-4 bg-white/[0.04]">
      <span className="text-[10px] uppercase tracking-[2px] text-[#aaa] block mb-2">
        Lead recorded · confirmation #{id ?? "–"}
      </span>
      <p className="text-[13px] text-white leading-relaxed mb-3">
        {name ? `Thanks, ${name}. ` : "Thanks. "}
        Your interest has been logged. Prempawee will reach out shortly
        {CONTACT.responseTime ? ` (typically within ${CONTACT.responseTime})` : ""}.
      </p>
      <div className="space-y-1 text-xs text-[#aaa]">
        {email ? (
          <div>
            <span className="text-[#888]">Email:</span>{" "}
            <span className="text-[#ccc]">{email}</span>
          </div>
        ) : null}
        {line_id ? (
          <div>
            <span className="text-[#888]">LINE:</span>{" "}
            <span className="text-[#ccc]">{line_id}</span>
          </div>
        ) : null}
        {package_interest ? (
          <div>
            <span className="text-[#888]">Interested in:</span>{" "}
            <span className="text-[#ccc] uppercase">{package_interest}</span>
          </div>
        ) : null}
      </div>
      <p className="text-[11px] text-[#888] mt-3 pt-3 border-t border-white/5">
        If you need immediate contact:{" "}
        <a
          href={`mailto:${CONTACT.email}`}
          className="text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60"
        >
          {CONTACT.email}
        </a>
      </p>
    </div>
  );
}

const CONTACT_COPY = {
  en: {
    header: "Get In Touch",
    formLabel: "Or have Prempawee reach out",
    emailPlaceholder: "your@email.com",
    messageLabel: "Anything specific? (optional)",
    messagePlaceholder: "Tell me about your business...",
    submit: "Send",
    submitting: "Sending...",
    success: "Thanks! Prempawee will reply within 2-4 hours.",
    errorGeneric: "Couldn't save — please use LINE or email above.",
    errorRateLimit: "Too many submissions. Try LINE or email above.",
    errorValidation: "Please enter a valid email.",
    consultation:
      "Free consultation — tell me about your business and I will recommend the right package. Reply within 2-4 hours.",
  },
  th: {
    header: "ติดต่อ",
    formLabel: "หรือให้ Prempawee ติดต่อกลับ",
    emailPlaceholder: "อีเมลของคุณ",
    messageLabel: "อยากบอกอะไรเพิ่มเติมมั้ย? (ไม่บังคับ)",
    messagePlaceholder: "เล่าเรื่องธุรกิจของคุณ...",
    submit: "ส่ง",
    submitting: "กำลังส่ง...",
    success: "ขอบคุณครับ Prempawee จะตอบกลับใน 2-4 ชม.",
    errorGeneric: "ส่งไม่สำเร็จ — กรุณาติดต่อทาง LINE หรืออีเมลด้านบน",
    errorRateLimit: "ส่งบ่อยเกินไป กรุณาติดต่อทาง LINE หรืออีเมลด้านบน",
    errorValidation: "กรุณาใส่อีเมลให้ถูกต้อง",
    consultation:
      "ปรึกษาฟรี — เล่าเรื่องธุรกิจมา ผมจะแนะนำแพ็คเกจที่เหมาะ ตอบกลับภายใน 2-4 ชม.",
  },
} as const;

type ContactFormStatus = "idle" | "submitting" | "success" | "error";

export function ContactCard({ lang = "en" }: { lang?: "en" | "th" }) {
  const copy = CONTACT_COPY[lang];
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ContactFormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const busy = status === "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = email.trim();
    // Minimal client-side validation — server re-validates with zod.
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setErrorMsg(copy.errorValidation);
      return;
    }
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          message: message.trim().slice(0, 2000) || undefined,
          source: "contact_card_inline",
        }),
      });
      if (res.ok) {
        setStatus("success");
        return;
      }
      if (res.status === 429) {
        setStatus("error");
        setErrorMsg(copy.errorRateLimit);
        return;
      }
      setStatus("error");
      setErrorMsg(copy.errorGeneric);
    } catch {
      setStatus("error");
      setErrorMsg(copy.errorGeneric);
    }
  }

  return (
    <div className="my-3 border border-white/10 rounded p-4 bg-white/[0.02]">
      <span className="text-[10px] uppercase tracking-[2px] text-[#888] block mb-3">
        {copy.header}
      </span>
      <div className="space-y-3">
        <div>
          <div className="text-[#888] text-[11px] mb-1">LINE</div>
          <div className="text-white text-sm">{CONTACT.line}</div>
        </div>
        <div>
          <div className="text-[#888] text-[11px] mb-1">Email</div>
          <a
            href={`mailto:${CONTACT.email}`}
            className="text-white text-sm underline underline-offset-2 decoration-white/30 hover:decoration-white/60 transition-colors"
          >
            {CONTACT.email}
          </a>
        </div>
        <div>
          <div className="text-[#888] text-[11px] mb-1">LinkedIn</div>
          <a
            href={CONTACT.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-sm underline underline-offset-2 decoration-white/30 hover:decoration-white/60 transition-colors"
          >
            linkedin.com/in/prempaweedevth
          </a>
        </div>
        <div>
          <div className="text-[#888] text-[11px] mb-1">Fastwork</div>
          <a
            href={CONTACT.fastwork}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-sm underline underline-offset-2 decoration-white/30 hover:decoration-white/60 transition-colors"
          >
            View packages on Fastwork
          </a>
        </div>
        <p className="text-[#888] text-xs mt-2">{copy.consultation}</p>
      </div>

      {/* Divider + inline one-field lead form. Skips when success state has
          replaced it. */}
      <div className="mt-4 pt-4 border-t border-white/10">
        {status === "success" ? (
          <p className="text-[#e0e0e0] text-sm text-center py-2">
            <span aria-hidden="true">✓ </span>
            {copy.success}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-2" noValidate>
            <label className="text-[#888] text-[11px] block">
              {copy.formLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.emailPlaceholder}
              required
              maxLength={320}
              disabled={busy}
              aria-label={copy.emailPlaceholder}
              className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-white text-sm placeholder:text-[#666] outline-none focus:border-white/30 disabled:opacity-50"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={copy.messagePlaceholder}
              maxLength={2000}
              rows={2}
              disabled={busy}
              aria-label={copy.messageLabel}
              className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-white text-sm placeholder:text-[#666] outline-none focus:border-white/30 disabled:opacity-50 resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              {status === "error" && errorMsg ? (
                <span
                  role="alert"
                  className="text-red-400 text-[11px] leading-tight"
                >
                  {errorMsg}
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 px-4 py-1.5 text-sm text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {busy ? copy.submitting : copy.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
