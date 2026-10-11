import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./Drawer.css";

export type DrawerPlacement = "bottom" | "top" | "left" | "right";
export type DrawerAction = "cancel" | "done";

export type DrawerProps = {
  placement?: DrawerPlacement;
  triggerLabel: string;
  title: string;
  children?: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction?: (action: DrawerAction) => void;
  cancelLabel?: string;
  doneLabel?: string;
  closeLabel?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Drawer({
  placement = "right",
  triggerLabel,
  title,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  onAction,
  cancelLabel = "انصراف",
  doneLabel = "تأیید",
  closeLabel = "بستن",
}: DrawerProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const [rendered, setRendered] = useState(isOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const setOpen = (next: boolean) => {
    if (next === isOpen) return;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (isOpen) setRendered(true);
    else if (prefersReducedMotion()) setRendered(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !rendered) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [isOpen, rendered]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const nodes = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const act = (action: DrawerAction) => {
    onAction?.(action);
    setOpen(false);
  };

  const handle = <div className="ca-drawer__handle" aria-hidden="true" />;
  const state = isOpen ? "open" : "closed";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="ca-drawer-button ca-drawer-button--secondary"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>

      {rendered &&
        createPortal(
          <div
            className="ca-drawer__backdrop"
            data-state={state}
            dir="rtl"
            onClick={(event) => event.target === event.currentTarget && setOpen(false)}
            onAnimationEnd={(event) =>
              event.target === event.currentTarget && !isOpen && setRendered(false)
            }
          >
            <div
              ref={dialogRef}
              className={`ca-drawer ca-drawer--${placement}`}
              data-state={state}
              role="dialog"
              aria-modal="true"
              aria-labelledby={headingId}
              tabIndex={-1}
              onKeyDown={handleKeyDown}
            >
              <button
                type="button"
                className="ca-drawer__close"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M3.47 3.47a.75.75 0 0 1 1.06 0L8 6.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L9.06 8l3.47 3.47a.75.75 0 1 1-1.06 1.06L8 9.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L6.94 8 3.47 4.53a.75.75 0 0 1 0-1.06" />
                </svg>
              </button>
              {placement === "bottom" && handle}
              <header className="ca-drawer__header">
                <h2 id={headingId} className="ca-drawer__heading">
                  {title}
                </h2>
              </header>
              <div className="ca-drawer__body">{children}</div>
              <footer className="ca-drawer__footer">
                <button
                  type="button"
                  className="ca-drawer-button ca-drawer-button--secondary"
                  onClick={() => act("cancel")}
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  className="ca-drawer-button ca-drawer-button--primary"
                  onClick={() => act("done")}
                >
                  {doneLabel}
                </button>
              </footer>
              {placement === "top" && handle}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default Drawer;
