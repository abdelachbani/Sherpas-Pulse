import type { CalibrationCard } from '../types';

export interface HouseholdTermsConfig {
  relevantKeys: string[];
  chapterTerms: Record<number, string>;
}

export const HOUSEHOLD_TERMS: Record<string, HouseholdTermsConfig> = {
  'timothy-melanie-weah': {
    // Household context: 18% credit card, Liam & Josh college, term life gap, high net worth liability, retirement
    relevantKeys: ['revolving-apr', '529-plan', 'umbrella-liability', 'mortality-ratio', 'roth-ira'],
    chapterTerms: {
      0: 'roth-ira',
      1: 'revolving-apr',
      2: '529-plan',
      3: 'umbrella-liability',
      4: 'withdrawal-rate',
      5: 'revolving-apr',
    },
  },
  'daniel-emily-johnson': {
    // Household context: 0/20 protection score (mortality gap), Oliver & Sophia college, umbrella shield, retirement
    relevantKeys: ['mortality-ratio', '529-plan', 'umbrella-liability', 'roth-ira', 'withdrawal-rate'],
    chapterTerms: {
      0: 'roth-ira',
      1: 'mortality-ratio',
      2: '529-plan',
      3: 'umbrella-liability',
      4: 'withdrawal-rate',
      5: 'mortality-ratio',
    },
  },
  'michael-carter': {
    // Household context: Single renter, Austin home 2027 vs retire at 58, 6.0% withdrawal rate concern, $0 umbrella
    relevantKeys: ['withdrawal-rate', 'umbrella-liability', 'leveraged-etf', 'roth-ira'],
    chapterTerms: {
      0: 'roth-ira',
      1: 'withdrawal-rate',
      2: 'leveraged-etf',
      3: 'umbrella-liability',
      4: 'withdrawal-rate',
      5: 'umbrella-liability',
    },
  },
  'samantha-lewis': {
    // Household context: Single mother, Ethan & Ava college funding now, 2030 second home, high portfolio concentration
    relevantKeys: ['529-plan', 'withdrawal-rate', 'umbrella-liability', 'roth-ira'],
    chapterTerms: {
      0: 'roth-ira',
      1: 'withdrawal-rate',
      2: '529-plan',
      3: 'umbrella-liability',
      4: 'withdrawal-rate',
      5: 'umbrella-liability',
    },
  },
};

/**
 * Returns the subset of calibration cards relevant to the selected household.
 * If case-specific configuration is not found, returns all available cards.
 */
export function getRelevantTermsForCase(
  caseId: string,
  cards: Record<string, CalibrationCard>,
): CalibrationCard[] {
  const config = HOUSEHOLD_TERMS[caseId];
  if (!config) {
    return Object.values(cards);
  }
  return config.relevantKeys
    .map((key) => cards[key])
    .filter((card): card is CalibrationCard => Boolean(card));
}

/**
 * Determines the most contextually relevant financial term for the active story chapter.
 */
export function getDefaultTermForChapter(
  caseId: string,
  chapterIndex: number,
  cards: Record<string, CalibrationCard>,
): string {
  const config = HOUSEHOLD_TERMS[caseId];
  const preferred = config?.chapterTerms[chapterIndex];
  if (preferred && cards[preferred]) {
    return preferred;
  }
  const relevant = getRelevantTermsForCase(caseId, cards);
  if (relevant.length > 0) {
    return relevant[0].termKey;
  }
  const allKeys = Object.keys(cards);
  return allKeys[0] ?? 'roth-ira';
}
