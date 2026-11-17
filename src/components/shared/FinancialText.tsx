import { Fragment } from 'react';
import { simplifyFinancialText, splitFinancialTerms } from '../../lib/financialGlossary';
import { useAppStore } from '../../stores/appStore';
import { TapToDefine } from './TapToDefine';

interface Props {
  text: string;
}

export function FinancialText({ text }: Props) {
  const languageMode = useAppStore((state) => state.languageMode);

  if (languageMode === 'simple') {
    return <>{simplifyFinancialText(text)}</>;
  }

  return (
    <>
      {splitFinancialTerms(text).map((segment, index) => (
        <Fragment key={`${segment.text}-${index}`}>
          {segment.term
            ? <TapToDefine term={segment.term}>{segment.text}</TapToDefine>
            : segment.text}
        </Fragment>
      ))}
    </>
  );
}
