/**
 * src/components/shared/MobileFrame.tsx
 *
 * Wrapper ensuring max-w-[420px] viewport with safe-area insets.
 * Wrap every page in this component.
 */

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function MobileFrame({ children, className = '' }: Props) {
  return (
    <div className="min-h-dvh bg-slate-950 flex justify-center">
      <div
        className={`w-full max-w-[420px] min-h-dvh relative overflow-hidden
          [padding-top:env(safe-area-inset-top)]
          [padding-bottom:env(safe-area-inset-bottom)]
          [padding-left:env(safe-area-inset-left)]
          [padding-right:env(safe-area-inset-right)]
          ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
