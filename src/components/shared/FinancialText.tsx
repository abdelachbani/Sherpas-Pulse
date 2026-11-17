import { Fragment } from 'react';
import { splitFinancialTerms } from '../../lib/financialGlossary';
import { TapToDefine } from './TapToDefine';

interface Props {
  text: string;
}

export function FinancialText({ text }: Props) {
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
