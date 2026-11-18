/**
 * src/lib/voice/offlineAnswer.ts
 *
 * Grounded offline answer engine for Sherpas Pulse:
 * Provides deterministic, verifiable financial plan answers using verified case figures
 * from the CASES registry when WebSocket relay is offline, unconfigured, or unreachable.
 */

import { findCase } from '../mcp/cases';

export interface OfflineAnswerResult {
  text: string;
  detectedTerm: string | null;
  isGuardrail: boolean;
}

export const OFF_PLAN_TERMS: RegExp[] = [
  /bitcoin/i,
  /crypto/i,
  /cripto/i,
  /cryptocurrency/i,
  /stock.?pick/i,
  /acciones/i,
  /nvidia/i,
  /day.?trad/i,
  /get.?rich/i,
  /meme.?stock/i,
  /forex/i,
  /options.?trading/i,
  /short.?sell/i,
];

export const GUARDRAIL_REDIRECT_MESSAGE =
  'I can only advise on recommendations within your validated Sherpas plan. Speculative assets like crypto or single stocks carry unmodeled volatility that would derail your Living Map milestones.';

export function getOfflineAnswer(caseId: string, question: string): OfflineAnswerResult {
  const clean = question.trim();

  // 1. Guardrail check
  if (OFF_PLAN_TERMS.some((re) => re.test(clean))) {
    return {
      text: GUARDRAIL_REDIRECT_MESSAGE,
      detectedTerm: null,
      isGuardrail: true,
    };
  }

  const caseData = findCase(caseId);
  if (!caseData) return { text: 'This plan is not available. Please select a household and try again.', detectedTerm: null, isGuardrail: false };
  const fh = caseData.financialHealth;
  const moves = fh.score?.top_moves ?? [];
  const goals = fh.goals?.goalsSummary ?? [];
  const result = (text: string, detectedTerm: string | null = null): OfflineAnswerResult => ({ text, detectedTerm, isGuardrail: false });
  const unavailable = (term: string | null = null) => result('The available plan does not provide enough information to answer that question. Please ask your advisor.', term);
  const moveAnswer = (pattern: RegExp, term: string): OfflineAnswerResult | null => {
    const move = moves.find((item) => pattern.test(`${item.title} ${item.action}`));
    return move ? result(`Your plan lists "${move.title}": ${move.action}. The model shows a score change from ${move.score_before} to ${move.score_after}.`, term) : null;
  };
  if (/(?:retir|jubilac|retiro)/i.test(clean)) {
    const goal = goals.find((g) => g.goalType === 'RETIREMENT');
    const target = fh.case.household.find((p) => p.retirement_age)?.retirement_age;
    return result(`${goal?.value || (target ? `Your recorded retirement target is age ${target}.` : 'Your recorded plan does not specify a retirement goal.')} The available plan does not provide a comparison of alternative retirement ages.`, 'withdrawal-rate');
  }
  if (/(?:529|college|education|tuition|liam|josh|oliver|sophia|ethan|ava|universidad|estudios|colegio)/i.test(clean)) {
    const goal = goals.find((g) => g.goalType === 'COLLEGE');
    return goal ? result(`Your education goal: ${goal.value} The available goal does not establish which account will fund it.`, '529-plan') : unavailable('529-plan');
  }
  if (/(?:umbrella|liability|shield|lawsuit|responsabilidad|demanda)/i.test(clean)) return moveAnswer(/umbrella/i, 'umbrella-liability') ?? unavailable('umbrella-liability');
  if (/(?:mortality|life.?cover|life.?insurance|insurance|parachute|seguro.?de.?vida|fallecimiento|protection)/i.test(clean)) return moveAnswer(/life cover|mortality/i, 'mortality-ratio') ?? unavailable('mortality-ratio');
  if (/(?:credit.?card|card|chase|revolving|interest|tarjeta|deuda|interes|interés|apr)/i.test(clean)) {
    const answer = moveAnswer(/card|debt|revolving|apr/i, 'revolving-apr');
    const cards = fh.profile?.liabilities?.filter(item => item.type === 'PERSONAL_CREDIT_CARD');
    const singleBalance = cards?.length === 1 ? cards[0].balance : undefined;
    if (answer && /balance|saldo/i.test(clean) && singleBalance != null) {
      return { ...answer, text: `${answer.text} The current card balance recorded in the plan is $${singleBalance.toLocaleString('en-US')}.` };
    }
    return answer ?? unavailable('revolving-apr');
  }
  if (/(?:home|house|property|mortgage|purchase|casa|vivienda)/i.test(clean)) {
    const goal = goals.find((g) => g.subType === 'REAL_ESTATE_PURCHASE');
    return goal ? result(`Your plan goal: ${goal.value} This goal alone does not establish affordability.`) : unavailable();
  }
  if (/(?:withdraw|safe.?rate|tasa.?de.?retiro|regla.?del.?4%)/i.test(clean)) return moveAnswer(/withdraw/i, 'withdrawal-rate') ?? unavailable('withdrawal-rate');
  if (/(?:roth|ira|cuenta.?de.?retiro)/i.test(clean)) return unavailable('roth-ira');
  if (/(?:upro|leveraged|etf|volatilit|apalancad)/i.test(clean)) return unavailable('leveraged-etf');
  if (/(?:cash|emergency|liquidity|surplus|ahorro|efectivo)/i.test(clean)) {
    const pillar = fh.score?.pillars?.find((p) => /liquidity/i.test(p.pillar));
    return pillar ? result(`Your plan's ${pillar.pillar} pillar score is ${pillar.score}/100.`) : unavailable();
  }
  const topMove = moves[0];
  const names = fh.case.household.filter((p) => p.role !== 'child').map((p) => p.first_name).join(' & ');
  return topMove ? result(`For ${names}, your Financial Health score is ${fh.score.published_score}/100 (${fh.score.band}). Your first listed move is "${topMove.title}": ${topMove.action}.`) : unavailable();
}
