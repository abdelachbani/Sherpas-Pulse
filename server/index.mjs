/**
 * server/index.mjs
 *
 * Production-ready Sherpas Pulse backend:
 *  - WebSocket relay to AI proxy (/voice)
 *  - Case data REST API (/api/cases, /api/cases/:id, /api/cases/:id/brief)
 *  - Guardrail Router (/api/guard)
 *  - Vite dev proxy or static file serving
 *
 * Run: node server/index.mjs
 */

import { createServer } from "node:http";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket, WebSocketServer } from "ws";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// ── Env loading ────────────────────────────────────────────────────────────────
const envFile = join(root, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const PROXY_URL = (
  process.env.VITE_LLM_PROXY_URL ||
  process.env.LLM_PROXY_URL ||
  "https://llm-hackathon.sherpaswealth.com"
).replace(/\/$/, "");

const TEAM_KEY = process.env.VITE_TEAM_KEY || process.env.TEAM_KEY;
const PORT = Number(process.env.PORT || 3001); // 3001 so Vite keeps 5173
const VITE_PORT = Number(process.env.VITE_PORT || 5173);
const CASES_DIR = resolve(root, "cases");
const MODELS = ["gpt-realtime-2.1-mini", "gpt-realtime-2.1", "gemini-3.8-live"];

if (!TEAM_KEY || TEAM_KEY.includes("...")) {
  console.warn(
    "[server] Warning: VITE_TEAM_KEY not set in .env — voice sessions will fail.\n" +
      "         Copy .env.example to .env and add your team key."
  );
}

// ── Cases ──────────────────────────────────────────────────────────────────────

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const caseIds = existsSync(CASES_DIR)
  ? readdirSync(CASES_DIR)
      .filter((id) => existsSync(join(CASES_DIR, id, "financial-health.json")))
      .sort()
  : [];

function caseLabel(id) {
  const fh = readJson(join(CASES_DIR, id, "financial-health.json"));
  const adults = (fh?.case?.household ?? [])
    .filter((p) => p.role !== "child")
    .map((p) => p.first_name);
  return `${adults.join(" & ") || id}${fh?.case?.city ? `, ${fh.case.city}` : ""}${
    fh?.score ? ` (score ${fh.score.published_score})` : ""
  }`;
}

function caseSummary(id) {
  const fh = readJson(join(CASES_DIR, id, "financial-health.json"));
  const ia = readJson(join(CASES_DIR, id, "investment-analysis.json"));
  if (!fh) return null;
  return {
    id,
    label: caseLabel(id),
    household: fh.case.household,
    city: fh.case.city,
    state: fh.case.state,
    score: fh.score?.published_score,
    band: fh.score?.band,
    colour: fh.score?.colour,
    householdType: fh.case.household.some((m) => m.role === "co-client")
      ? "couple"
      : "single",
    topMove: fh.score?.top_moves?.[0] ?? null,
    hasInvestmentAnalysis: !!ia,
  };
}

/**
 * Full case brief injected into the voice session.
 * Includes all numbers from both JSON files.
 */
function caseBrief(id) {
  const fh = readJson(join(CASES_DIR, id, "financial-health.json"));
  const ia = readJson(join(CASES_DIR, id, "investment-analysis.json"));
  if (!fh) return "";

  const people = (fh.case?.household ?? [])
    .map((p) => `${p.first_name} (${p.role}, age ${p.age}${p.retirement_age ? `, retiring at ${p.retirement_age}` : ""})`)
    .join(", ");

  const pillars = (fh.score?.pillars ?? [])
    .map((p) => `${p.pillar}: ${p.score}/100`)
    .join("; ");

  const topMoves = (fh.score?.top_moves ?? [])
    .slice(0, 3)
    .map((m, i) => `  ${i + 1}. ${m.title}: ${m.action} (${m.target_amount != null ? `target: $${m.target_amount.toLocaleString()}, ` : ""}score ${m.score_before}→${m.score_after})`)
    .join("\n");

  const caps = (fh.score?.caps_applied ?? [])
    .map((c) => `${c.reason} (capped at ${c.score_capped_at})`)
    .join("; ");

  const goals = (fh.goals?.goalsSummary ?? [])
    .map((g) => `${g.goalType}${g.subType ? `/${g.subType}` : ""}: ${g.value}${g.amount ? ` ($${g.amount.toLocaleString()})` : ""}`)
    .join("; ");

  const totalInvested = (ia?.positions ?? []).reduce(
    (sum, p) => sum + (typeof p.value === "number" ? p.value : 0),
    0
  );

  const lines = [
    `You are a Sherpas financial guide talking to this household about their financial plan.`,
    `Use ONLY the figures below — never invent numbers. Keep answers short and conversational.`,
    ``,
    `=== HOUSEHOLD ===`,
    `Members: ${people}`,
    `Location: ${fh.case?.city ?? ""}, ${fh.case?.state ?? ""}`,
    ``,
    `=== FINANCIAL HEALTH ===`,
    `Score: ${fh.score?.published_score}/100 (${fh.score?.band} · ${fh.score?.colour})`,
    `Pillars: ${pillars}`,
    caps ? `Score caps: ${caps}` : null,
    ``,
    fh.score?.message ? `Score message: "${fh.score.message}"` : null,
    ``,
    `=== TOP MOVES ===`,
    topMoves,
    ``,
    goals ? `=== GOALS ===\n${goals}` : null,
    ``,
    fh.narrative?.summary_main
      ? `=== PLAN SUMMARY ===\n${fh.narrative.summary_main}`
      : null,
    fh.narrative?.summary_recommendations
      ? `=== RECOMMENDATIONS ===\n${fh.narrative.summary_recommendations}`
      : null,
    ``,
    totalInvested > 0
      ? `=== INVESTMENTS ===\nTotal invested: $${totalInvested.toLocaleString()}`
      : null,
    ia?.narrative?.summary_main
      ? `Investment summary: ${ia.narrative.summary_main}`
      : null,
  ];

  return lines.filter(Boolean).join("\n");
}

// ── Guardrail keywords ─────────────────────────────────────────────────────────

const OFF_PLAN_PATTERNS = [
  /bitcoin/i,
  /crypto/i,
  /cryptocurrency/i,
  /stock.?pick/i,
  /market.?timing/i,
  /day.?trad/i,
  /hot.?tip/i,
  /get.?rich/i,
  /meme.?stock/i,
  /nft/i,
  /forex/i,
  /options.?trading/i,
  /short.?sell/i,
];

function checkGuardrail(message) {
  const hit = OFF_PLAN_PATTERNS.some((re) => re.test(message));
  if (hit) {
    return {
      allowed: false,
      redirectMessage:
        "I can only help with what's already in your Sherpas plan. Let me show you how this affects your Living Map...",
    };
  }
  return { allowed: true };
}

// ── HTTP server ────────────────────────────────────────────────────────────────

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
  });
  res.end(json);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }

  // ── /api/cases ──────────────────────────────────────────────────────────────
  if (pathname === "/api/cases" && req.method === "GET") {
    return sendJson(res, 200, caseIds.map((id) => caseSummary(id)).filter(Boolean));
  }

  // ── /api/cases/:id ──────────────────────────────────────────────────────────
  const caseMatch = pathname.match(/^\/api\/cases\/([^/]+)$/);
  if (caseMatch && req.method === "GET") {
    const id = caseMatch[1];
    if (!caseIds.includes(id)) return sendJson(res, 404, { error: "case not found" });
    const fh = readJson(join(CASES_DIR, id, "financial-health.json"));
    const ia = readJson(join(CASES_DIR, id, "investment-analysis.json"));
    return sendJson(res, 200, { id, financialHealth: fh, investmentAnalysis: ia });
  }

  // ── /api/cases/:id/brief ────────────────────────────────────────────────────
  const briefMatch = pathname.match(/^\/api\/cases\/([^/]+)\/brief$/);
  if (briefMatch && req.method === "GET") {
    const id = briefMatch[1];
    if (!caseIds.includes(id)) return sendJson(res, 404, { error: "case not found" });
    return sendJson(res, 200, { brief: caseBrief(id) });
  }

  // ── POST /api/guard ─────────────────────────────────────────────────────────
  if (pathname === "/api/guard" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { message = "" } = JSON.parse(body);
        return sendJson(res, 200, checkGuardrail(message));
      } catch {
        return sendJson(res, 400, { error: "invalid JSON" });
      }
    });
    return;
  }

  // ── Proxy to Vite dev server ────────────────────────────────────────────────
  // Everything else is proxied to the Vite dev server.
  try {
    const viteUrl = `http://localhost:${VITE_PORT}${req.url}`;
    const { default: http } = await import("node:http");
    const proxyReq = http.request(
      viteUrl,
      { method: req.method, headers: req.headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxyReq.on("error", () => {
      res.writeHead(502);
      res.end("Vite dev server not available. Run: npm run dev");
    });
    req.pipe(proxyReq);
  } catch {
    res.writeHead(500);
    res.end("Internal server error");
  }
});

// ── WebSocket relay: browser ↔ server ↔ AI proxy ──────────────────────────────

const wss = new WebSocketServer({ server, path: "/voice" });

wss.on("connection", (browser, req) => {
  const params = new URL(req.url, "http://localhost").searchParams;
  const model = params.get("model");
  const caseId = params.get("case");

  if (!MODELS.includes(model)) return browser.close(1008, "unknown model");
  if (caseId && !caseIds.includes(caseId)) return browser.close(1008, "unknown case");

  const brief = caseId ? caseBrief(caseId) : "";

  if (!TEAM_KEY || TEAM_KEY.includes("...")) {
    browser.send(
      JSON.stringify({
        type: "error",
        error: { message: "Server has no TEAM_KEY set. Add it to .env" },
      })
    );
    return browser.close(1008, "no team key");
  }

  const upstream = new WebSocket(
    `${PROXY_URL.replace(/^http/, "ws")}/v1/realtime?model=${model}`,
    { headers: { Authorization: `Bearer ${TEAM_KEY}` } }
  );

  const pending = [];
  console.log(`[voice] [${model}] session opened${caseId ? ` for ${caseId}` : ""}`);

  upstream.on("open", () => {
    for (const m of pending.splice(0)) upstream.send(m);
  });

  upstream.on("message", (data) => {
    if (browser.readyState === WebSocket.OPEN) browser.send(data.toString());
  });

  upstream.on("unexpected-response", (_req, proxyRes) => {
    let body = "";
    proxyRes.on("data", (c) => (body += c));
    proxyRes.on("end", () => {
      console.error(
        `[voice] [${model}] proxy refused: HTTP ${proxyRes.statusCode} ${body.slice(0, 200)}`
      );
      browser.send(
        JSON.stringify({
          type: "error",
          error: { message: `proxy HTTP ${proxyRes.statusCode}: ${body.slice(0, 200)}` },
        })
      );
      browser.close();
    });
  });

  upstream.on("close", (code, reason) => {
    console.log(`[voice] [${model}] proxy closed ${code} ${reason}`);
    browser.close();
  });

  upstream.on("error", (e) =>
    console.error(`[voice] [${model}] proxy error: ${e.message}`)
  );

  browser.on("message", (data) => {
    let m = data.toString();

    // Inject case brief into session.update instructions
    if (brief && m.includes('"session.update"')) {
      try {
        const ev = JSON.parse(m);
        if (ev.type === "session.update" && ev.session) {
          ev.session.instructions = `${ev.session.instructions ?? ""}\n\n${brief}`.trim();
          m = JSON.stringify(ev);
        }
      } catch {
        // malformed JSON — pass through unchanged
      }
    }

    if (upstream.readyState === WebSocket.OPEN) upstream.send(m);
    else pending.push(m);
  });

  browser.on("close", () => {
    console.log(`[voice] [${model}] session closed`);
    upstream.close();
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(
    `[server] Sherpas Pulse backend on http://localhost:${PORT}\n` +
      `         Proxy  → ${PROXY_URL}\n` +
      `         Cases  → ${CASES_DIR} (${caseIds.length} cases: ${caseIds.join(", ")})\n` +
      `         Vite   → http://localhost:${VITE_PORT} (proxied)`
  );
});
