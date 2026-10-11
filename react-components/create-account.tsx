import { createRoot } from "react-dom/client";
import {
  ActionListBox,
  CtaBanner,
  MultiAutocomplete,
  NumberStepper,
  Onboarding,
  SegmentExpand,
  Tabs,
  type ActionSection,
  type DrawerPlacement,
  type MultiAutocompleteItem,
  type SegmentExpandItem,
  type TabItem,
} from "./ui/index";
import { DrawerPlacements } from "./demos/DrawerPlacements";
import { AppLayout } from "./AppLayout/AppLayout";

document.querySelectorAll<HTMLElement>("[data-ca-app-layout]").forEach((mount) => {
  const { defaultCurrent, defaultSection, defaultCollapsed } = mount.dataset;
  const emit = (name: string, detail: object) =>
    mount.dispatchEvent(new CustomEvent(`ca-app-layout:${name}`, { detail, bubbles: true }));

  createRoot(mount).render(
    <AppLayout
      defaultCurrent={defaultCurrent || undefined}
      defaultSection={defaultSection || undefined}
      defaultCollapsed={defaultCollapsed === "true"}
      onNavigate={(id, label) => emit("navigate", { id, label })}
      onItemAction={(id, action) => emit("action", { id, action })}
      onSectionChange={(value) => emit("section-change", { value })}
      onCollapsedChange={(collapsed) => emit("toggle", { collapsed })}
      onNewChat={() => emit("new-chat", {})}
    />,
  );
});

const items: TabItem[] = [
  {
    value: "chats",
    label: "گفتگوها",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="m4.843 10.944-.194 2.335a.204.204 0 0 0 .339.17l2.21-1.964.589.013L8 11.5c1.695 0 3.087-.44 4.02-1.177.89-.702 1.48-1.76 1.48-3.323s-.59-2.62-1.48-3.323C11.087 2.94 9.695 2.5 8 2.5s-3.087.44-4.02 1.177C3.09 4.38 2.5 5.437 2.5 7c0 1.648.656 2.742 1.648 3.448zm1.141 3.625 1.77-1.572Q7.875 13 8 13c3.866 0 7-2 7-6s-3.134-6-7-6-7 2-7 6c0 2.117.878 3.674 2.277 4.67l-.123 1.484a1.704 1.704 0 0 0 2.83 1.415" />
      </svg>
    ),
  },
  {
    value: "emails",
    label: "ایمیل‌ها",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M3.5 4h9c.25 0 .485.06.692.169L8.75 7.5a1.25 1.25 0 0 1-1.5 0L2.808 4.169C3.015 4.06 3.251 4 3.5 4M2.001 5.438 2 5.5v5A1.5 1.5 0 0 0 3.5 12h9a1.5 1.5 0 0 0 1.5-1.5v-5l-.001-.062L9.65 8.7a2.75 2.75 0 0 1-3.3 0zM.5 5.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3z" />
      </svg>
    ),
  },
];

document.querySelectorAll<HTMLElement>("[data-ca-tabs]").forEach((mount) => {
  const { defaultValue, ariaLabel } = mount.dataset;

  createRoot(mount).render(
    <Tabs
      items={items}
      defaultValue={defaultValue}
      ariaLabel={ariaLabel}
      onValueChange={(value) =>
        mount.dispatchEvent(
          new CustomEvent("ca-tabs:change", { detail: { value }, bubbles: true }),
        )
      }
    />,
  );
});

function numberAttr(raw: string | undefined) {
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

document.querySelectorAll<HTMLElement>("[data-ca-stepper]").forEach((mount) => {
  const { defaultValue, min, max, step, values, label } = mount.dataset;
  const valueList = values
    ?.split(",")
    .map(numberAttr)
    .filter((n): n is number => n !== undefined);

  createRoot(mount).render(
    <NumberStepper
      defaultValue={numberAttr(defaultValue)}
      min={numberAttr(min)}
      max={numberAttr(max)}
      step={numberAttr(step)}
      values={valueList}
      label={label}
      onValueChange={(value) =>
        mount.dispatchEvent(
          new CustomEvent("ca-stepper:change", { detail: { value }, bubbles: true }),
        )
      }
    />,
  );
});

const fileActions: ActionSection[] = [
  {
    key: "actions",
    title: "عملیات",
    items: [
      {
        key: "new-file",
        label: "فایل جدید",
        description: "ساخت یک فایل جدید",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4.5 3h7A1.5 1.5 0 0 1 13 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3m-3 1.5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3zm7.25 1a.75.75 0 0 0-1.5 0v1.75H5.5a.75.75 0 1 0 0 1.5h1.75v1.75a.75.75 0 0 0 1.5 0V8.75h1.75a.75.75 0 0 0 0-1.5H8.75z" />
          </svg>
        ),
      },
      {
        key: "edit-file",
        label: "ویرایش فایل",
        description: "اعمال تغییرات",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M11.423 1A3.577 3.577 0 0 1 15 4.577c0 .27-.108.53-.3.722l-.528.529-1.971 1.971-5.059 5.059a3 3 0 0 1-1.533.82l-2.638.528a1 1 0 0 1-1.177-1.177l.528-2.638a3 3 0 0 1 .82-1.533l5.059-5.059 2.5-2.5c.191-.191.451-.299.722-.299m-2.31 4.009-4.91 4.91a1.5 1.5 0 0 0-.41.766l-.38 1.903 1.902-.38a1.5 1.5 0 0 0 .767-.41l4.91-4.91a2.08 2.08 0 0 0-1.88-1.88m3.098.658a3.6 3.6 0 0 0-1.878-1.879l1.28-1.28c.995.09 1.788.884 1.878 1.88z" />
          </svg>
        ),
      },
    ],
  },
  {
    key: "danger",
    title: "منطقهٔ خطر",
    items: [
      {
        key: "delete-file",
        label: "حذف فایل",
        description: "انتقال به سطل زباله",
        variant: "danger",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M9 2H7a.5.5 0 0 0-.5.5V3h3v-.5A.5.5 0 0 0 9 2m2 1v-.5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2V3H2.251a.75.75 0 0 0 0 1.5h.312l.317 7.625A3 3 0 0 0 5.878 15h4.245a3 3 0 0 0 2.997-2.875l.318-7.625h.312a.75.75 0 0 0 0-1.5zm.936 1.5H4.064l.315 7.562A1.5 1.5 0 0 0 5.878 13.5h4.245a1.5 1.5 0 0 0 1.498-1.438zm-6.186 2v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-1.5 0m3.75-.75a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5a.75.75 0 0 1 .75-.75" />
          </svg>
        ),
      },
    ],
  },
];

document.querySelectorAll<HTMLElement>("[data-ca-listbox]").forEach((mount) => {
  const { defaultFocusedKey, ariaLabel } = mount.dataset;

  createRoot(mount).render(
    <ActionListBox
      sections={fileActions}
      defaultFocusedKey={defaultFocusedKey}
      ariaLabel={ariaLabel}
      onAction={(key) =>
        mount.dispatchEvent(new CustomEvent("ca-listbox:action", { detail: { key }, bubbles: true }))
      }
    />,
  );
});

const segmentItems: SegmentExpandItem[] = [
  {
    value: "home",
    label: "خانه",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    value: "chat",
    label: "گفتگو",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    value: "meetings",
    label: "جلسات",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    value: "inbox",
    label: "صندوق ورودی",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
      </svg>
    ),
  },
];

document.querySelectorAll<HTMLElement>("[data-ca-segment]").forEach((mount) => {
  const { defaultValue, ariaLabel } = mount.dataset;

  createRoot(mount).render(
    <SegmentExpand
      items={segmentItems}
      defaultValue={defaultValue}
      ariaLabel={ariaLabel}
      onValueChange={(value) =>
        mount.dispatchEvent(
          new CustomEvent("ca-segment:change", { detail: { value }, bubbles: true }),
        )
      }
    />,
  );
});

const autocompleteItems: MultiAutocompleteItem[] = [
  { id: "tehran", name: "تهران" },
  { id: "isfahan", name: "اصفهان" },
  { id: "fars", name: "فارس" },
  { id: "khorasan-razavi", name: "خراسان رضوی" },
  { id: "gilan", name: "گیلان" },
  { id: "mazandaran", name: "مازندران" },
];

document.querySelectorAll<HTMLElement>("[data-ca-autocomplete]").forEach((mount) => {
  const { defaultValue, label, placeholder } = mount.dataset;
  const initial =
    defaultValue === undefined || defaultValue.trim() === ""
      ? []
      : defaultValue.split(",").map((part) => part.trim()).filter(Boolean);

  createRoot(mount).render(
    <MultiAutocomplete
      items={autocompleteItems}
      defaultValue={initial}
      label={label}
      placeholder={placeholder}
      onValueChange={(values) =>
        mount.dispatchEvent(
          new CustomEvent("ca-autocomplete:change", { detail: { values }, bubbles: true }),
        )
      }
    />,
  );
});

const drawerPlacements: DrawerPlacement[] = ["bottom", "top", "left", "right"];

document.querySelectorAll<HTMLElement>("[data-ca-drawer]").forEach((mount) => {
  const { placements } = mount.dataset;
  const list = placements
    ?.split(",")
    .map((part) => part.trim())
    .filter((part): part is DrawerPlacement => drawerPlacements.includes(part as DrawerPlacement));

  createRoot(mount).render(
    <DrawerPlacements
      placements={list?.length ? list : undefined}
      onOpenChange={(placement, open) =>
        mount.dispatchEvent(
          new CustomEvent("ca-drawer:open-change", { detail: { placement, open }, bubbles: true }),
        )
      }
      onAction={(placement, action) =>
        mount.dispatchEvent(
          new CustomEvent("ca-drawer:action", { detail: { placement, action }, bubbles: true }),
        )
      }
    />,
  );
});

document.querySelectorAll<HTMLElement>("[data-ca-onboarding]").forEach((mount) => {
  const { defaultStep, brandName, workspaceHost } = mount.dataset;
  const emit = (name: string, detail: object) =>
    mount.dispatchEvent(new CustomEvent(`ca-onboarding:${name}`, { detail, bubbles: true }));

  createRoot(mount).render(
    <Onboarding
      defaultStep={numberAttr(defaultStep)}
      brandName={brandName || undefined}
      workspaceHost={workspaceHost || undefined}
      onStepChange={(step, id) => emit("step-change", { step, id })}
      onComplete={(data) => emit("complete", { data })}
      onOpenWorkspace={(data) => emit("open", { data })}
    />,
  );
});

document.querySelectorAll<HTMLElement>("[data-ca-cta]").forEach((mount) => {
  const { imageSrc, primaryHref, secondaryHref } = mount.dataset;

  createRoot(mount).render(
    <CtaBanner
      titleStart="اپلیکیشن‌های مدرن را"
      titleHighlight="سریع‌تر"
      titleEnd="با بلوک‌های آماده بسازید"
      description="کامپوننت‌ها و قالب‌های آمادهٔ تولید را نصب کنید و سپس آن‌ها را برای محصول خودتان سفارشی کنید."
      primaryAction={{ label: "شروع ساخت", href: primaryHref }}
      secondaryAction={{ label: "مطالعهٔ مستندات", href: secondaryHref }}
      proofItems={["یکپارچه‌سازی زنده", "آماده برای عامل‌ها", "استانداردهای باز"]}
      imageSrc={imageSrc}
      onAction={(action) =>
        mount.dispatchEvent(
          new CustomEvent("ca-cta:action", { detail: { action }, bubbles: true }),
        )
      }
    />,
  );
});
