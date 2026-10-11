import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  Description,
  FieldError,
  FieldGroup,
  Fieldset,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { CheckboxGroupInterest } from "../../CheckboxGroupInterest/CheckboxGroupInterest";
import "./Onboarding.css";

type StepId = "profile" | "role" | "source" | "workspace" | "goals" | "interests" | "invite";

type Option = { value: string; label: string };

export type OnboardingInvite = { id: string; email: string; role: string };

export type OnboardingData = {
  fullName: string;
  jobTitle: string;
  timezone: string;
  marketingOptIn: boolean;
  role: string;
  source: string;
  otherSource: string;
  workspaceName: string;
  workspaceSlug: string;
  teamSize: string;
  goals: string[];
  interests: string[];
  invites: OnboardingInvite[];
  sendInviteDigest: boolean;
};

export type OnboardingProps = {
  /** Initial step, 1-based. */
  defaultStep?: number;
  defaultValues?: Partial<OnboardingData>;
  brandName?: string;
  /** Host shown before the workspace slug. */
  workspaceHost?: string;
  onStepChange?: (step: number, id: StepId) => void;
  onComplete?: (data: OnboardingData) => void;
  onOpenWorkspace?: (data: OnboardingData) => void;
  className?: string;
};

const steps: { id: StepId; label: string; title: string; description: string }[] = [
  { id: "profile", label: "پروفایل", title: "پروفایل خود را تکمیل کنید", description: "اطلاعاتی را وارد کنید که هم‌تیمی‌هایتان در فضای کاری می‌بینند." },
  { id: "role", label: "نقش", title: "نقش خود را انتخاب کنید", description: "نماهای اولیه بر اساس کار روزانهٔ شما تنظیم می‌شوند." },
  { id: "source", label: "آشنایی", title: "از کجا با ما آشنا شدید؟", description: "بگویید اولین بار کجا با ما آشنا شدید. این مرحله اختیاری است." },
  { id: "workspace", label: "فضای کاری", title: "فضای کاری خود را بسازید", description: "نام فضای مشترکی را که تیمتان ابتدا از آن استفاده می‌کند وارد کنید." },
  { id: "goals", label: "اهداف", title: "اولین اهداف خود را انتخاب کنید", description: "روندهای کاری‌ای را که این فضای کاری باید پشتیبانی کند انتخاب کنید." },
  { id: "interests", label: "علاقه‌مندی", title: "علاقه‌مندی‌های خود را انتخاب کنید", description: "همهٔ موارد مرتبط را برگزینید." },
  { id: "invite", label: "دعوت", title: "هم‌تیمی‌ها را دعوت کنید", description: "افرادی را که باید به این فضای کاری بپیوندند اضافه کنید." },
];

const sources: Option[] = [
  { value: "google", label: "گوگل" },
  { value: "linkedin", label: "لینکدین" },
  { value: "facebook", label: "فیسبوک" },
  { value: "instagram", label: "اینستاگرام" },
  { value: "reddit", label: "ردیت" },
  { value: "x", label: "ایکس" },
  { value: "youtube", label: "یوتیوب" },
  { value: "podcast", label: "پادکست" },
  { value: "newsletter", label: "خبرنامه" },
  { value: "friend", label: "دوست / همکار" },
  { value: "ai", label: "دستیار هوش مصنوعی" },
  { value: "outside", label: "بیلبورد / تبلیغات محیطی" },
  { value: "other", label: "سایر" },
];

const roles: Option[] = [
  { value: "product", label: "مدیر محصول" },
  { value: "engineering", label: "مدیر فنی" },
  { value: "design", label: "طراح" },
  { value: "developer", label: "توسعه‌دهنده" },
  { value: "founder", label: "بنیان‌گذار یا مدیر ارشد" },
  { value: "operations", label: "مدیر عملیات" },
];

const teamSizes: Option[] = [
  { value: "solo", label: "فقط خودم" },
  { value: "small", label: "2-10" },
  { value: "team", label: "11-50" },
  { value: "department", label: "51-200" },
  { value: "midmarket", label: "201-500" },
  { value: "company", label: "501-1,000" },
  { value: "enterprise", label: "1,001-5,000" },
  { value: "global", label: "بیش از 5,000" },
];

const goals: Option[] = [
  { value: "roadmaps", label: "نقشهٔ راه محصول" },
  { value: "sprints", label: "اسپرینت‌های فنی" },
  { value: "projects", label: "پروژه‌های بین‌تیمی" },
  { value: "migration", label: "جایگزینی ابزار فعلی" },
  { value: "explore", label: "فقط بررسی می‌کنم" },
];

const inviteRoles: Option[] = [
  { value: "guest", label: "مهمان" },
  { value: "member", label: "عضو" },
  { value: "admin", label: "مدیر" },
];

const timezones: { group: string; items: Option[] }[] = [
  {
    group: "خاورمیانه",
    items: [
      { value: "Asia/Tehran", label: "(GMT+3:30) تهران" },
      { value: "Asia/Dubai", label: "(GMT+4) دبی" },
      { value: "Europe/Istanbul", label: "(GMT+3) استانبول" },
    ],
  },
  {
    group: "اروپا",
    items: [
      { value: "Europe/London", label: "(GMT+0) لندن" },
      { value: "Europe/Paris", label: "(GMT+1) پاریس" },
      { value: "Europe/Berlin", label: "(GMT+1) برلین" },
    ],
  },
  {
    group: "آسیا و اقیانوسیه",
    items: [
      { value: "Asia/Tokyo", label: "(GMT+9) توکیو" },
      { value: "Asia/Singapore", label: "(GMT+8) سنگاپور" },
      { value: "Australia/Sydney", label: "(GMT+11) سیدنی" },
    ],
  },
];

const initialData: OnboardingData = {
  fullName: "سارا رحیمی",
  jobTitle: "مهندس محصول",
  timezone: "Asia/Tehran",
  marketingOptIn: true,
  role: "developer",
  source: "",
  otherSource: "",
  workspaceName: "شوفر",
  workspaceSlug: "shoofer",
  teamSize: "team",
  goals: ["roadmaps", "sprints"],
  interests: [],
  invites: [
    { id: "invite-1", email: "maryam@shoofer.ir", role: "admin" },
    { id: "invite-2", email: "kian@shoofer.ir", role: "member" },
  ],
  sendInviteDigest: true,
};

const labelOf = (list: Option[], value: string) => list.find((o) => o.value === value)?.label ?? value;

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const icons = {
  arrow: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  circleCheck: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  rocket: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></>,
  user: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" /></>,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  star: <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />,
  send: <><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></>,
  file: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  archive: <><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></>,
  shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  paperclip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
};

function TextSwap({ value, className }: { value: string; className?: string }) {
  return (
    <span key={value} className={`ca-onb__swap${className ? ` ${className}` : ""}`}>
      {value}
    </span>
  );
}

function Logo({ name }: { name: string }) {
  return (
    <span className="ca-onb__logo">
      <span className="ca-onb__logo-mark" aria-hidden="true">
        <svg viewBox="25.668 25.1352 49.6644 50" fill="none">
          <circle cx="70.634" cy="29.8334" r="4.69799" fill="currentColor" />
          <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M25.668 57.0144V29.8332C25.668 27.2386 27.7713 25.1352 30.366 25.1352C32.9606 25.1352 35.0639 27.2386 35.0639 29.8332V57.0144C35.0639 61.833 38.9702 65.7392 43.7888 65.7392H57.2116C62.0302 65.7392 65.9364 61.833 65.9364 57.0144V43.7258C65.9364 41.1312 68.0398 39.0278 70.6344 39.0278C73.229 39.0278 75.3324 41.1312 75.3324 43.7258V57.0144C75.3324 67.0222 67.2194 75.1352 57.2116 75.1352H43.7888C33.7809 75.1352 25.668 67.0222 25.668 57.0144Z" />
        </svg>
      </span>
      <span>{name}</span>
    </span>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  const ratio = Math.min(Math.max(current / total, 0), 1);
  return (
    <div className="ca-onb__progress" role="progressbar" aria-label="پیشرفت مراحل" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}>
      <div className="ca-onb__progress-fill" style={{ transform: `scaleX(${ratio})` }}>
        <span key={current} className="ca-onb__progress-sweep" />
      </div>
    </div>
  );
}

function PhotoField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
  }, [photo]);

  return (
    <div className="ca-onb__photo">
      <span className="ca-onb__avatar">
        {photo ? <img src={photo.url} alt={photo.name} /> : <Icon className="ca-onb__avatar-icon">{icons.user}</Icon>}
      </span>
      <div className="ca-onb__photo-body">
        <div className="ca-onb__photo-actions">
          <button type="button" className="ca-onb__btn ca-onb__btn--outline ca-onb__btn--sm" onClick={() => inputRef.current?.click()}>
            {photo ? "تغییر تصویر" : "بارگذاری تصویر"}
          </button>
          {photo ? (
            <button type="button" className="ca-onb__btn ca-onb__btn--ghost ca-onb__btn--sm" onClick={() => setPhoto(null)}>
              انصراف
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setPhoto({ url: URL.createObjectURL(file), name: file.name });
              event.target.value = "";
            }}
          />
        </div>
        <p className="ca-onb__caption">PNG یا JPG، حداقل 400 × 400 پیکسل و حداکثر 10 مگابایت.</p>
      </div>
    </div>
  );
}

type Update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;

function ProfileStep({ data, set }: { data: OnboardingData; set: Update }) {
  return (
    <Fieldset className="w-full">
      <Fieldset.Legend className="ca-onb__sr">اطلاعات پروفایل</Fieldset.Legend>
      <PhotoField />
      <FieldGroup>
        <TextField
          isRequired
          name="fullName"
          value={data.fullName}
          onChange={(value) => set("fullName", value)}
          validate={(value) => (value.trim().length < 2 ? "نام باید حداقل ۲ نویسه باشد" : null)}
        >
          <Label>نام و نام خانوادگی</Label>
          <Input placeholder="سارا رحیمی" autoComplete="name" />
          <FieldError />
        </TextField>
        <TextField name="jobTitle" value={data.jobTitle} onChange={(value) => set("jobTitle", value)}>
          <Label>عنوان شغلی</Label>
          <Input placeholder="مهندس محصول" autoComplete="organization-title" />
        </TextField>
        <label className="ca-onb__field">
          <span className="ca-onb__label">منطقهٔ زمانی</span>
          <select className="ca-onb__input ca-onb__select" value={data.timezone} onChange={(e) => set("timezone", e.target.value)}>
            {timezones.map((zone) => (
              <optgroup key={zone.group} label={zone.group}>
                {zone.items.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="ca-onb__check-row">
          <input type="checkbox" className="ca-onb__checkbox" checked={data.marketingOptIn} onChange={(e) => set("marketingOptIn", e.target.checked)} />
          <span className="ca-onb__muted">به‌روزرسانی‌های محصول و نکات فضای کاری را برایم بفرست.</span>
        </label>
      </FieldGroup>
    </Fieldset>
  );
}

function RoleStep({ data, set }: { data: OnboardingData; set: Update }) {
  return (
    <fieldset className="ca-onb__fieldset ca-onb__stack-3">
      <legend className="ca-onb__label">یک مورد را انتخاب کنید</legend>
      <div className="ca-onb__items" role="radiogroup" aria-label="نقش خود را انتخاب کنید">
        {roles.map((role) => (
          <label key={role.value} className="ca-onb__item">
            <input type="radio" name="ca-onb-role" className="ca-onb__radio" value={role.value} checked={data.role === role.value} onChange={() => set("role", role.value)} />
            <span className="ca-onb__item-label">{role.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SourceStep({ data, set }: { data: OnboardingData; set: Update }) {
  return (
    <Fieldset className="w-full">
      <Fieldset.Legend className="ca-onb__sr">نحوهٔ آشنایی</Fieldset.Legend>
      <div className="ca-onb__chips" aria-label="از کجا با ما آشنا شدید؟">
        {sources.map((source) => {
          const selected = data.source === source.value;
          return (
            <button key={source.value} type="button" className="ca-onb__btn ca-onb__btn--outline ca-onb__btn--lg ca-onb__chip" aria-pressed={selected} onClick={() => set("source", source.value)}>
              <span>{source.label}</span>
              {selected ? <Icon className="ca-onb__icon">{icons.check}</Icon> : null}
            </button>
          );
        })}
      </div>
      {data.source === "other" ? (
        <FieldGroup>
          <TextField name="otherSource" value={data.otherSource} onChange={(value) => set("otherSource", value)} className="max-w-sm">
            <Label>کجا با ما آشنا شدید؟</Label>
            <Input placeholder="منبع را بنویسید" autoComplete="off" />
          </TextField>
        </FieldGroup>
      ) : null}
    </Fieldset>
  );
}

function WorkspaceStep({ data, set, host }: { data: OnboardingData; set: Update; host: string }) {
  return (
    <Fieldset className="w-full">
      <Fieldset.Legend className="ca-onb__sr">تنظیم فضای کاری</Fieldset.Legend>
      <FieldGroup>
        <TextField
          isRequired
          name="workspaceName"
          value={data.workspaceName}
          onChange={(value) => set("workspaceName", value)}
          validate={(value) => (value.trim().length < 2 ? "نام فضای کاری باید حداقل ۲ نویسه باشد" : null)}
        >
          <Label>نام فضای کاری</Label>
          <Input placeholder="شوفر" autoComplete="organization" />
          <FieldError />
        </TextField>
        <TextField
          isRequired
          name="workspaceSlug"
          value={data.workspaceSlug}
          onChange={(value) => set("workspaceSlug", value)}
          validate={(value) => (value.trim().length < 2 ? "آدرس فضای کاری باید حداقل ۲ نویسه باشد" : null)}
        >
          <Label>آدرس فضای کاری</Label>
          <Input placeholder="shoofer" dir="ltr" autoComplete="off" />
          <Description>
            فضای کاری شما در <bdi>{host}/{data.workspaceSlug.trim() || "workspace"}</bdi> باز می‌شود.
          </Description>
          <FieldError />
        </TextField>
      </FieldGroup>
      <fieldset className="ca-onb__fieldset ca-onb__stack-5">
        <legend className="ca-onb__label ca-onb__legend-gap">چند نفر از این فضای کاری استفاده می‌کنند؟</legend>
        <div className="ca-onb__chips" aria-label="اندازهٔ تیم">
          {teamSizes.map((size) => {
            const selected = data.teamSize === size.value;
            return (
              <button key={size.value} type="button" className="ca-onb__btn ca-onb__btn--outline ca-onb__chip ca-onb__chip--size" aria-pressed={selected} onClick={() => set("teamSize", size.value)}>
                <span>{size.label}</span>
                {selected ? (
                  <span className="ca-onb__chip-badge">
                    <Icon>{icons.check}</Icon>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>
    </Fieldset>
  );
}

function GoalsStep({ data, set }: { data: OnboardingData; set: Update }) {
  const toggle = (value: string, checked: boolean) =>
    set("goals", checked ? (data.goals.includes(value) ? data.goals : [...data.goals, value]) : data.goals.filter((g) => g !== value));

  return (
    <fieldset className="ca-onb__fieldset ca-onb__stack-3">
      <legend className="ca-onb__label">یک یا چند مورد را انتخاب کنید</legend>
      <div className="ca-onb__items">
        {goals.map((goal) => (
          <label key={goal.value} className="ca-onb__item">
            <input type="checkbox" className="ca-onb__checkbox" checked={data.goals.includes(goal.value)} onChange={(e) => toggle(goal.value, e.target.checked)} />
            <span className="ca-onb__item-label">{goal.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function InterestsStep({ data, set }: { data: OnboardingData; set: Update }) {
  return (
    <CheckboxGroupInterest
      name="interests"
      value={data.interests}
      onValueChange={(value) => set("interests", value)}
      showHeading={false}
    />
  );
}

function InviteStep({ data, set }: { data: OnboardingData; set: Update }) {
  const update = (id: string, patch: Partial<OnboardingInvite>) =>
    set("invites", data.invites.map((invite) => (invite.id === id ? { ...invite, ...patch } : invite)));

  return (
    <Fieldset className="w-full">
      <Fieldset.Legend className="ca-onb__sr">دعوت هم‌تیمی‌ها</Fieldset.Legend>
      <FieldGroup>
        {data.invites.map((invite, index) => (
          <div key={invite.id} className="ca-onb__invite-row">
            <TextField
              name={`invite-email-${invite.id}`}
              type="email"
              value={invite.email}
              onChange={(value) => update(invite.id, { email: value })}
            >
              <Label className={index === 0 ? undefined : "ca-onb__sr"}>ایمیل</Label>
              <Input placeholder="teammate@company.com" dir="ltr" autoComplete="email" />
            </TextField>
            <label className="ca-onb__field">
              <span className={index === 0 ? "ca-onb__label" : "ca-onb__sr"}>نقش</span>
              <select className="ca-onb__input ca-onb__select" value={invite.role} onChange={(e) => update(invite.id, { role: e.target.value })} aria-label={`نقش نفر ${index + 1}`}>
                {inviteRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
        <div className="ca-onb__invite-add">
          <button
            type="button"
            className="ca-onb__btn ca-onb__btn--link"
            onClick={() => set("invites", [...data.invites, { id: `invite-${data.invites.length + 1}`, email: "", role: "member" }])}
          >
            <Icon className="ca-onb__icon">{icons.plus}</Icon>
            افزودن نفر دیگر
          </button>
        </div>
      </FieldGroup>
      <div className="ca-onb__switch-row">
        <div className="ca-onb__switch-text">
          <span className="ca-onb__label" id="ca-onb-digest">ارسال خلاصهٔ دعوت</span>
          <span className="ca-onb__caption">شامل جزئیات فضای کاری.</span>
        </div>
        <button
          type="button"
          role="switch"
          className="ca-onb__switch"
          aria-checked={data.sendInviteDigest}
          aria-labelledby="ca-onb-digest"
          onClick={() => set("sendInviteDigest", !data.sendInviteDigest)}
        >
          <span className="ca-onb__switch-thumb" />
        </button>
      </div>
    </Fieldset>
  );
}

function IconStackLayer({ active = false, opacity, x = 0, y = 0 }: { active?: boolean; opacity: string; x?: number; y?: number }) {
  return (
    <g opacity={opacity} transform={`translate(${x} ${y})`}>
      <path className="ca-onb__stack-layer" d="M42.2538 2.046C41.4408 1.6325 40.3965 1.6677 39.2612 2.2424L7.9616 18.1934C5.3895 19.5039 3.301 23.1064 3.301 26.2322V64.3226C3.301 66.0677 3.9458 67.2943 4.962 67.8199L1.8363 66.229C0.8201 65.7104 0.1753 64.4771 0.1753 62.732V24.6412C0.1753 21.5085 2.2638 17.913 4.8359 16.6024L36.1355 0.6515C37.2778 0.0698 38.322 0.0416 39.128 0.4551L42.2538 2.046Z" stroke="currentColor" strokeOpacity={active ? "0.3" : "0.2"} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
      <path className="ca-onb__stack-layer" d="M42.2545 2.0456C43.2707 2.5643 43.9155 3.7979 43.9155 5.543V43.6337C43.9155 46.7665 41.827 50.3616 39.2549 51.6722L7.9554 67.6235C6.813 68.2052 5.7687 68.2331 4.9628 67.8196C3.9465 67.301 3.3018 66.0673 3.3018 64.3222V26.2318C3.3018 23.0991 5.3903 19.5036 7.9624 18.193L39.2619 2.2421C40.4043 1.6604 41.4486 1.6321 42.2545 2.0456Z" stroke="currentColor" strokeOpacity={active ? "0.35" : "0.25"} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function SuccessPanel({ workspaceName, onOpen, onReview }: { workspaceName: string; onOpen: () => void; onReview: () => void }) {
  const name = workspaceName.trim() || "فضای کاری";
  return (
    <div className="ca-onb__success">
      <div className="ca-onb__success-body">
        <div className="ca-onb__success-art" aria-hidden="true">
          <div className="ca-onb__icon-stack">
            <svg viewBox="0 0 72 81" fill="none">
              <ellipse cx="36" cy="76" rx="30" ry="7" fill="currentColor" fillOpacity="0.055" className="ca-onb__stack-shadow" />
              <IconStackLayer opacity="0.4" />
              <IconStackLayer opacity="0.6" x={13.65} y={6.04} />
              <IconStackLayer opacity="0.8" x={27.32} y={12.08} active />
            </svg>
            <span className="ca-onb__icon-stack-content">
              <Icon>{icons.circleCheck}</Icon>
            </span>
          </div>
        </div>
        <div className="ca-onb__success-text">
          <h2 className="ca-onb__title">{name} آماده است</h2>
          <p className="ca-onb__description">فضای کاری شما ساخته شد و برای اولین پروژه آماده است.</p>
        </div>
      </div>
      <div className="ca-onb__actions">
        <button type="button" className="ca-onb__btn ca-onb__btn--primary" onClick={onOpen}>
          ورود به {name}
        </button>
        <button type="button" className="ca-onb__btn ca-onb__btn--ghost" onClick={onReview}>
          بازبینی تنظیمات
        </button>
      </div>
    </div>
  );
}

type PreviewRow = {
  unread?: boolean;
  starred?: boolean;
  paperclip?: boolean;
  time: string;
  badges?: { label: string; tone: string; skeleton?: string }[];
  actions?: boolean;
  attachment?: boolean;
  widths: [string, string, string];
};

const previewRows: PreviewRow[] = [
  { unread: true, starred: true, time: "10:42", widths: ["80px", "208px", "256px"] },
  { unread: true, paperclip: true, time: "9:15", badges: [{ label: "کاری", tone: "purple" }], attachment: true, widths: ["96px", "224px", "240px"] },
  { unread: true, time: "دیروز", badges: [{ label: "تجاری", tone: "amber" }], actions: true, widths: ["96px", "208px", "224px"] },
  { time: "دیروز", badges: [{ label: "", tone: "muted", skeleton: "28px" }, { label: "", tone: "muted", skeleton: "48px" }, { label: "", tone: "muted", skeleton: "28px" }, { label: "", tone: "muted", skeleton: "48px" }], widths: ["80px", "256px", "240px"] },
  { time: "دوشنبه", badges: [{ label: "مالی", tone: "emerald" }], widths: ["64px", "224px", "256px"] },
  { paperclip: true, time: "دوشنبه", badges: [{ label: "#", tone: "outline" }, { label: "1024", tone: "yellow" }], attachment: true, widths: ["96px", "208px", "224px"] },
  { time: "یکشنبه", badges: [{ label: "محیط", tone: "muted" }, { label: "عملیاتی", tone: "emerald" }, { label: "بیلد", tone: "muted" }, { label: "47s", tone: "muted" }], widths: ["72px", "224px", "240px"] },
  { unread: true, starred: true, time: "2 آذر", badges: [{ label: "حقوقی", tone: "blue" }], widths: ["96px", "208px", "224px"] },
];

const navIcons = [icons.inbox, icons.star, icons.send, icons.file, icons.archive, icons.shield, icons.trash];

function Preview({ data, stepKey }: { data: OnboardingData; stepKey: string }) {
  const showWorkspace = ["workspace", "goals", "interests", "invite", "success"].includes(stepKey);
  const isSuccess = stepKey === "success";
  const initial = data.workspaceName.trim().charAt(0).toUpperCase() || "ش";
  const title = showWorkspace ? data.workspaceName.trim() || "فضای کاری" : data.fullName.trim() || "صندوق ورودی";
  const count = isSuccess ? "آماده" : showWorkspace ? labelOf(teamSizes, data.teamSize) : "4";

  return (
    <aside className="ca-onb__preview" aria-label="پیش‌نمایش فضای کاری">
      <div className="ca-onb__preview-stage">
        <div key={stepKey} className="ca-onb__preview-window ca-onb__enter">
          <div className="ca-onb__preview-glow" />
          <div className="ca-onb__preview-frame">
            <div className="ca-onb__preview-grid">
              <nav className="ca-onb__preview-nav">
                <span className="ca-onb__preview-initial">
                  <TextSwap value={initial} />
                </span>
                <div className="ca-onb__preview-nav-icons">
                  {navIcons.map((icon, index) => (
                    <span key={index} className={`ca-onb__preview-nav-icon${index === 0 ? " is-active" : ""}`}>
                      {index === 0 ? <span className="ca-onb__preview-dot" /> : null}
                      <Icon>{icon}</Icon>
                    </span>
                  ))}
                </div>
                <span className="ca-onb__preview-me" aria-hidden="true" />
              </nav>
              <section className="ca-onb__preview-main">
                <div className="ca-onb__preview-bar">
                  <div className="ca-onb__preview-heading">
                    <h3 className="ca-onb__preview-title" aria-live="polite">
                      <TextSwap value={title} className="ca-onb__truncate" />
                    </h3>
                    <span className="ca-onb__preview-count">
                      <TextSwap value={count} className="ca-onb__truncate" />
                    </span>
                  </div>
                  <div className="ca-onb__preview-tools">
                    <Icon>{icons.refresh}</Icon>
                    <Icon>{icons.filter}</Icon>
                  </div>
                </div>
                <div className="ca-onb__preview-search-row">
                  <div className="ca-onb__preview-search">
                    <Icon>{icons.search}</Icon>
                    <span className="ca-onb__sk" style={{ width: 80 }} />
                  </div>
                </div>
                <div className="ca-onb__preview-tabs">
                  <span className="ca-onb__preview-tab is-active">همه</span>
                  {["36px", "40px", "24px"].map((width) => (
                    <span key={width} className="ca-onb__preview-tab">
                      <span className="ca-onb__sk" style={{ width }} />
                      <span className="ca-onb__sk ca-onb__sk--dot" />
                    </span>
                  ))}
                </div>
                <div className="ca-onb__preview-list">
                  <span className="ca-onb__preview-scroll" />
                  {previewRows.map((row, index) => (
                    <div key={index} className={`ca-onb__preview-row${index === 0 ? " is-first" : ""}${index === 0 || row.attachment || row.actions ? " is-tall" : ""}`}>
                      <span className={`ca-onb__preview-unread${row.unread ? " is-on" : ""}`} />
                      <span className="ca-onb__preview-avatar" />
                      <div className="ca-onb__preview-content">
                        <div className="ca-onb__preview-row-head">
                          <span className="ca-onb__sk ca-onb__sk--title" style={{ width: row.widths[0] }} />
                          <span className="ca-onb__preview-meta">
                            {row.starred ? <Icon className="ca-onb__preview-star">{icons.star}</Icon> : null}
                            {row.paperclip ? <Icon>{icons.paperclip}</Icon> : null}
                            <span>{row.time}</span>
                          </span>
                        </div>
                        <span className="ca-onb__sk ca-onb__sk--line" style={{ width: row.widths[1] }} />
                        <span className="ca-onb__sk ca-onb__sk--line ca-onb__sk--tight" style={{ width: row.widths[2] }} />
                        {index === 0 ? (
                          <div className="ca-onb__preview-people">
                            {[0, 1, 2].map((n) => (
                              <span key={n} className="ca-onb__preview-person" />
                            ))}
                            <span className="ca-onb__preview-badge" data-tone="primary">
                              <TextSwap value={labelOf(roles, data.role)} className="ca-onb__truncate" />
                            </span>
                          </div>
                        ) : row.badges || row.actions ? (
                          <div className="ca-onb__preview-badges">
                            {row.badges?.map((badge, i) =>
                              badge.skeleton ? (
                                <span key={i} className="ca-onb__sk ca-onb__sk--badge" style={{ width: badge.skeleton }} />
                              ) : (
                                <span key={i} className="ca-onb__preview-badge" data-tone={badge.tone}>
                                  {badge.label}
                                </span>
                              ),
                            )}
                            {row.actions ? (
                              <>
                                <span className="ca-onb__sk ca-onb__sk--badge" style={{ width: 80 }} />
                                <span className="ca-onb__sk ca-onb__sk--badge" style={{ width: 80 }} />
                              </>
                            ) : null}
                          </div>
                        ) : null}
                        {row.attachment ? (
                          <div className="ca-onb__preview-attachment">
                            <span className="ca-onb__sk ca-onb__sk--file" />
                            <span className="ca-onb__sk ca-onb__sk--file-icon" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="ca-onb__preview-fade-side" />
            <div className="ca-onb__preview-fade-bottom" />
            <div className="ca-onb__preview-ring" />
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Onboarding({
  defaultStep = 1,
  defaultValues,
  brandName = "شوفر",
  workspaceHost = "app.shoofer.ir",
  onStepChange,
  onComplete,
  onOpenWorkspace,
  className,
}: OnboardingProps) {
  const total = steps.length;
  const [step, setStep] = useState(() => Math.min(Math.max(defaultStep, 1), total));
  const [data, setData] = useState<OnboardingData>(() => ({ ...initialData, ...defaultValues }));
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState(1);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const current = steps[step - 1];
  const isLast = step === total;
  const canSkip = step > 1 && step < total;
  const canContinue =
    (current.id !== "goals" || data.goals.length > 0) &&
    (current.id !== "interests" || data.interests.length > 0);
  const stepKey = done ? "success" : current.id;

  const set: Update = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

  const goTo = (target: number) => {
    const next = Math.min(Math.max(target, 1), total);
    setDirection(next >= step ? 1 : -1);
    setDone(false);
    setStep(next);
    onStepChange?.(next, steps[next - 1].id);
  };

  const create = () => {
    if (creating) return;
    setCreating(true);
    setDirection(1);
    timer.current = window.setTimeout(() => {
      setCreating(false);
      setDone(true);
      onComplete?.(data);
    }, 900);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isLast) create();
    else goTo(step + 1);
  };

  return (
    <div className={`ca-onb${className ? ` ${className}` : ""}`} style={{ "--ca-onb-dir": direction } as CSSProperties}>
      <Progress current={done ? total : step} total={total} />

      <header className="ca-onb__header">
        <div className="ca-onb__brand">
          <button type="button" className="ca-onb__btn ca-onb__btn--ghost ca-onb__btn--icon ca-onb__back" onClick={() => goTo(step - 1)} aria-label="بازگشت به مرحلهٔ قبل" hidden={done || step === 1}>
            <Icon>{icons.arrow}</Icon>
          </button>
          <Logo name={brandName} />
        </div>
        {done ? (
          <span className="ca-onb__status">
            <Icon className="ca-onb__status-icon">{icons.circleCheck}</Icon>
            فضای کاری آماده است
          </span>
        ) : (
          <span className="ca-onb__status">
            مرحلهٔ {step} از {total}
          </span>
        )}
      </header>

      <main className="ca-onb__main">
        <div className="ca-onb__card">
          <div className="ca-onb__pane">
            {done ? (
              <div key="success" className="ca-onb__pane-inner ca-onb__enter">
                <SuccessPanel
                  workspaceName={data.workspaceName}
                  onOpen={() => onOpenWorkspace?.(data)}
                  onReview={() => {
                    setDirection(-1);
                    setDone(false);
                    setStep(total);
                    onStepChange?.(total, steps[total - 1].id);
                  }}
                />
              </div>
            ) : (
              <form key={current.id} className="ca-onb__pane-inner ca-onb__form ca-onb__enter" onSubmit={submit} noValidate>
                <div className="ca-onb__form-body">
                  <div className="ca-onb__intro" aria-live="polite">
                    <h2 className="ca-onb__title">{current.title}</h2>
                    <p className="ca-onb__description">{current.description}</p>
                  </div>
                  {current.id === "profile" ? <ProfileStep data={data} set={set} /> : null}
                  {current.id === "role" ? <RoleStep data={data} set={set} /> : null}
                  {current.id === "source" ? <SourceStep data={data} set={set} /> : null}
                  {current.id === "workspace" ? <WorkspaceStep data={data} set={set} host={workspaceHost} /> : null}
                  {current.id === "goals" ? <GoalsStep data={data} set={set} /> : null}
                  {current.id === "interests" ? <InterestsStep data={data} set={set} /> : null}
                  {current.id === "invite" ? <InviteStep data={data} set={set} /> : null}
                </div>
                <div className="ca-onb__actions">
                  <button type="submit" className="ca-onb__btn ca-onb__btn--primary" disabled={!canContinue || creating}>
                    {creating ? <span className="ca-onb__spinner" aria-hidden="true" /> : isLast ? <Icon className="ca-onb__icon">{icons.rocket}</Icon> : null}
                    {isLast ? "ساخت فضای کاری" : "ادامه"}
                  </button>
                  {canSkip ? (
                    <button type="button" className="ca-onb__btn ca-onb__btn--ghost" disabled={creating} onClick={() => goTo(step + 1)}>
                      رد کردن
                    </button>
                  ) : null}
                </div>
              </form>
            )}
          </div>
          <Preview data={data} stepKey={stepKey} />
        </div>
      </main>

      <footer className="ca-onb__footer">
        <span className="ca-onb__caption">© 2026 {brandName}</span>
        <a href="#">حریم خصوصی</a>
        <a href="#">پشتیبانی</a>
        <a href="#">خروج</a>
      </footer>
    </div>
  );
}
