import type { Metadata } from "next";
import Link from "next/link";
import {
  PACKAGES,
  PROJECTS,
  PORTFOLIO_METRICS,
  VERDEX_METRICS,
  VERDEX_FEATURES,
  NWL_FEATURES,
  CONTACT,
} from "@/lib/portfolio-data";

export const metadata: Metadata = {
  title: "PREMPAWEE // Portfolio — Offline Mode",
  description:
    "Solo AI Developer in Chiang Mai. View the full portfolio, pricing, case studies, and contact info while the AI chat is offline.",
};

export default function FallbackPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0a] bg-grid">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-sm tracking-[3px] uppercase text-white">
          PREMPAWEE <span className="text-[#888]">{"// AI"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#888]" />
          Offline
        </div>
      </header>

      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <p className="text-[#aaa] text-xs text-center leading-relaxed max-w-[800px] mx-auto">
          The AI chat is temporarily offline. Everything I usually show through
          the conversation is below — browse the portfolio or contact me
          directly.
        </p>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-8 max-w-[800px] w-full mx-auto">
        {/* Bio */}
        <section className="mb-10">
          <h2 className="text-[10px] uppercase tracking-[2px] text-[#888] mb-2">
            About
          </h2>
          <p className="text-[15px] text-[#ccc] leading-relaxed max-w-[85%]">
            I&apos;m{" "}
            <strong className="text-white font-medium">Prempawee</strong>, a{" "}
            <strong className="text-white font-medium">
              Solo AI Developer
            </strong>{" "}
            based in Chiang Mai, shipping{" "}
            <strong className="text-white font-medium">
              production systems
            </strong>{" "}
            for Thai businesses &mdash; LINE chatbots, admin dashboards, IoT
            platforms, AI agents. All Claude-powered, deployed, and live.
          </p>
        </section>

        {/* Portfolio Overview — breadth-first */}
        <section className="mb-10" aria-labelledby="portfolio-overview-h">
          <h2
            id="portfolio-overview-h"
            className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3"
          >
            Portfolio Overview
          </h2>
          <div className="border border-white/10 rounded overflow-hidden bg-white/[0.02]">
            <div className="p-4">
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
                    <h3 className="text-white text-sm font-medium mb-1">
                      {p.name}
                    </h3>
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
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-10">
          <h2 className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3">
            Packages
          </h2>
          <div className="space-y-3">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`border rounded p-4 ${
                  pkg.id === "pro"
                    ? "border-white/30 bg-white/[0.04]"
                    : "border-white/10 bg-white/[0.01]"
                }`}
              >
                <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
                  <div>
                    {pkg.id === "pro" && (
                      <span className="text-[10px] uppercase tracking-[2px] text-[#aaa] block mb-1">
                        Most Popular
                      </span>
                    )}
                    <span className="text-white text-sm font-medium">
                      {pkg.name}
                    </span>
                  </div>
                  <span className="text-white text-lg">{pkg.price}</span>
                </div>
                <p className="text-[#aaa] text-xs mb-3">
                  {pkg.desc} &mdash; {pkg.delivery}
                </p>
                <ul className="space-y-1">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="text-xs text-[#888]">
                      <span className="text-[#888] mr-1">&rarr;</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* VerdeX case study */}
        <section className="mb-10">
          <h2 className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3">
            Case Study — VerdeX Farm
          </h2>
          <div className="border border-white/10 rounded overflow-hidden">
            <div className="p-4 bg-white/[0.02]">
              <h3 className="text-white text-base mb-2">
                VerdeX Farm &mdash; AI Smart Greenhouse
              </h3>
              <p className="text-[#aaa] text-xs leading-relaxed mb-4">
                A complete LINE OA system for a smart greenhouse growing sweet
                basil (DWC Hydroponics) in Chiang Mai. The bot handles customer
                ordering, farm monitoring, stock management, and generates
                weekly AI analysis reports using Claude Opus.
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
                    <span className="text-[#888] mr-1">&rarr;</span> {f}
                  </p>
                ))}
              </div>
              <p className="text-[10px] text-[#888] mt-3">
                <span className="text-[#888]">Stack:</span> Cloudflare Workers
                &middot; Supabase &middot; Claude Opus &middot; LINE API
              </p>
            </div>
          </div>
        </section>

        {/* NWL CLUB case study */}
        <section className="mb-10">
          <h2 className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3">
            Case Study — NWL CLUB
          </h2>
          <div className="border border-white/10 rounded overflow-hidden">
            <div className="p-4 bg-white/[0.02]">
              <h3 className="text-white text-base mb-2">
                NWL CLUB &mdash; Streetwear Brand Digital Ops
              </h3>
              <p className="text-[#aaa] text-xs leading-relaxed mb-4">
                Two production web applications for NWL, a streetwear brand
                from Bangkok. Work Tracker handles employee check-in and work
                logging; Community Website serves the brand&apos;s customer
                community.
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
                    <span className="text-[#888] mr-1">&rarr;</span> {f}
                  </p>
                ))}
              </div>
              <p className="text-[10px] text-[#888] mt-3">
                <span className="text-[#888]">Stack:</span> Next.js &middot;
                Supabase &middot; Tailwind CSS &middot; Vercel
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3">
            Get In Touch
          </h2>
          <div className="border border-white/10 rounded p-4 bg-white/[0.02]">
            <div className="space-y-3">
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
                <div className="text-[#888] text-[11px] mb-1">LINE</div>
                <div className="text-white text-sm">{CONTACT.line}</div>
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
              <p className="text-[#aaa] text-xs mt-2">
                Free consultation &mdash; tell me about your business and I
                will recommend the right package. Reply within{" "}
                {CONTACT.responseTime}.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-white/10 px-4 py-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between text-[11px] text-[#888]">
          <span>&copy; {new Date().getFullYear()} Prempawee</span>
          <Link
            href="/"
            className="text-white/60 hover:text-white/80 transition-colors underline underline-offset-2"
          >
            Try AI chat &rarr;
          </Link>
        </div>
      </footer>
    </div>
  );
}
