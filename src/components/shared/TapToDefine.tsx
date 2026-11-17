import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getFinancialTermDefinition } from '../../lib/financialGlossary';
import { useAppStore } from '../../stores/appStore';

interface Props {
  term: string;
  children?: ReactNode;
}

interface PopoverPosition {
  top: number;
  left: number;
}

export function TapToDefine({ term, children }: Props) {
  const trackTermConsulted = useAppStore((state) => state.trackTermConsulted);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>({ top: 16, left: 16 });
  const definition = getFinancialTermDefinition(term);
  const hasTerm = Boolean(term.trim());

  const closePopover = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  function handleTriggerClick() {
    if (isOpen) {
      closePopover(true);
      return;
    }

    if (!hasTerm) return;
    trackTermConsulted(term);
    setIsOpen(true);
  }

  useLayoutEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const margin = 16;
      const gap = 8;
      const maxLeft = Math.max(margin, window.innerWidth - popoverRect.width - margin);
      const left = Math.min(Math.max(margin, triggerRect.left), maxLeft);
      const fitsBelow = triggerRect.bottom + gap + popoverRect.height <= window.innerHeight - margin;
      const top = fitsBelow
        ? triggerRect.bottom + gap
        : Math.max(margin, triggerRect.top - popoverRect.height - gap);

      setPosition((current) => (
        current.top === top && current.left === left ? current : { top, left }
      ));
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      if (popoverRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      closePopover();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closePopover(true);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closePopover, isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        disabled={!hasTerm}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        className="cursor-pointer rounded-sm text-inherit underline decoration-dotted decoration-blue-400/80 underline-offset-4 transition-colors hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-default disabled:no-underline"
      >
        {children ?? term}
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${popoverId}-title`}
          style={{ position: 'fixed', top: position.top, left: position.left }}
          className="z-[80] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 text-white  "
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Quick definition
              </p>
              <h2 id={`${popoverId}-title`} className="text-base font-bold leading-snug">
                {term}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => closePopover(true)}
              className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Close definition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{definition}</p>
        </div>,
        document.body,
      )}
    </>
  );
}
