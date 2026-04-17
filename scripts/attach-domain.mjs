// One-shot: attach a custom domain to the Vercel project.
// Run this after you've (1) purchased the domain and (2) pointed DNS at
// Vercel (either nameservers OR A/CNAME records per their instructions).
//
// Usage:
//   DOMAIN=prempawee.com node scripts/attach-domain.mjs
//   DOMAIN=prempawee.com VERCEL_TOKEN=... node scripts/attach-domain.mjs
//
// Reads the Vercel auth token from ~/Library/Application Support/com.vercel.cli
// by default (matching `vercel whoami`). Pass VERCEL_TOKEN env to override.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const TEAM_ID = "team_Aiz7wItp92y8Ea5zqwGITwlv";
const PROJECT_ID = "prj_zZ0ai4TWyVZBDAc7wYOWhBKBrD0B";

function getToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const authPath = path.join(
    os.homedir(),
    "Library/Application Support/com.vercel.cli/auth.json",
  );
  if (!fs.existsSync(authPath)) {
    throw new Error(
      "No Vercel token. Run `vercel login` first, or pass VERCEL_TOKEN env.",
    );
  }
  const content = JSON.parse(fs.readFileSync(authPath, "utf8"));
  if (!content.token) throw new Error("auth.json has no token field");
  return content.token;
}

async function main() {
  const domain = process.env.DOMAIN;
  if (!domain) {
    console.error("DOMAIN env var required. Example:");
    console.error("  DOMAIN=prempawee.com node scripts/attach-domain.mjs");
    process.exit(1);
  }

  const token = getToken();
  const base = `https://api.vercel.com/v10/projects/${PROJECT_ID}/domains?teamId=${TEAM_ID}`;

  console.log(JSON.stringify({ level: "info", message: "attach.start", domain }));

  // Attach primary domain
  const res = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "attach.failed",
        status: res.status,
        error: json.error?.message ?? json,
      }),
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      level: "info",
      message: "attach.ok",
      domain: json.name,
      verified: json.verified,
      verification: json.verification ?? null,
    }),
  );

  if (!json.verified && json.verification?.length) {
    console.log(
      JSON.stringify({
        level: "warn",
        message: "attach.dns-required",
        instructions: json.verification,
        hint: "Add these DNS records at your registrar, then re-run. Vercel re-verifies automatically once DNS propagates.",
      }),
    );
  }

  // Also attach www variant (redirects to apex by default on Vercel)
  if (!domain.startsWith("www.")) {
    const wwwRes = await fetch(base, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: `www.${domain}` }),
    });
    const wwwJson = await wwwRes.json();
    console.log(
      JSON.stringify({
        level: wwwRes.ok ? "info" : "warn",
        message: wwwRes.ok ? "www.attach.ok" : "www.attach.noted",
        status: wwwRes.status,
        error: wwwRes.ok ? undefined : wwwJson.error?.message,
      }),
    );
  }

  console.log(
    JSON.stringify({
      level: "info",
      message: "next-steps",
      instructions: [
        "1. Verify DNS records at your registrar match the hints above (if any).",
        "2. Wait a few minutes for propagation + automatic Let's Encrypt cert.",
        "3. Visit https://" + domain + " and confirm TLS cert is valid.",
        "4. Submit to HSTS preload list: https://hstspreload.org/?domain=" + domain,
        "5. Run SSL Labs audit: https://www.ssllabs.com/ssltest/analyze.html?d=" + domain,
      ],
    }),
  );
}

await main();
