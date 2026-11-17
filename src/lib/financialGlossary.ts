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
