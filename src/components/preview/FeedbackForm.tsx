"use client";

import { useId, useState } from "react";
import { STR, type Lang } from "./preview-strings";
import {
  FEEDBACK_TYPES,
  type FeedbackType,
} from "@/lib/feedback-types";

// Inline form rendered inside Footer.tsx when the visitor clicks
// "GIVE FEEDBACK". Owns all form state. Submits to /api/feedback.
// On success, replaces fields with a thank-you confirmation that
// the parent Footer collapses on close-button click.
//
// Spec: docs/superpowers/specs/2026-04-26-feedback-button-design.md

type Status = "idle" | "submitting" | "done" | "error";

interface Props {
  lang: Lang;
  onClose: () => void;
}

export function FeedbackForm({ lang, onClose }: Props) {
  const t = STR[lang];
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const typeId = useId();
  const bodyId = useId();
  const emailId = useId();
  const statusId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          body: body.trim(),
          email: email.trim() || undefined,
          website: website.trim() || undefined,
        }),
      });
      if (res.ok) {
        setStatus("done");
        return;
      }
      // Error branch — map status code to localized message
      if (res.status === 429) {
        setErrorMsg(t.feedback_error_rate_limited);
      } else if (res.status === 400) {
        setErrorMsg(t.feedback_error_validation);
      } else {
        setErrorMsg(t.feedback_error);
      }
      setStatus("error");
    } catch {
      setErrorMsg(t.feedback_error);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div
        id={statusId}
        aria-live="polite"
        className="border-t border-white/15 mt-6 pt-6 text-sm text-white"
      >
        <div className="font-mono text-[11px] tracking-[0.3em] opacity-60 mb-3">
          {t.feedback_kicker}
        </div>
        <p className="mb-4 leading-relaxed">{t.feedback_thanks}</p>
        <button
          type="button"
          onClick={onClose}
          className="border border-white px-4 py-2 font-mono text-xs tracking-[0.18em] cursor-pointer min-h-[44px] hover:bg-white hover:text-black transition-colors"
          data-cursor="hover"
        >
          {t.feedback_close}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-white/15 mt-6 pt-6 flex flex-col gap-4 text-sm text-white"
      noValidate
    >
      <div className="font-mono text-[11px] tracking-[0.3em] opacity-60">
        {t.feedback_kicker}
      </div>

      {/* Type selector */}
      <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
        <legend
          id={typeId}
          className="font-mono text-[11px] tracking-[0.18em] opacity-70 mb-1"
        >
          {t.feedback_type_label}
        </legend>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-labelledby={typeId}
        >
          {FEEDBACK_TYPES.map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={type === opt}
              onClick={() => setType(opt)}
              className="border border-white px-3 py-1.5 font-mono text-xs tracking-[0.1em] cursor-pointer min-h-[44px] min-w-[44px] transition-colors"
              style={{
                background: type === opt ? "#fff" : "transparent",
                color: type === opt ? "#000" : "#fff",
              }}
              data-cursor="hover"
            >
              {t.feedback_types[opt]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Body */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={bodyId}
          className="font-mono text-[11px] tracking-[0.18em] opacity-70"
        >
          {t.feedback_body_label}
        </label>
        <textarea
          id={bodyId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.feedback_body_placeholder}
          required
          maxLength={4000}
          rows={4}
          className="bg-transparent border border-white/20 text-white px-3 py-2 font-mono text-[13px] outline-none focus:border-white placeholder:text-white/40 resize-y min-h-[100px]"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={emailId}
          className="font-mono text-[11px] tracking-[0.18em] opacity-70"
        >
          {t.feedback_email_label}{" "}
          <span className="opacity-50 normal-case tracking-normal">
            {t.feedback_email_help}
          </span>
        </label>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.feedback_email_placeholder}
          maxLength={254}
          autoComplete="email"
          className="bg-transparent border border-white/20 text-white px-3 py-2 font-mono text-[13px] outline-none focus:border-white placeholder:text-white/40 min-h-[44px]"
        />
      </div>

      {/* Honeypot — off-screen, aria-hidden, never tab-focusable. Real
          users never see this; bots auto-fill anything labeled "website". */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor="fb-website">Website</label>
        <input
          id="fb-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Consent line */}
      <p className="text-[11px] leading-relaxed opacity-60 [text-wrap:pretty]">
        {t.feedback_consent}
      </p>

      {/* Error region (aria-live so screen readers announce) */}
      {status === "error" && errorMsg && (
        <p
          id={statusId}
          aria-live="polite"
          className="text-[12px] text-red-400 [text-wrap:pretty]"
        >
          {errorMsg}
        </p>
      )}

      {/* Submit + close */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          aria-busy={status === "submitting"}
          disabled={status === "submitting"}
          className="border border-white bg-white text-black px-4 py-2 font-mono text-xs tracking-[0.18em] cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
          data-cursor="hover"
        >
          {status === "submitting" ? t.feedback_submitting : t.feedback_submit}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border border-white/40 px-4 py-2 font-mono text-xs tracking-[0.18em] cursor-pointer min-h-[44px] hover:border-white transition-colors"
          data-cursor="hover"
        >
          {t.feedback_close}
        </button>
      </div>
    </form>
  );
}
