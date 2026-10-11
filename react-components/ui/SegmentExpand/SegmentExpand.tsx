import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import "./SegmentExpand.css";

export type SegmentExpandItem = {
  value: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
};

export type SegmentExpandProps = {
  items: SegmentExpandItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
};

/** Must match `.ca-segment__item[aria-checked="true"] .ca-segment__label-text { padding-inline-start }`. */
const LABEL_GAP = 6;

function firstEnabled(items: SegmentExpandItem[]) {
  return items.find((item) => !item.disabled)?.value;
}

export function SegmentExpand({
  items,
  value,
  defaultValue,
  onValueChange,
  ariaLabel = "بخش‌ها",
  className,
}: SegmentExpandProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    () => defaultValue ?? firstEnabled(items),
  );
  const requested = isControlled ? value : internalValue;
  const selected = items.some((item) => item.value === requested)
    ? requested
    : firstEnabled(items);

  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [ready, setReady] = useState(false);

  /** Final width of an item once its label transition ends, so the indicator never chases a mid-transition layout. */
  const settledWidth = (item: HTMLButtonElement, active: boolean) => {
    const label = item.querySelector<HTMLElement>(".ca-segment__label");
    const text = item.querySelector<HTMLElement>(".ca-segment__label-text");
    if (!label || !text) return item.offsetWidth;
    const collapsed = item.offsetWidth - label.offsetWidth;
    if (!active) return collapsed;
    const padding = parseFloat(getComputedStyle(text).paddingInlineStart) || 0;
    return collapsed + text.scrollWidth - padding + LABEL_GAP;
  };

  const moveIndicator = useCallback(() => {
    const group = groupRef.current;
    const indicator = indicatorRef.current;
    const item = selected !== undefined ? itemRefs.current.get(selected) : undefined;
    if (!group || !indicator || !item) return;

    const style = getComputedStyle(group);
    const gap = parseFloat(style.columnGap) || 0;
    let start = parseFloat(style.paddingInlineStart) || 0;
    for (const entry of items) {
      if (entry.value === selected) break;
      const node = itemRefs.current.get(entry.value);
      if (node) start += settledWidth(node, false) + gap;
    }

    const direction = style.direction === "rtl" ? -1 : 1;
    indicator.style.width = `${settledWidth(item, true)}px`;
    indicator.style.height = `${item.offsetHeight}px`;
    indicator.style.translate = `${start * direction}px ${item.offsetTop}px`;
  }, [items, selected]);

  useLayoutEffect(() => {
    moveIndicator();
  }, [moveIndicator]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(moveIndicator);
    for (const node of itemRefs.current.values()) {
      observer.observe(node);
    }
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) moveIndicator();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [moveIndicator, items, selected]);

  const select = (next: string, focus: boolean) => {
    if (items.find((item) => item.value === next)?.disabled) return;
    if (!isControlled) setInternalValue(next);
    if (next !== selected) onValueChange?.(next);
    if (focus) itemRefs.current.get(next)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = items.filter((item) => !item.disabled);
    const position = enabled.findIndex((item) => item.value === items[index].value);
    const rtl = groupRef.current
      ? getComputedStyle(groupRef.current).direction === "rtl"
      : false;

    let next: number | null = null;
    if (event.key === "ArrowRight") next = rtl ? position - 1 : position + 1;
    else if (event.key === "ArrowLeft") next = rtl ? position + 1 : position - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else return;

    if (next === null || !enabled.length) return;
    event.preventDefault();
    select(enabled[(next + enabled.length) % enabled.length].value, true);
  };

  const rootClass = [
    "ca-segment",
    ready ? "is-ready" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={groupRef}
      className={rootClass}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      <span ref={indicatorRef} className="ca-segment__indicator" aria-hidden="true" />

      {items.map((item, index) => {
        const active = item.value === selected;
        return (
          <button
            key={item.value}
            ref={(node) => {
              if (node) itemRefs.current.set(item.value, node);
              else itemRefs.current.delete(item.value);
            }}
            type="button"
            className="ca-segment__item"
            role="radio"
            aria-checked={active}
            aria-label={item.label}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => select(item.value, false)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className="ca-segment__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="ca-segment__label">
              <span className="ca-segment__label-text">{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentExpand;
