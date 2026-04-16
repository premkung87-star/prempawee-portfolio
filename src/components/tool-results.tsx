"use client";

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
                  <span className="text-[#555] mr-1">→</span> {f}
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
                    <span className="text-[#666] mr-1" aria-hidden="true">
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
                <span className="text-[#666]">Stack:</span>{" "}
                {p.tech.join(" · ")}
              </p>
              <p className="text-[10px] text-[#888] leading-relaxed mt-1">
                <span className="text-[#666]">Depth:</span> {p.depth}
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
          <span className="text-[10px] uppercase tracking-[2px] text-[#555] block mb-2">
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
            <p className="text-[10px] uppercase tracking-[2px] text-[#555]">
              Features Built
            </p>
            {NWL_FEATURES.map((f, i) => (
              <p key={i} className="text-xs text-[#888]">
                <span className="text-[#555] mr-1">→</span> {f}
              </p>
            ))}
          </div>
          <p className="text-[10px] text-[#666] mt-3">
            <span className="text-[#555]">Stack:</span> Next.js · Supabase ·
            Tailwind CSS · Vercel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 border border-white/10 rounded overflow-hidden">
      <div className="p-4 bg-white/[0.02]">
        <span className="text-[10px] uppercase tracking-[2px] text-[#555] block mb-2">
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
              <div className="text-[10px] text-[#666] uppercase tracking-[1px]">
                {m.label}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[2px] text-[#555]">
            Features Built
          </p>
          {VERDEX_FEATURES.map((f, i) => (
            <p key={i} className="text-xs text-[#888]">
              <span className="text-[#555] mr-1">→</span> {f}
            </p>
          ))}
        </div>
        <p className="text-[10px] text-[#666] mt-3">
          <span className="text-[#555]">Stack:</span> Cloudflare Workers ·
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
      <span className="text-[10px] uppercase tracking-[2px] text-[#555] block mb-3">
        Tech Stack
      </span>
      <div className="grid grid-cols-2 gap-3">
        {TECH_STACK.map((t) => (
          <div key={t.name}>
            <div className="text-white text-sm">{t.name}</div>
            <div className="text-[#666] text-[11px]">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactCard() {
  return (
    <div className="my-3 border border-white/10 rounded p-4 bg-white/[0.02]">
      <span className="text-[10px] uppercase tracking-[2px] text-[#555] block mb-3">
        Get In Touch
      </span>
      <div className="space-y-3">
        <div>
          <div className="text-[#666] text-[11px] mb-1">LINE</div>
          <div className="text-white text-sm">{CONTACT.line}</div>
        </div>
        <div>
          <div className="text-[#666] text-[11px] mb-1">Email</div>
          <a
            href={`mailto:${CONTACT.email}`}
            className="text-white text-sm underline underline-offset-2 decoration-white/30 hover:decoration-white/60 transition-colors"
          >
            {CONTACT.email}
          </a>
        </div>
        <div>
          <div className="text-[#666] text-[11px] mb-1">LinkedIn</div>
          <a
            href={CONTACT.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-sm underline underline-offset-2 decoration-white/30 hover:decoration-white/60 transition-colors"
          >
            linkedin.com/in/prempawee
          </a>
        </div>
        <div>
          <div className="text-[#666] text-[11px] mb-1">Fastwork</div>
          <a
            href={CONTACT.fastwork}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-sm underline underline-offset-2 decoration-white/30 hover:decoration-white/60 transition-colors"
          >
            View packages on Fastwork
          </a>
        </div>
        <p className="text-[#888] text-xs mt-2">
          Free consultation — tell me about your business and I will recommend
          the right package. Reply within {CONTACT.responseTime}.
        </p>
      </div>
    </div>
  );
}
