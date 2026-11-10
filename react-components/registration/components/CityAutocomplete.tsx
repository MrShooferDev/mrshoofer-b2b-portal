import { useEffect, useId, useMemo, useRef, useState } from "react";
import { fetchCities } from "../api/cities.ts";

export type CityAutocompleteProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  labelledBy?: string;
  describedBy?: string;
};

const norm = (s: string) =>
  s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\s]+/g, " ").trim().toLowerCase();

export function CityAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  labelledBy,
  describedBy,
}: CityAutocompleteProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchCities().then((c) => alive && setCities(c));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const matches = useMemo(() => {
    const q = norm(value);
    const list = q ? cities.filter((c) => norm(c).includes(q)) : cities;
    return list.slice(0, 8);
  }, [cities, value]);

  const select = (city: string) => {
    onChange(city);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="reg-city" ref={rootRef}>
      <input
        id={id}
        className="reg-control reg-input"
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        placeholder={placeholder}
        value={value}
        maxLength={100}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && active >= 0 && matches[active]) {
            e.preventDefault();
            select(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 ? (
        <ul className="reg-city__list" id={listId} role="listbox">
          {matches.map((c, i) => (
            <li
              key={c}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`reg-city__opt${i === active ? " is-active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(c);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {c}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
