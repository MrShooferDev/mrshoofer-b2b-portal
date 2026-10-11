import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import "./Tabs.css";

export type TabItem = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. Falls back to the first enabled item. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
};

function firstEnabled(items: TabItem[]) {
  return items.find((item) => !item.disabled)?.value;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  ariaLabel = "گزینه‌ها",
  className,
}: TabsProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    () => defaultValue ?? firstEnabled(items),
  );
  const requested = isControlled ? value : internalValue;
  const selected = items.some((item) => item.value === requested)
    ? requested
    : firstEnabled(items);

  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef(new Map<string, HTMLDivElement>());
  const [ready, setReady] = useState(false);

  const moveIndicator = useCallback(() => {
    const indicator = indicatorRef.current;
    const tab = selected !== undefined ? tabRefs.current.get(selected) : undefined;
    if (!indicator || !tab) return;
    indicator.style.width = `${tab.offsetWidth}px`;
    indicator.style.height = `${tab.offsetHeight}px`;
    indicator.style.translate = `${tab.offsetLeft}px ${tab.offsetTop}px`;
  }, [selected]);

  // Runs before paint, so the indicator appears on the initial tab without animating.
  useLayoutEffect(() => {
    moveIndicator();
  }, [moveIndicator]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(moveIndicator);
    observer.observe(list);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) moveIndicator();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [moveIndicator]);

  const select = (next: string, focus: boolean) => {
    if (!isControlled) setInternalValue(next);
    if (next !== selected) onValueChange?.(next);
    if (focus) tabRefs.current.get(next)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const enabled = items.filter((item) => !item.disabled);
    const position = enabled.findIndex((item) => item.value === items[index].value);
    const rtl = listRef.current
      ? getComputedStyle(listRef.current).direction === "rtl"
      : false;

    let next: number | null = null;
    if (event.key === "ArrowRight") next = rtl ? position - 1 : position + 1;
    else if (event.key === "ArrowLeft") next = rtl ? position + 1 : position - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(items[index].value, false);
      return;
    }
    if (next === null || !enabled.length) return;
    event.preventDefault();
    select(enabled[(next + enabled.length) % enabled.length].value, true);
  };

  return (
    <div className={className ? `ca-tabs ${className}` : "ca-tabs"}>
      <div className="ca-tabs__track">
        <div className="ca-tabs__scroller">
          <div
            ref={listRef}
            className={ready ? "ca-tabs__list is-ready" : "ca-tabs__list"}
            role="tablist"
            aria-label={ariaLabel}
            aria-orientation="horizontal"
          >
            <span ref={indicatorRef} className="ca-tabs__indicator" aria-hidden="true" />

            {items.map((item, index) => {
              const active = item.value === selected;
              return (
                <div
                  key={item.value}
                  ref={(node) => {
                    if (node) tabRefs.current.set(item.value, node);
                    else tabRefs.current.delete(item.value);
                  }}
                  className="ca-tabs__tab"
                  role="tab"
                  tabIndex={active ? 0 : -1}
                  aria-selected={active}
                  aria-disabled={item.disabled || undefined}
                  onClick={() => !item.disabled && select(item.value, false)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  {item.icon && (
                    <span className="ca-tabs__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tabs;
