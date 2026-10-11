import { Fragment, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import "./ActionListBox.css";

export type ActionItem = {
  key: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Keys shown in the shortcut badge, e.g. ["⌘", "⇧", "D"]. Display only. */
  shortcut?: string[];
  variant?: "default" | "danger";
  disabled?: boolean;
};

export type ActionSection = {
  key: string;
  title?: ReactNode;
  items: ActionItem[];
};

export type ActionListBoxProps = {
  sections: ActionSection[];
  onAction?: (key: string) => void;
  /** Item that receives the roving tab stop initially. Defaults to the first enabled item. */
  defaultFocusedKey?: string;
  ariaLabel?: string;
  className?: string;
};

const MODIFIER_TITLES: Record<string, string> = {
  "⌘": "Command",
  "⇧": "Shift",
  "⌥": "Option",
  "⌃": "Control",
};

export function ActionListBox({
  sections,
  onAction,
  defaultFocusedKey,
  ariaLabel = "عملیات",
  className,
}: ActionListBoxProps) {
  const baseId = useId();
  const enabledKeys = sections.flatMap((s) => s.items.filter((i) => !i.disabled).map((i) => i.key));
  const [focusedKey, setFocusedKey] = useState(() =>
    defaultFocusedKey && enabledKeys.includes(defaultFocusedKey) ? defaultFocusedKey : enabledKeys[0],
  );
  const tabStop = focusedKey && enabledKeys.includes(focusedKey) ? focusedKey : enabledKeys[0];
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  const focusItem = (key: string) => {
    setFocusedKey(key);
    itemRefs.current.get(key)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: ActionItem) => {
    const index = enabledKeys.indexOf(item.key);
    let next: string | undefined;
    if (event.key === "ArrowDown") next = enabledKeys[Math.min(index + 1, enabledKeys.length - 1)];
    else if (event.key === "ArrowUp") next = enabledKeys[Math.max(index - 1, 0)];
    else if (event.key === "Home") next = enabledKeys[0];
    else if (event.key === "End") next = enabledKeys[enabledKeys.length - 1];
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!item.disabled) onAction?.(item.key);
      return;
    }
    if (next === undefined) return;
    event.preventDefault();
    focusItem(next);
  };

  return (
    <div className={className ? `ca-listbox ${className}` : "ca-listbox"}>
      <div className="ca-listbox__list" role="listbox" aria-label={ariaLabel} aria-orientation="vertical">
        {sections.map((section, sectionIndex) => {
          const headerId = `${baseId}-section-${section.key}`;
          return (
            <Fragment key={section.key}>
              {sectionIndex > 0 && <div className="ca-listbox__separator" role="separator" />}
              <section
                className="ca-listbox__section"
                role="group"
                aria-labelledby={section.title ? headerId : undefined}
              >
                {section.title && (
                  <header id={headerId} className="ca-listbox__header" role="presentation">
                    {section.title}
                  </header>
                )}

                {section.items.map((item) => {
                  const descriptionId = `${baseId}-desc-${item.key}`;
                  const className = [
                    "ca-listbox__item",
                    item.variant === "danger" && "ca-listbox__item--danger",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={item.key}
                      ref={(node) => {
                        if (node) itemRefs.current.set(item.key, node);
                        else itemRefs.current.delete(item.key);
                      }}
                      className={className}
                      role="option"
                      aria-selected={false}
                      aria-disabled={item.disabled || undefined}
                      aria-describedby={item.description ? descriptionId : undefined}
                      tabIndex={item.key === tabStop ? 0 : -1}
                      onFocus={() => setFocusedKey(item.key)}
                      onClick={() => !item.disabled && onAction?.(item.key)}
                      onKeyDown={(event) => handleKeyDown(event, item)}
                    >
                      {item.icon && (
                        <span className="ca-listbox__icon" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}

                      <span className="ca-listbox__text">
                        <span className="ca-listbox__label">{item.label}</span>
                        {item.description && (
                          <span id={descriptionId} className="ca-listbox__description">
                            {item.description}
                          </span>
                        )}
                      </span>

                      {item.shortcut && item.shortcut.length > 0 && (
                        <kbd className="ca-listbox__kbd">
                          <span className="ca-listbox__kbd-keys">
                            {item.shortcut.map((key, i) =>
                              MODIFIER_TITLES[key] ? (
                                <abbr key={i} className="ca-listbox__kbd-mod" title={MODIFIER_TITLES[key]}>
                                  {key}
                                </abbr>
                              ) : (
                                <span key={i}>{key}</span>
                              ),
                            )}
                          </span>
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </section>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default ActionListBox;
