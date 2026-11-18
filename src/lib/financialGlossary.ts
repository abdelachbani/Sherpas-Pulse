const DEFINITIONS: Record<string, string> = {
  'health score': 'A summary rating of the areas assessed in your financial plan. Read the individual areas as well: a single score does not describe every risk or guarantee future results.',
  'financial health score': 'A summary rating of the areas assessed in your financial plan. Read the individual areas as well: a single score does not describe every risk or guarantee future results.',
  'cash flow': 'Money coming in and going out over a period. A positive balance means income is higher than spending during that period.',
  liquidity: 'How readily money or an asset can be available to pay for expenses, without waiting for a long-term investment to mature.',
  debt: 'Money you owe. The balance, interest rate and repayment terms help explain its cost.',
  investments: 'Assets held with the aim of earning income or growing in value. Their values and returns can change.',
  'retirement age': 'The age recorded in your plan as your target for retirement. It is a goal, rather than a guarantee that every cost will be covered.',
  retirement: 'The stage of life when you plan to reduce or stop working and rely more on savings, benefits or other income.',
  'life insurance': 'A policy that pays an agreed benefit to named beneficiaries when the insured person dies, subject to its terms.',
  contribution: 'Money added to a savings or investment account. An account may have rules or limits on contributions.',

  '401(k)': 'A workplace retirement account. Money can come straight from your paycheck, and your employer may add a contribution too.',
  'roth ira': 'An individual retirement account funded with money you have already paid taxes on. Qualified withdrawals in retirement are generally tax-free.',
  '529': 'A tax-advantaged account designed to help save for education costs, such as college tuition.',
  '529 plan': 'A tax-advantaged account designed to help save for education costs, such as college tuition.',
  '529 education plan': 'A tax-advantaged account designed to help save for eligible education costs, such as college tuition.',
  umbrella: 'Extra liability insurance that can help protect your savings if a large claim goes beyond the limits of your auto or home policy.',
  'umbrella liability': 'Extra liability insurance that can help protect your savings if a large claim goes beyond the limits of your auto or home policy.',
  'umbrella policy': 'Extra liability insurance that can help protect your savings if a large claim goes beyond the limits of your auto or home policy.',
  'credit card': 'A payment card that lets you borrow up to a limit and repay later. If you carry a balance, interest may be charged.',
  'sharpe ratio': 'A way to compare an investment return with the amount of risk taken to get it. A higher ratio can mean more return for each unit of risk.',
  'expense ratio': 'The yearly fee a fund charges to manage your investment, shown as a percentage of the money in the fund.',
  'emergency fund': 'Cash set aside for unexpected costs or a loss of income, so you have a buffer before relying on debt or long-term savings.',
  'debt avalanche': 'A payoff approach where you make minimum payments on every debt and put extra money toward the debt with the highest interest rate first.',
  'debt snowball': 'A payoff approach where you make minimum payments on every debt and put extra money toward the smallest balance first, for quicker progress wins.',
  'emergency funds': 'Cash set aside for unexpected costs or a loss of income, so you have a buffer before relying on debt or long-term savings.',
  'revolving apr': 'The yearly interest rate charged on a balance that can go up or down, such as a credit card balance.',
  apr: 'The annual percentage rate: a yearly measure of the cost of borrowing, including interest and sometimes certain fees.',
  'mortality ratio': 'A comparison of life insurance coverage with an estimated amount a family may need. The estimate depends on its assumptions.',
  'leveraged etf': 'An exchange-traded fund that uses financial instruments to magnify an index’s movement, often over a single day. Its longer-term returns can differ substantially from a simple multiple of the index.',
  'withdrawal rate': 'The amount taken from savings over a period, expressed as a share of the total investments.',
  'index fund': 'An investment fund designed to track a group of investments, such as a market index, instead of selecting each investment individually.',
  'index funds': 'Investment funds designed to track a group of investments, such as a market index, instead of selecting each investment individually.',
  'brokerage account': 'An investment account that lets you buy and sell investments. Unlike retirement accounts, it generally has no special retirement tax treatment.',
  'high-yield savings account': 'A savings account that pays interest, often at a higher rate than a standard savings account. Rates and terms can change.',
};

const SIMPLE_TERMS: Record<string, string> = {
  'health score': 'overall picture',
  'financial health score': 'overall picture of your finances',
  'cash flow': 'money coming in and going out',
  liquidity: 'money available when you need it',
  debt: 'money you owe',
  investments: 'money invested to try to grow',
  'retirement age': 'age you hope to stop working',
  retirement: 'life after work',
  'life insurance': 'insurance that can help your family if you die',
  contribution: 'money added to an account',
  '401(k)': 'workplace plan to save for when you stop working',
  'roth ira': 'retirement account funded with money you already paid taxes on',
  '529': 'plan to save for education',
  '529 plan': 'plan to save for education',
  '529 education plan': 'plan to save for education',
  umbrella: 'extra insurance for large claims',
  'umbrella liability': 'extra insurance for large claims',
  'umbrella policy': 'extra insurance for large claims',
  'credit card': 'card that lets you borrow money for purchases',
  'sharpe ratio': 'how much return an investment earned for its ups and downs',
  'expense ratio': 'yearly fee for a fund',
  'emergency fund': 'savings for surprise costs',
  'emergency funds': 'savings for surprise costs',
  'debt avalanche': 'pay the highest-interest debt first',
  'debt snowball': 'pay the smallest debt first',
  'revolving apr': 'yearly interest rate on a changing balance',
  apr: 'yearly cost of borrowing',
  'mortality ratio': 'how life insurance compares with what your family may need',
  'leveraged etf': 'investment designed to make daily market moves bigger',
  'withdrawal rate': 'share of savings taken out over time',
  'index fund': 'fund that follows a group of investments',
  'index funds': 'funds that follow a group of investments',
  'brokerage account': 'account for buying and selling investments',
  'high-yield savings account': 'savings account with a higher interest rate',
};

const MECHANICS: Record<string, string> = {
  'health score': 'The published score combines several parts of the financial assessment. Use the individual scores to see which areas pull the overall result up or down.',
  'cash flow': 'Cash flow compares income received with expenses paid over the same period. The surplus or shortfall can change with timing, irregular costs and changes in income.',
  liquidity: 'Liquidity depends on how quickly an asset can be converted to cash, its likely sale price and any withdrawal restrictions or penalties.',
  debt: 'Interest accrues on a debt under its agreement. The rate, balance, payment schedule and fees determine its cost and how quickly the principal falls.',
  investments: 'Investment results combine changes in market value and any income, less costs and taxes. Diversification can reduce some risks but cannot prevent losses.',
  'retirement age': 'The target age marks the point where the plan shifts from building savings to drawing income. Moving the target changes both the time available to save and the time savings may need to last.',
  retirement: 'A retirement projection compares expected spending with pensions, benefits and portfolio withdrawals over time. The result depends on assumptions about longevity, inflation and investment returns.',
  'life insurance': 'The policy contract sets the death benefit, premiums, coverage period and exclusions. The insurer pays eligible claims to the beneficiaries named in the policy.',
  contribution: 'A contribution adds new money to the account balance, separate from gains or losses. Account type determines which limits, eligibility rules and tax treatment apply.',
  '401(k)': 'Contributions are invested within an employer-sponsored retirement plan. Tax treatment depends on whether contributions are traditional or Roth; withdrawals, employer matching and vesting follow plan and tax rules.',
  'roth ira': 'Contributions are generally made after tax. Earnings can grow tax-free and qualified withdrawals are tax-free; eligibility, contribution limits and withdrawal rules apply.',
  '529': 'Contributions are invested in an education savings plan. Earnings can grow tax-free and qualified withdrawals are generally federally tax-free; eligible expenses and state treatment vary.',
  umbrella: 'Umbrella coverage typically starts after a covered claim reaches the limit of the underlying policy. It has its own limits, exclusions and minimum underlying coverage requirements.',
  'credit card': 'When a balance is carried beyond any applicable grace period, interest is generally calculated using the account’s APR and balance. Paying only the minimum extends repayment and increases interest costs.',
  apr: 'APR expresses borrowing cost as an annual rate, including interest and applicable fees. The amount paid also depends on the balance, repayment timing and how interest is calculated.',
  'revolving apr': 'Revolving credit allows the outstanding balance to change as you borrow and repay. Interest for a billing period depends on the APR, how the lender measures the balance and any applicable grace period.',
  'emergency fund': 'The target buffer is often considered in months of essential expenses. Its usefulness depends on access, stability of value and the household’s income and obligations.',
  'expense ratio': 'A fund’s annual operating expenses are expressed as a percentage of its assets and reflected in fund performance. Other transaction or account costs may also apply.',
  'sharpe ratio': 'The calculation subtracts a risk-free benchmark from a portfolio’s average return and divides by the variability of its returns over the same period.',
  'debt avalanche': 'After making minimum payments on all balances, direct extra money to the highest-rate debt. Once it is paid off, move the extra payment to the next highest rate.',
  'debt snowball': 'After making minimum payments on all balances, direct extra money to the smallest balance. Once it is paid off, roll the payment into the next smallest balance.',
  'mortality ratio': 'Compare existing coverage with the estimated amount the household needs to replace income and meet obligations. Changes to the coverage or the estimated need change the ratio.',
  'leveraged etf': 'Many leveraged ETFs reset their exposure daily. Returns then compound along the path of daily moves, so returns over several days can diverge from the stated daily multiple.',
  'withdrawal rate': 'A withdrawal rate divides the amount withdrawn over a year by the portfolio value used as its starting point. Sustainability depends on returns, inflation, spending changes and the length of retirement.',
  'index fund': 'An index fund holds investments intended to track a specified benchmark. Tracking differences, expenses and the benchmark’s composition affect its results.',
  'brokerage account': 'Cash and securities are held through a broker. Selling a position can realize a gain or loss, and dividends or interest can create taxable income depending on the account and jurisdiction.',
  'high-yield savings account': 'The bank credits interest under the account’s terms. The quoted annual percentage yield reflects compounding, and a variable rate can change after a deposit.',
};

const MECHANICS_ALIASES: Record<string, string> = {
  'financial health score': 'health score',
  '529 plan': '529', '529 education plan': '529',
  'umbrella liability': 'umbrella', 'umbrella policy': 'umbrella',
  'emergency funds': 'emergency fund', 'index funds': 'index fund',
};

const FINANCIAL_TERMS = Object.keys(DEFINITIONS)
  .sort((left, right) => right.length - left.length)
  .map((term) => ({
    term,
    pattern: new RegExp(`^${term.split(/\s+/).map(escapeRegExp).join('\\s+')}`, 'i'),
  }));

export interface FinancialTextSegment {
  text: string;
  term?: string;
}

export function getFinancialTermDefinition(term: string): string {
  const cleanTerm = term.trim();
  const key = normalizeTerm(term);

  return DEFINITIONS[key]
    ?? `“${cleanTerm}” is a financial term whose exact meaning depends on how it is used in your plan. Your advisor can explain how it applies to your situation.`;
}

export function getFinancialTermMechanics(term: string): string {
  const key = normalizeTerm(term);
  return MECHANICS[MECHANICS_ALIASES[key] ?? key] ?? getFinancialTermDefinition(term);
}

export function getSimpleFinancialTerm(term: string): string {
  return SIMPLE_TERMS[normalizeTerm(term)] ?? term.trim();
}

export function simplifyFinancialText(text: string): string {
  return splitFinancialTerms(text).reduce((result, segment) => {
    if (!segment.term) return result + segment.text;

    let replacement = getSimpleFinancialTerm(segment.term);
    const article = result.match(/\b(an?)\s+$/i);
    if (article) {
      const desiredArticle = /^[aeiou]/i.test(replacement) ? 'an' : 'a';
      const articleText = article[1][0] === article[1][0].toUpperCase()
        ? desiredArticle[0].toUpperCase() + desiredArticle.slice(1)
        : desiredArticle;
      result = `${result.slice(0, -article[0].length)}${articleText} `;
    }

    const startsSentence = result.trim().length === 0 || /[.!?]\s*$/.test(result);
    if (startsSentence && /^[A-Z]/.test(segment.text)) {
      replacement = replacement[0].toUpperCase() + replacement.slice(1);
    }

    return result + replacement;
  }, '');
}

export function splitFinancialTerms(text: string): FinancialTextSegment[] {
  const segments: FinancialTextSegment[] = [];
  let segmentStart = 0;
  let index = 0;

  while (index < text.length) {
    const matchedTerm = FINANCIAL_TERMS.find(({ pattern }) => {
      const match = pattern.exec(text.slice(index));
      if (!match) return false;

      const precedingCharacter = index > 0 ? text[index - 1] : undefined;
      const followingCharacter = text[index + match[0].length];
      return !isWordCharacter(precedingCharacter) && !isWordCharacter(followingCharacter);
    });

    if (!matchedTerm) {
      index += 1;
      continue;
    }

    if (index > segmentStart) {
      segments.push({ text: text.slice(segmentStart, index) });
    }

    const matchedText = matchedTerm.pattern.exec(text.slice(index))![0];
    segments.push({ text: matchedText, term: matchedText });
    index += matchedText.length;
    segmentStart = index;
  }

  if (segmentStart < text.length) {
    segments.push({ text: text.slice(segmentStart) });
  }

  return segments;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isWordCharacter(character: string | undefined): boolean {
  return character !== undefined && /[a-z0-9]/i.test(character);
}

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase().replace(/\s+/g, ' ');
}
