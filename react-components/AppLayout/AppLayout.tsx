import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { SegmentExpand, type SegmentExpandItem } from "../ui";
import "./AppLayout.css";

const PATHS = {
  house: "M2.5 7 8 2.5 13.5 7v6a.5.5 0 0 1-.5.5h-3v-4H6v4H3a.5.5 0 0 1-.5-.5z",
  calendar: "M3 3.5h10a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5M2.5 6.5h11M5.5 2v3M10.5 2v3",
  sparkles: "M7 2l1.2 3.3L11.5 6.5 8.2 7.7 7 11 5.8 7.7 2.5 6.5l3.3-1.2zM12 10.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z",
  envelope: "M3 3.5h10a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5M2.8 4.3 8 8.5l5.2-4.2",
  file: "M4 1.5h5L12.5 5v9a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5M9 1.5V5h3.5M5.5 8.5h5M5.5 11h5",
  bookOpen: "M8 4C6.5 3 4.5 2.5 2 2.5v10c2.5 0 4.5.5 6 1.5 1.5-1 3.5-1.5 6-1.5v-10c-2.5 0-4.5.5-6 1.5M8 4v10",
  check: "M3 2.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5M5.5 8l1.8 1.8 3.2-3.6",
  target: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8 8h.01",
  rocket: "M9.5 10.5 5.5 6.5C7 3 10 1.5 14.5 1.5c0 4.5-1.5 7.5-5 9M5.5 6.5H3L1.5 8.5l3 .5M9.5 10.5V13l-2 1.5-.5-3M4 12c-1 1-1.5 2.5-1.5 2.5S4 14 5 13",
  chart: "M2.5 13.5h11M4.5 11V8M8 11V4M11.5 11V6.5",
  code: "M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5",
  pencil: "M10.5 2.5l3 3-8 8h-3v-3z",
  database: "M8 5.5c3 0 5.5-.9 5.5-2S11 1.5 8 1.5 2.5 2.4 2.5 3.5 5 5.5 8 5.5M2.5 3.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2",
  star: "M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z",
  lock: "M4 7h8a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-6A.5.5 0 0 1 4 7M5.5 7V5a2.5 2.5 0 0 1 5 0v2",
  archive: "M2 2.5h12v3H2zM3 5.5v8h10v-8M6.5 8.5h3",
  person: "M8 7.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5M2.5 14c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4",
  plus: "M8 3v10M3 8h10",
  gear: "M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4M6.9 1.5h2.2l.4 1.9 1.3.8 1.9-.6 1.1 1.9-1.5 1.3v1.5l1.5 1.3-1.1 1.9-1.9-.6-1.3.8-.4 1.9H6.9l-.4-1.9-1.3-.8-1.9.6-1.1-1.9 1.5-1.3V7.2L2.2 5.9l1.1-1.9 1.9.6 1.3-.8z",
  receipt: "M3.5 1.5h9v13l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1zM6 5h4M6 8h4",
  book: "M3.5 13V3A1.5 1.5 0 0 1 5 1.5h7.5v10H5a1.5 1.5 0 0 0 0 3h7.5",
  cart: "M1.5 2h2l1.5 8h7.5l1.5-5.5H4M6 13.5h.01M11.5 13.5h.01",
  question: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M6.2 6.2a1.9 1.9 0 0 1 3.7.6c0 1.2-1.9 1.5-1.9 2.7M8 11.5h.01",
  trash: "M2.5 4h11M6 4V2.5h4V4M4 4l.6 9.5h6.8L12 4M6.5 6.5V11M9.5 6.5V11",
  chevronDown: "M4 6l4 4 4-4",
  chevronEnd: "M6 4l4 4-4 4",
  dotsV: "M8 3.5h.01M8 8h.01M8 12.5h.01",
  dots: "M3.5 8h.01M8 8h.01M12.5 8h.01",
  folder: "M1.5 4a1 1 0 0 1 1-1H6l1.5 1.5h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z",
  copy: "M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3",
  hashtag: "M3 6h10.5M2.5 10H13M6.5 2.5l-1 11M10.5 2.5l-1 11",
  arrowUp: "M8 13V3M4 7l4-4 4 4",
  arrowDown: "M8 3v10M4 9l4 4 4-4",
  eyeSlash: "M2 2l12 12M6.6 6.6a2 2 0 0 0 2.8 2.8M4.2 4.3C2.7 5.3 1.5 8 1.5 8s2.5 5 6.5 5c1.3 0 2.4-.4 3.3-1M7 3.1Q7.5 3 8 3c4 0 6.5 5 6.5 5s-.5 1-1.5 2.2",
  sidebar: "M3 2.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5M6 2.5v11",
} as const;

type IconName = keyof typeof PATHS;

function Icon({ name, className = "ca-al__svg" }: { name: IconName; className?: string }) {
  const dotted = name === "dots" || name === "dotsV";
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={PATHS[name]} stroke="currentColor" strokeWidth={dotted ? 2.25 : 1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ComposeIcon() {
  return (
    <svg className="ca-al__svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6.169 6.331a3 3 0 0 0-.833 1.6l-.338 1.912a1 1 0 0 0 1.159 1.159l1.912-.338a3 3 0 0 0 1.6-.833l3.07-3.07 2-2A.9.9 0 0 0 15 4.13 3.13 3.13 0 0 0 11.87 1a.9.9 0 0 0-.632.262l-2 2zm3.936-1.814L7.229 7.392a1.5 1.5 0 0 0-.416.8L6.6 9.4l1.208-.213.057-.01a1.5 1.5 0 0 0 .743-.406l2.875-2.876a1.63 1.63 0 0 0-1.378-1.378m2.558.199a3.14 3.14 0 0 0-1.379-1.38l.82-.82a1.63 1.63 0 0 1 1.38 1.38zM8 2.25a.75.75 0 0 0-.75-.75H4.5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3V8.75a.75.75 0 0 0-1.5 0v2.75a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3h2.75A.75.75 0 0 0 8 2.25" />
    </svg>
  );
}

type MenuAction = { id: string; label: string; icon: IconName; danger?: boolean };

const ITEM_ACTIONS: MenuAction[][] = [
  [
    { id: "open", label: "باز کردن", icon: "folder" },
    { id: "duplicate", label: "تکثیر", icon: "copy" },
    { id: "delete", label: "حذف", icon: "trash", danger: true },
  ],
];

const SECTION_ACTIONS: MenuAction[][] = [
  [
    { id: "show", label: "نمایش", icon: "hashtag" },
    { id: "move-up", label: "انتقال به بالا", icon: "arrowUp" },
    { id: "move-down", label: "انتقال به پایین", icon: "arrowDown" },
    { id: "hide", label: "پنهان کردن بخش", icon: "eyeSlash" },
  ],
  [
    { id: "new-teamspace", label: "فضای تیمی جدید", icon: "plus" },
    { id: "open-library", label: "باز کردن در کتابخانه", icon: "book" },
  ],
];

function ActionMenu({
  label,
  sections,
  icon,
  triggerClassName,
  width,
  onAction,
}: {
  label: string;
  sections: MenuAction[][];
  icon: IconName;
  triggerClassName: string;
  width: number;
  onAction: (action: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!open || !trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const rtl = getComputedStyle(trigger).direction === "rtl";
    const { offsetWidth: w, offsetHeight: h } = menu;
    let left = rtl ? rect.left - w - 6 : rect.right + 6;
    if (left < 8) left = rect.right + 6;
    if (left + w > window.innerWidth - 8) left = Math.max(8, rect.left - w - 6);
    setPosition({ top: Math.max(8, Math.min(rect.top, window.innerHeight - h - 8)), left });
    menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  const hide = (restoreFocus: boolean) => {
    setOpen(false);
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (event.key === "ArrowDown") next = index + 1;
    else if (event.key === "ArrowUp") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      hide(true);
      return;
    } else if (event.key === "Tab") {
      hide(false);
      return;
    } else return;
    event.preventDefault();
    items[(next + items.length) % items.length]?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? hide(false) : setOpen(true))}
      >
        <Icon name={icon} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="ca-al-portal ca-al-menu"
            role="menu"
            aria-label={label}
            style={{
              width,
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
            onKeyDown={handleKeyDown}
          >
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="ca-al-menu__section" role="group">
                {section.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    className={`ca-al-menu__item${action.danger ? " is-danger" : ""}`}
                    onClick={() => {
                      onAction(action.id);
                      hide(true);
                    }}
                  >
                    <Icon name={action.icon} className="ca-al-menu__icon" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

type NavItem = { id: string; label: string; icon: IconName; badge?: IconName; muted?: boolean };

const SEGMENT_ITEMS: SegmentExpandItem[] = [
  { value: "home", label: "خانه", icon: <Icon name="house" /> },
  { value: "meetings", label: "جلسات", icon: <Icon name="calendar" /> },
  { value: "ai", label: "هوش مصنوعی", icon: <Icon name="sparkles" /> },
  { value: "inbox", label: "صندوق ورودی", icon: <Icon name="envelope" /> },
];

const RECENTS: NavItem[] = [
  { id: "user-settings", label: "تنظیمات کاربر", icon: "file" },
  { id: "onboarding", label: "فرایند آشنایی", icon: "file" },
  { id: "api-gateway", label: "درگاه API", icon: "file" },
  { id: "theme-builder", label: "سازندهٔ پوسته", icon: "file" },
  { id: "navigation", label: "ناوبری", icon: "file" },
];

const FAVORITES: NavItem[] = [
  { id: "fav-tutorials", label: "آموزش‌ها", icon: "bookOpen" },
  { id: "fav-tasks", label: "کارهای من", icon: "check" },
];

const AGENTS: NavItem[] = [
  { id: "personal", label: "شخصی", icon: "person" },
  { id: "add-agent", label: "افزودن جدید", icon: "plus", muted: true },
];

const HQ: NavItem = { id: "hq", label: "دفتر مرکزی", icon: "house" };

const HQ_ITEMS: NavItem[] = [
  { id: "ts-home", label: "خانه", icon: "house" },
  { id: "ts-tasks", label: "کارهای من", icon: "check" },
  { id: "ts-projects", label: "پروژه‌ها", icon: "target" },
  { id: "ts-epics", label: "اپیک‌ها", icon: "rocket" },
  { id: "ts-roadmap", label: "نقشهٔ راه", icon: "chart" },
  { id: "ts-sprint-board", label: "بورد اسپرینت", icon: "sparkles" },
  { id: "ts-eng-board", label: "بورد مهندسی", icon: "code" },
  { id: "ts-design-board", label: "بورد طراحی", icon: "pencil" },
  { id: "ts-sprints", label: "اسپرینت‌ها", icon: "database" },
  { id: "ts-initiatives", label: "ابتکارها", icon: "star" },
  { id: "ts-vault", label: "گاوصندوق", icon: "lock" },
  { id: "ts-archive", label: "بایگانی", icon: "archive" },
  { id: "ts-wiki", label: "ویکی", icon: "bookOpen" },
  { id: "ts-brainstorm", label: "طوفان فکری", icon: "sparkles" },
  { id: "ts-standup", label: "جلسهٔ روزانه", icon: "person" },
  { id: "ts-launch", label: "انتشار نسخهٔ ۳", icon: "rocket" },
];

const TEAMSPACES: NavItem[] = [
  { id: "engineering", label: "مهندسی", icon: "gear" },
  { id: "metrics", label: "شاخص‌ها", icon: "chart", badge: "lock" },
  { id: "tracker", label: "ردیاب", icon: "target" },
  { id: "reports", label: "گزارش‌ها", icon: "receipt" },
];

const SHARED: NavItem[] = [{ id: "shared-sprints", label: "اسپرینت‌ها", icon: "database" }];

const APPS: NavItem[] = [
  { id: "mail", label: "ایمیل شوفر", icon: "envelope" },
  { id: "calendar", label: "تقویم شوفر", icon: "calendar" },
];

const UTILITIES: NavItem[] = [
  { id: "library", label: "کتابخانه", icon: "book" },
  { id: "util-tasks", label: "کارهای من", icon: "check" },
  { id: "marketplace", label: "بازارچه", icon: "cart" },
  { id: "help", label: "راهنما", icon: "question" },
  { id: "trash", label: "سطل زباله", icon: "trash" },
];

const ALL_ITEMS = [RECENTS, FAVORITES, AGENTS, [HQ], HQ_ITEMS, TEAMSPACES, SHARED, APPS, UTILITIES].flat();

export type AppLayoutProps = {
  defaultCurrent?: string;
  defaultSection?: string;
  defaultCollapsed?: boolean;
  onNavigate?: (id: string, label: string) => void;
  onItemAction?: (id: string, action: string) => void;
  onSectionChange?: (value: string) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewChat?: () => void;
  children?: ReactNode;
};

const MOBILE_QUERY = "(max-width: 767px)";

export function AppLayout({
  defaultCurrent = "ts-roadmap",
  defaultSection = "home",
  defaultCollapsed = false,
  onNavigate,
  onItemAction,
  onSectionChange,
  onCollapsedChange,
  onNewChat,
  children,
}: AppLayoutProps) {
  const [current, setCurrent] = useState(defaultCurrent);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hqExpanded, setHqExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => {
      setIsMobile(query.matches);
      if (!query.matches) setMobileOpen(false);
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const iconOnly = collapsed && !isMobile;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((value) => {
      onCollapsedChange?.(!value);
      return !value;
    });
  };

  const navigate = (item: NavItem) => {
    setCurrent(item.id);
    setMobileOpen(false);
    onNavigate?.(item.id, item.label);
  };

  const currentItem = ALL_ITEMS.find((item) => item.id === current);
  const trail = currentItem ? [currentItem] : [];

  const renderItem = (item: NavItem, withActions = false) => (
    <li key={item.id} className="ca-al__item" data-current={item.id === current || undefined}>
      <a
        href="#"
        className="ca-al__item-content"
        aria-current={item.id === current ? "page" : undefined}
        title={iconOnly ? item.label : undefined}
        onClick={(event) => {
          event.preventDefault();
          navigate(item);
        }}
      >
        <span className="ca-al__item-icon">
          <Icon name={item.icon} />
        </span>
        <span className={`ca-al__item-label${item.muted ? " is-muted" : ""}`}>{item.label}</span>
        {item.badge && (
          <span className="ca-al__item-chip">
            <Icon name={item.badge} className="ca-al__svg ca-al__svg--xs" />
          </span>
        )}
      </a>
      {withActions && !iconOnly && (
        <span className="ca-al__item-actions">
          <ActionMenu
            label={`عملیات بیشتر برای ${item.label}`}
            sections={ITEM_ACTIONS}
            icon="dotsV"
            width={176}
            triggerClassName="ca-al__item-action"
            onAction={(action) => onItemAction?.(item.id, action)}
          />
        </span>
      )}
    </li>
  );

  const group = (label: ReactNode, ariaLabel: string, items: ReactNode) => (
    <div className="ca-al__group">
      <div className="ca-al__group-label">{label}</div>
      <ul className="ca-al__menu" aria-label={ariaLabel}>
        {items}
      </ul>
    </div>
  );

  const rootClass = [
    "ca-al",
    iconOnly ? "is-collapsed" : "",
    isMobile ? "is-mobile" : "",
    mobileOpen ? "is-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {isMobile && (
        <div className="ca-al__backdrop" aria-hidden="true" onClick={() => setMobileOpen(false)} />
      )}

      <aside className="ca-al__sidebar" aria-label="نوار کناری" {...((isMobile && !mobileOpen ? { inert: "" } : {}) as Record<string, string>)}>
        <div className="ca-al__sidebar-inner">
        <div className="ca-al__header">
          <div className="ca-al__brand-row">
            <div className="ca-al__brand">
              <span className="ca-al__logo">ش</span>
              <span className="ca-al__brand-name ca-al__hide-collapsed">شوفر</span>
            </div>
            <button type="button" className="ca-al__compose ca-al__hide-collapsed" aria-label="نوشتن">
              <ComposeIcon />
              <Icon name="chevronDown" className="ca-al__svg ca-al__svg--xs ca-al__muted" />
            </button>
          </div>
          {!iconOnly && (
            <SegmentExpand
              className="ca-al__segment"
              items={SEGMENT_ITEMS}
              defaultValue={defaultSection}
              ariaLabel="بخش‌ها"
              onValueChange={onSectionChange}
            />
          )}
        </div>

        <nav className="ca-al__content" aria-label="ناوبری اصلی">
          {group("اخیر", "اخیر", RECENTS.map((item) => renderItem(item)))}
          {group("علاقه‌مندی‌ها", "علاقه‌مندی‌ها", FAVORITES.map((item) => renderItem(item)))}
          {group(
            <span className="ca-al__label-row">
              عامل‌ها <span className="ca-al__chip">بتا</span>
            </span>,
            "عامل‌ها",
            AGENTS.map((item) => renderItem(item)),
          )}
          {group(
            <span className="ca-al__label-row ca-al__label-row--spread">
              فضاهای تیمی
              <ActionMenu
                label="عملیات بخش فضاهای تیمی"
                sections={SECTION_ACTIONS}
                icon="dots"
                width={192}
                triggerClassName="ca-al__section-action"
                onAction={(action) => onItemAction?.("teamspaces", action)}
              />
            </span>,
            "فضاهای تیمی",
            <>
              <li className="ca-al__item" data-expanded={hqExpanded || undefined}>
                <button
                  type="button"
                  className="ca-al__item-content"
                  aria-expanded={hqExpanded}
                  title={iconOnly ? HQ.label : undefined}
                  onClick={() => setHqExpanded((value) => !value)}
                >
                  <span className="ca-al__item-icon">
                    <Icon name={HQ.icon} />
                  </span>
                  <span className="ca-al__item-label">
                    {HQ.label}
                    <Icon name="chevronEnd" className="ca-al__indicator" />
                  </span>
                </button>
              </li>
              {hqExpanded && !iconOnly && (
                <li className="ca-al__submenu-wrap">
                  <ul className="ca-al__menu ca-al__submenu" aria-label={HQ.label}>
                    {HQ_ITEMS.map((item) => renderItem(item, true))}
                  </ul>
                </li>
              )}
              {TEAMSPACES.map((item) => renderItem(item, true))}
            </>,
          )}
          <hr className="ca-al__separator" />
          {group("اشتراکی", "اشتراکی", SHARED.map((item) => renderItem(item)))}
          {group("برنامه‌ها", "برنامه‌ها", APPS.map((item) => renderItem(item)))}
        </nav>

        <hr className="ca-al__separator ca-al__separator--flush" />

        <div className="ca-al__footer">
          {!isMobile && (
            <ul className="ca-al__menu" aria-label="ابزارها">
              {UTILITIES.map((item) => renderItem(item))}
            </ul>
          )}
          <div className="ca-al__footer-actions">
            {!iconOnly && (
              <button type="button" className="ca-al__new-chat" onClick={onNewChat}>
                <Icon name="sparkles" />
                <span>گفتگوی جدید</span>
                <kbd className="ca-al__kbd">
                  <span dir="ltr">⌘ N</span>
                </kbd>
              </button>
            )}
            <button type="button" className="ca-al__icon-button" aria-label="نوشتن" onClick={onNewChat}>
              <Icon name="pencil" />
            </button>
          </div>
        </div>
        </div>
        <button
          type="button"
          className="ca-al__rail"
          aria-label={collapsed ? "باز کردن نوار کناری" : "بستن نوار کناری"}
          tabIndex={-1}
          onClick={toggleSidebar}
        />
      </aside>

      <main className="ca-al__main">
        <header className="ca-al__topbar">
          <button
            type="button"
            className="ca-al__icon-button"
            aria-label={isMobile ? "باز کردن نوار کناری" : collapsed ? "باز کردن نوار کناری" : "بستن نوار کناری"}
            aria-expanded={isMobile ? mobileOpen : !collapsed}
            onClick={toggleSidebar}
          >
            <Icon name="sidebar" />
          </button>
          <nav aria-label="مسیر">
            <ol className="ca-al__breadcrumbs">
              {trail.map((item, index) => {
                const last = index === trail.length - 1;
                return (
                  <li key={item.id} className={`ca-al__crumb${last ? " is-current" : ""}`}>
                    {last ? (
                      <span aria-current="page" className="ca-al__crumb-inner">
                        <Icon name={item.icon} />
                        <span className="ca-al__truncate">{item.label}</span>
                      </span>
                    ) : (
                      <a href="#" className="ca-al__crumb-inner" onClick={(event) => event.preventDefault()}>
                        <Icon name={item.icon} />
                        <span className="ca-al__truncate">{item.label}</span>
                      </a>
                    )}
                    {!last && <Icon name="chevronEnd" className="ca-al__svg ca-al__svg--xs ca-al__crumb-sep" />}
                  </li>
                );
              })}
            </ol>
          </nav>
        </header>
        <div className="ca-al__body">
          {children ?? (
            <p className="ca-al__lead">
              نوار کناری پیچیده با فاصله‌گذاری فشرده. همهٔ تراکم با{" "}
              <code className="ca-al__code" dir="ltr">--spacing: 0.2rem</code> کنترل می‌شود.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
