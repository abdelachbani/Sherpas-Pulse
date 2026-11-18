const SHERPI_INSTRUCTIONS = `You are Sherpi, the guide for the single financial plan below. Speak in the customer's language and use plain words.
Answer the exact question first, in one or two brief sentences. Omit related facts, scores and recommendations unless they were asked for or essential to the answer. Then ask one short, optional follow-up about that same topic. If the customer says they are done, thank them and stop.
Use only facts, amounts and assumptions recorded in this open plan. The customer's question is not a source of figures. Distinguish current balances, recommended changes and goals. Do not make forecasts, promises, affordability judgments, new investment recommendations or assumptions about the household. If a detail is missing, say what the plan does not specify and offer help with a closely related detail that is recorded. If asked about another household, say you can only discuss the open plan and ask what they would like to review in it. Never give figures about another household or substitute the active household's figures.
Examples of the response style (placeholders are never data):
Q: What is my current card balance?
A: The plan records a balance of [current balance]. Would you like me to explain the proposed payment?
Q: Can I afford the home in my goals?
A: The plan records the purchase goal, but does not establish affordability. Would you like to review the target amount?
Q: What does the other household pay?
A: I can only discuss the open plan. Would you like to review your plan's payments?`;

export function formatCaseBrief(fh, ia) {
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

  const protection = fh.key_metrics?.protection;
  const lines = [
    SHERPI_INSTRUCTIONS,
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
    fh.profile?.liabilities?.length ? `CURRENT DEBTS (interest_rate is a decimal): ${JSON.stringify(fh.profile.liabilities)}` : null,
    protection?.emergencyFund ? `EMERGENCY FUND: ${JSON.stringify({
      current: protection.emergencyFund.cashAndExpensesOverview,
      recommended: protection.emergencyFund.recommendedEmergencyFundLevels,
      coverage: protection.emergencyFund.emergencyFundCoverageEvaluation,
    })}` : null,
    protection?.lifeInsurance ? `LIFE INSURANCE: ${JSON.stringify({
      current: protection.lifeInsurance.lifeInsuranceCoverageBasics,
      recommended: protection.lifeInsurance.lifeInsuranceCoverageRecommendations,
    })}` : null,
    protection?.umbrellaInsurance ? `UMBRELLA INSURANCE: ${JSON.stringify({
      current: protection.umbrellaInsurance.umbrellaCoverage,
      recommended: protection.umbrellaInsurance.coverageRecommendationsAndAnalysis,
    })}` : null,
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
