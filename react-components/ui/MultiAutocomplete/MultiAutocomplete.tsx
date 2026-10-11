import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import "./MultiAutocomplete.css";

export type MultiAutocompleteItem = { id: string; name: string };

export type MultiAutocompleteProps = {
  items: MultiAutocompleteItem[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (values: string[]) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  removeItemLabel?: (name: string) => string;
  clearSearchLabel?: string;
  className?: string;
};

const POPOVER_SPACE = 300;

function normalizeForSearch(text: string): string {
  return text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, "")
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0300-\u036f]/g, "")
    .toLowerCase();
}

function selectionEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="ca-ac__check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="ca-ac__chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function MultiAutocomplete({
  items,
  value,
  defaultValue,
  onValueChange,
  label = "انتخاب‌ها",
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو…",
  emptyText = "نتیجه‌ای یافت نشد",
  removeItemLabel = (name) => `حذف ${name}`,
  clearSearchLabel = "پاک کردن جستجو",
  className,
}: MultiAutocompleteProps) {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const listboxId = `${baseId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(() => defaultValue ?? []);
  const selected = isControlled ? value : internalValue;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const itemById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items],
  );

  const normalizedQuery = normalizeForSearch(search);
  const filtered = items.filter((item) =>
    normalizedQuery === "" ? true : normalizeForSearch(item.name).includes(normalizedQuery),
  );

  const updateSelection = (next: string[]) => {
    if (selectionEqual(next, selected)) return;
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const toggleItem = (id: string) => {
    if (selected.includes(id)) {
      updateSelection(selected.filter((v) => v !== id));
    } else {
      updateSelection([...selected, id]);
    }
  };

  const removeTag = (id: string, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    updateSelection(selected.filter((v) => v !== id));
  };

  const closePopover = () => {
    setOpen(false);
    setSearch("");
    setActiveId(null);
  };

  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  const openPopover = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setPlacement(below < POPOVER_SPACE && rect.top > below ? "top" : "bottom");
    }
    setOpen(true);
  };

  const togglePopover = () => {
    if (open) closePopover();
    else openPopover();
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (filtered.length === 0) {
      setActiveId(null);
      return;
    }
    setActiveId((current) =>
      current && filtered.some((item) => item.id === current) ? current : filtered[0].id,
    );
  }, [open, search, items, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        closePopover();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const moveActive = (delta: number) => {
    if (filtered.length === 0) return;
    const index = activeId ? filtered.findIndex((item) => item.id === activeId) : 0;
    const start = index >= 0 ? index : 0;
    const next = (start + delta + filtered.length) % filtered.length;
    setActiveId(filtered[next].id);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      if (filtered.length > 0) setActiveId(filtered[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      if (filtered.length > 0) setActiveId(filtered[filtered.length - 1].id);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeId) toggleItem(activeId);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closePopover();
      toggleRef.current?.focus();
    } else if (event.key === "Tab") {
      closePopover();
    } else if (event.key === "Backspace" && search === "" && selected.length > 0) {
      updateSelection(selected.slice(0, -1));
    }
  };

  const handleToggleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openPopover();
    }
  };

  const rootClass = ["ca-ac", open ? "is-open" : "", className].filter(Boolean).join(" ");

  return (
    <div ref={rootRef} className={rootClass}>
      <label id={labelId} className="ca-ac__label">
        {label}
      </label>

      <div className="ca-ac__trigger" onClick={togglePopover}>
        {selected.length > 0 ? (
          <ul className="ca-ac__tags">
            {selected.map((id) => {
              const item = itemById(id);
              if (!item) return null;
              return (
                <li key={id} className="ca-ac__tag">
                  {item.name}
                  <button
                    type="button"
                    className="ca-ac__tag-remove"
                    aria-label={removeItemLabel(item.name)}
                    onClick={(event) => removeTag(id, event)}
                  >
                    <CloseIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="ca-ac__placeholder">{placeholder}</span>
        )}

        <button
          ref={toggleRef}
          type="button"
          className="ca-ac__toggle"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={labelId}
          onClick={(event) => {
            event.stopPropagation();
            togglePopover();
          }}
          onKeyDown={handleToggleKeyDown}
        >
          <ChevronIcon />
        </button>
      </div>

      {open && (
        <div className={`ca-ac__popover${placement === "top" ? " ca-ac__popover--top" : ""}`}>
          <div className="ca-ac__search">
            <SearchIcon />
            <input
              ref={searchRef}
              type="text"
              className="ca-ac__search-input"
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={activeId ? `${baseId}-option-${activeId}` : undefined}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {search.length > 0 && (
              <button
                type="button"
                className="ca-ac__search-clear"
                aria-label={clearSearchLabel}
                onClick={() => setSearch("")}
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <ul
            id={listboxId}
            className="ca-ac__list"
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={labelId}
          >
            {filtered.length === 0 ? (
              <li className="ca-ac__empty" role="presentation">
                {emptyText}
              </li>
            ) : (
              filtered.map((item) => {
                const isSelected = selected.includes(item.id);
                const isActive = item.id === activeId;
                return (
                  <li
                    key={item.id}
                    id={`${baseId}-option-${item.id}`}
                    className={isActive ? "ca-ac__option is-active" : "ca-ac__option"}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveId(item.id)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleItem(item.id)}
                  >
                    <span>{item.name}</span>
                    <CheckIcon />
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MultiAutocomplete;
