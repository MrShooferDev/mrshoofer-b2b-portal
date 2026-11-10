/** Flat form values keyed by dotted field id, e.g. "contact.firstName". */
export type FormValues = Record<string, unknown>;

export type Condition = {
  equals?: { field: string; value: unknown };
  notEquals?: { field: string; value: unknown };
  isSet?: { field: string };
  isEmpty?: { field: string };
  contains?: { field: string; value: unknown };
  all?: Condition[];
  any?: Condition[];
};

export type OptionConfig = {
  value: string;
  label: string;
  description?: string;
  /** Fluent color icon key, used only on the panel choice. */
  icon?: string;
};

export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  trim?: boolean;
  length?: number;
  checksum?: string;
  digitsOnlyIfEntered?: boolean;
  acceptPersianDigits?: boolean;
  [key: string]: unknown;
};

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "urlOrText"
  | "nationalId"
  | "radioCards"
  | "radioCardsOrDropdown"
  | "selectCardsOrDropdown"
  | "multiSelectCards"
  | "multiSelectChips"
  | "cityAutocomplete"
  | "checkbox"
  | "info"
  | (string & {});

export type FieldConfig = {
  id: string;
  type: FieldType;
  label?: string;
  text?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  requiredWhen?: Condition;
  visibleWhen?: Condition;
  autocomplete?: string;
  validation?: FieldValidation;
  options?: OptionConfig[];
  optionsByBusinessType?: Record<string, OptionConfig[]>;
  labelByBusinessType?: Record<string, string>;
  placeholderByBusinessType?: Record<string, string>;
  minSelections?: number;
  maxSelections?: number;
  mutuallyExclusiveValues?: string[];
  defaultValueFrom?: string;
  allowManualEntry?: boolean;
  linkKey?: string;
  layout?: string;
  verification?: { method: string; mustBeVerifiedToContinue?: boolean };
};

export type ActionConfig = {
  label: string;
  nextStep?: string;
  previousStep?: string;
  action?: string;
};

export type SummarySection = {
  id: string;
  title: string;
  fields: string[];
  editStep: string;
};

export type StepConfig = {
  id: string;
  stepNumber: number;
  title: string;
  description?: string;
  progressLabel: string;
  fields: FieldConfig[];
  summary?: { enabled: boolean; sections: SummarySection[] };
  primaryAction: ActionConfig;
  backAction: ActionConfig | null;
};

export type RegistrationConfig = {
  schemaVersion: string;
  flowId: string;
  title: string;
  steps: StepConfig[];
  [key: string]: unknown;
};

export type FieldErrors = Record<string, string>;

export const BUSINESS_TYPE_FIELD = "business.type";
