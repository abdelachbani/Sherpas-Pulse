/**
 * server/viteRelayPlugin.ts
 *
 * Vite dev plugin that embeds the Sherpas Realtime AI Relay directly into the Vite dev server.
 * Enables running `npm run dev` out of the box with full live AI voice & text answering,
 * eliminating the need for a separate `npm run server` process during development.
 */

import type { Plugin, ViteDevServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { caseBrief, caseSummary, getCaseIds, CASES_DIR, readJson } from './caseBrief';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// ── Env loading ────────────────────────────────────────────────────────────────
function loadEnv(): { proxyUrl: string; teamKey: string | undefined } {
  const envFile = join(root, '.env');
  if (existsSync(envFile)) {
    try {
      const content = readFileSync(envFile, 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // ignore read error
    }
  }

  const proxyUrl = (
    process.env.VITE_LLM_PROXY_URL ||
    process.env.LLM_PROXY_URL ||
    'https://llm-hackathon.sherpaswealth.com'
  ).replace(/\/$/, '');

  const teamKey = process.env.VITE_TEAM_KEY || process.env.TEAM_KEY;
  return { proxyUrl, teamKey };
}

const MODELS = ['gpt-realtime-2.1-mini', 'gpt-realtime-2.1', 'gemini-3.8-live'];

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

function checkGuardrail(message: string) {
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

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
  });
  res.end(json);
}

export function viteRelayPlugin(): Plugin {
  return {
    name: 'sherpas-vite-relay-plugin',
    configureServer(server: ViteDevServer) {
      const { proxyUrl, teamKey } = loadEnv();
      const caseIds = getCaseIds();

      // ── REST API Middlewares ───────────────────────────────────────────────
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const rawUrl = req.url || '';
        const parsed = new URL(rawUrl, 'http://localhost');
        const pathname = parsed.pathname;

        // CORS preflight
        if (req.method === 'OPTIONS' && (pathname.startsWith('/api/') || pathname === '/voice')) {
          res.writeHead(204, {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST, OPTIONS',
            'access-control-allow-headers': 'content-type',
          });
          res.end();
          return;
        }

        // GET /api/cases
        if (pathname === '/api/cases' && req.method === 'GET') {
          return sendJson(res, 200, caseIds.map((id) => caseSummary(id)).filter(Boolean));
        }

        // GET /api/cases/:id
        const caseMatch = pathname.match(/^\/api\/cases\/([^/]+)$/);
        if (caseMatch && req.method === 'GET') {
          const id = caseMatch[1];
          if (!caseIds.includes(id)) return sendJson(res, 404, { error: 'case not found' });
          const fh = readJson(join(CASES_DIR, id, 'financial-health.json'));
          const ia = readJson(join(CASES_DIR, id, 'investment-analysis.json'));
          return sendJson(res, 200, { id, financialHealth: fh, investmentAnalysis: ia });
        }

        // GET /api/cases/:id/brief
        const briefMatch = pathname.match(/^\/api\/cases\/([^/]+)\/brief$/);
        if (briefMatch && req.method === 'GET') {
          const id = briefMatch[1];
          if (!caseIds.includes(id)) return sendJson(res, 404, { error: 'case not found' });
          return sendJson(res, 200, { brief: caseBrief(id) });
        }

        // POST /api/guard
        if (pathname === '/api/guard' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { message = '' } = JSON.parse(body);
              return sendJson(res, 200, checkGuardrail(message));
            } catch {
              return sendJson(res, 400, { error: 'invalid JSON' });
            }
          });
          return;
        }

        next();
      });

      // ── WebSocket Relay on /voice ──────────────────────────────────────────
      if (server.httpServer) {
        const wss = new WebSocketServer({ noServer: true });

        server.httpServer.on('upgrade', (req: IncomingMessage, socket: any, head: Buffer) => {
          const parsed = new URL(req.url || '', 'http://localhost');
          if (parsed.pathname === '/voice') {
            wss.handleUpgrade(req, socket, head, (ws) => {
              wss.emit('connection', ws, req);
            });
          }
        });

        wss.on('connection', (browser: WebSocket, req: IncomingMessage) => {
          const params = new URL(req.url || '', 'http://localhost').searchParams;
          const model = params.get('model');
          const caseId = params.get('case');

          if (!model || !MODELS.includes(model)) {
            browser.close(1008, 'unknown model');
            return;
          }
          if (caseId && !caseIds.includes(caseId)) {
            browser.close(1008, 'unknown case');
            return;
          }

          const brief = caseId ? caseBrief(caseId) : '';

          if (!teamKey || teamKey.includes('...')) {
            console.warn('[vite-relay] No valid TEAM_KEY found in .env');
            browser.send(
              JSON.stringify({
                type: 'error',
                error: { message: 'Server has no TEAM_KEY set. Add it to .env' },
              })
            );
            browser.close(1008, 'no team key');
            return;
          }

          const targetWsUrl = `${proxyUrl.replace(/^http/, 'ws')}/v1/realtime?model=${model}`;
          const upstream = new WebSocket(targetWsUrl, {
            headers: { Authorization: `Bearer ${teamKey}` },
          });

          const pending: string[] = [];
          console.log(`[vite-relay] [${model}] session opened${caseId ? ` for ${caseId}` : ''}`);

          upstream.on('open', () => {
            for (const m of pending.splice(0)) upstream.send(m);
          });

          upstream.on('message', (data: any) => {
            if (browser.readyState === WebSocket.OPEN) {
              browser.send(data.toString());
            }
          });

          upstream.on('unexpected-response', (_upstreamReq: any, proxyRes: any) => {
            let body = '';
            proxyRes.on('data', (c: any) => (body += c));
            proxyRes.on('end', () => {
              console.error(
                `[vite-relay] [${model}] proxy refused: HTTP ${proxyRes.statusCode} ${body.slice(0, 200)}`
              );
              if (browser.readyState === WebSocket.OPEN) {
                browser.send(
                  JSON.stringify({
                    type: 'error',
                    error: { message: `proxy HTTP ${proxyRes.statusCode}: ${body.slice(0, 200)}` },
                  })
                );
              }
              browser.close();
            });
          });

          upstream.on('close', (code: number, reason: Buffer) => {
            console.log(`[vite-relay] [${model}] proxy closed ${code} ${reason.toString()}`);
            if (browser.readyState === WebSocket.OPEN || browser.readyState === WebSocket.CONNECTING) {
              browser.close();
            }
          });

          upstream.on('error', (e: Error) => {
            console.error(`[vite-relay] [${model}] proxy error: ${e.message}`);
          });

          browser.on('message', (data: any) => {
            let m = data.toString();

            // Inject case brief into session.update instructions
            if (brief && m.includes('"session.update"')) {
              try {
                const ev = JSON.parse(m);
                if (ev.type === 'session.update' && ev.session) {
                  ev.session.instructions = `${ev.session.instructions ?? ''}\n\n${brief}`.trim();
                  m = JSON.stringify(ev);
                }
              } catch {
                // malformed JSON — pass through
              }
            }

            if (upstream.readyState === WebSocket.OPEN) {
              upstream.send(m);
            } else {
              pending.push(m);
            }
          });

          browser.on('close', () => {
            console.log(`[vite-relay] [${model}] browser closed`);
            if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
              upstream.close();
            }
          });
        });
      }
    },
  };
}
