const DEFINITIONS: Record<string, string> = {
  '401(k)': 'A workplace retirement account. Money can come straight from your paycheck, and your employer may add a contribution too.',
  'roth ira': 'An individual retirement account funded with money you have already paid taxes on. Qualified withdrawals in retirement are generally tax-free.',
  '529': 'A tax-advantaged account designed to help save for education costs, such as college tuition.',
  '529 plan': 'A tax-advantaged account designed to help save for education costs, such as college tuition.',
  umbrella: 'Extra liability insurance that can help protect your savings if a large claim goes beyond the limits of your auto or home policy.',
  'umbrella liability': 'Extra liability insurance that can help protect your savings if a large claim goes beyond the limits of your auto or home policy.',
  'sharpe ratio': 'A way to compare an investment return with the amount of risk taken to get it. A higher ratio can mean more return for each unit of risk.',
  'expense ratio': 'The yearly fee a fund charges to manage your investment, shown as a percentage of the money in the fund.',
  'emergency fund': 'Cash set aside for unexpected costs or a loss of income, so you have a buffer before relying on debt or long-term savings.',
  'debt avalanche': 'A payoff approach where you make minimum payments on every debt and put extra money toward the debt with the highest interest rate first.',
  'debt snowball': 'A payoff approach where you make minimum payments on every debt and put extra money toward the smallest balance first, for quicker progress wins.',
};

export function getFinancialTermDefinition(term: string): string {
  const cleanTerm = term.trim();
  const key = cleanTerm.toLowerCase().replace(/\s+/g, ' ');

  return DEFINITIONS[key]
    ?? `“${cleanTerm}” is a financial term whose exact meaning depends on how it is used in your plan. Your advisor can explain how it applies to your situation.`;
}
