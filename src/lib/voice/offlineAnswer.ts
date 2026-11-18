/**
 * src/lib/voice/offlineAnswer.ts
 *
 * Grounded offline answer engine for Sherpas Pulse:
 * Provides deterministic, verifiable financial plan answers using verified case figures
 * from the CASES registry when WebSocket relay is offline, unconfigured, or unreachable.
 */

import { CASES, findCase } from '../mcp/cases';

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
  'I can explain the investments recorded in your plan. Would you like to review those?';

const OTHER_HOUSEHOLD_ANSWER = 'I can only discuss the open plan. Is there something you’d like to review in yours?';

export function asksAboutAnotherHousehold(caseId: string, question: string): boolean {
  const words = ` ${question.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  return CASES.some(({ id }) => {
    if (id === caseId) return false;
    const parts = id.split('-');
    const surname = parts.pop();
    return words.includes(` ${id.replace(/-/g, ' ')} `) ||
      parts.some(firstName => words.includes(` ${firstName} ${surname} `));
  });
}

export function getOfflineAnswer(caseId: string, question: string): OfflineAnswerResult {
  const clean = question.trim();

  if (asksAboutAnotherHousehold(caseId, clean)) {
    return { text: OTHER_HOUSEHOLD_ANSWER, detectedTerm: null, isGuardrail: true };
  }

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
  const result = (text: string, detectedTerm: string | null = null, followUp = 'Is there anything else you’d like me to explain?'): OfflineAnswerResult => ({ text: `${text} ${followUp}`, detectedTerm, isGuardrail: false });
  const unavailable = (term: string | null = null) => result('The available plan does not provide enough information to answer that question. Please ask your advisor.', term);
  const moveAnswer = (pattern: RegExp, term: string): OfflineAnswerResult | null => {
    const move = moves.find((item) => pattern.test(`${item.title} ${item.action}`));
    return move ? result(`Your plan lists "${move.title}": ${move.action}. The model shows a score change from ${move.score_before} to ${move.score_after}.`, term) : null;
  };
  if (/\b(?:score|puntuaci[oó]n)\b/i.test(clean) && !/change|improv|impact|why|if |cambi|mejor/i.test(clean)) {
    return result(`Your Financial Health score is ${fh.score.published_score}/100.`, null, 'Would you like me to explain what the score measures?');
  }
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
    const cards = fh.profile?.liabilities?.filter(item => item.type === 'PERSONAL_CREDIT_CARD');
    const singleBalance = cards?.length === 1 ? cards[0].balance : undefined;
    if (/balance|saldo/i.test(clean) && !/recommend|propos|recomend|after|después/i.test(clean)) {
      return singleBalance == null ? unavailable('revolving-apr') : result(
        `The plan records a current card balance of $${singleBalance.toLocaleString('en-US')}.`,
        'revolving-apr',
        'Would you like to review what the plan proposes for the card?',
      );
    }
    return moveAnswer(/card|debt|revolving|apr/i, 'revolving-apr') ?? unavailable('revolving-apr');
  }
  if (/\b(?:cars?|veh[ií]culos?|autom[oó]viles?|coches?)\b/i.test(clean)) {
    if (/\b(?:repair|fix|maintenance|service|loan|payment|insurance|registration|repar\w*|arregl\w*|mantenimiento|pr[eé]stamo|seguro|matr[ií]cula)\b/i.test(clean)) return unavailable();
    const spanish = /[¿¡]|\b(?:coche|veh[ií]culo|cu[aá]nto|cu[aá]ndo|comprar|cuesta|precio)\b/i.test(clean);
    const locale = spanish ? 'es-ES' : 'en-US';
    const vehicleGoal = goals.find((goal) => goal.subType === 'VEHICLE_PURCHASE');
    if (!vehicleGoal) return spanish
      ? result('El plan no recoge una meta de compra de vehículo.', null, '¿Quieres revisar otra meta del plan?')
      : result('Your plan does not record a vehicle purchase goal.', null, 'Would you like to review another goal?');

    const date = fh.goals?.chartGoals?.find((goal) => goal.subType === 'VEHICLE_PURCHASE')?.date;
    const month = date && new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
    const amount = vehicleGoal.amount != null && new Intl.NumberFormat(locale, {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(vehicleGoal.amount);
    const timingQuestion = /\b(?:when|which year|what year|cu[aá]ndo|qu[eé] a[nñ]o)\b/i.test(clean);
    const priceQuestion = /\b(?:how much|cost|price|budget|cu[aá]nto|cuesta|precio|presupuesto)\b/i.test(clean);
    if (spanish) {
      const timing = month ? `El plan prevé la compra del coche para ${month}.` : 'El plan no indica la fecha de compra.';
      const price = amount ? `El presupuesto para el coche es de ${amount}.` : 'El plan no indica el presupuesto para el coche.';
      const answer = timingQuestion && priceQuestion ? `${timing} ${price}` : priceQuestion ? price : timing;
      return result(answer, null, priceQuestion ? '¿Quieres revisar la fecha de compra?' : '¿Quieres revisar el presupuesto?');
    }
    const timing = month ? `Your plan targets ${month} for the car purchase.` : 'Your plan does not specify a purchase date.';
    const price = amount ? `Your plan budgets ${amount} for the car.` : 'Your plan does not specify a vehicle budget.';
    const answer = timingQuestion && priceQuestion ? `${timing} ${price}` : priceQuestion ? price : timing;
    return result(answer, null, priceQuestion ? 'Would you like to review the purchase timing?' : 'Would you like to review the budget?');
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
  return topMove && /summari[sz]e|summary|top (?:move|recommendation)|first (?:move|recommendation)|priorit/i.test(clean) ? result(`For ${names}, your Financial Health score is ${fh.score.published_score}/100 (${fh.score.band}). Your first listed move is "${topMove.title}": ${topMove.action}.`) : unavailable();
}
