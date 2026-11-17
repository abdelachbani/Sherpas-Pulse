import { useLayoutEffect, useRef, type RefObject } from 'react';

const dialogStack: symbol[] = [];
const focusable = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep keyboard focus within the most recently opened dialog and restore its trigger. */
export function useDialogFocus(active: boolean, onClose: () => void): RefObject<HTMLDivElement | null> {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    if (!active || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = Symbol('dialog');
    dialogStack.push(id);
    const isTop = () => dialogStack[dialogStack.length - 1] === id;
    const elements = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusable)).filter((element) => !element.hidden && element.getClientRects().length > 0);
    (elements()[0] ?? dialog).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTop()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      } else if (event.key === 'Tab') {
        const items = elements();
        if (items.length === 0) { event.preventDefault(); dialog.focus(); return; }
        const index = items.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); items[items.length - 1].focus(); }
        else if (!event.shiftKey && (index === -1 || index === items.length - 1)) { event.preventDefault(); items[0].focus(); }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isTop() && !dialog.contains(event.target as Node)) (elements()[0] ?? dialog).focus();
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn, true);
    return () => {
      const wasTop = isTop();
      const index = dialogStack.indexOf(id);
      if (index !== -1) dialogStack.splice(index, 1);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn, true);
      if (wasTop && previous?.isConnected) previous.focus();
    };
  }, [active]);
  return dialogRef;
}
