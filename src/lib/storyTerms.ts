import { splitFinancialTerms } from './financialGlossary';

/** Find existing glossary entries in the visible story content, once each. */
export function storyTerms(texts: string[]): string[] {
  const terms = new Map<string, string>();
  for (const text of texts) {
    for (const segment of splitFinancialTerms(text.replace(/_/g, ' '))) {
      if (segment.term && !terms.has(segment.term.toLowerCase())) terms.set(segment.term.toLowerCase(), segment.term);
    }
  }
  return [...terms.values()];
}
