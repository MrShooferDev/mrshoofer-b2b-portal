import { registrationConfig, fieldMap } from "./config.ts";
import { isFieldVisible } from "./conditions.ts";
import { normalizeIranMobile, normalizeNationalCode } from "./digits.ts";
import type { FormValues, RegistrationConfig } from "./types.ts";

export type PayloadOptions = {
  mobileVerified: boolean;
  schemaVersion?: string;
  config?: RegistrationConfig;
};

export type RegistrationPayload = {
  contact: {
    firstName: string;
    lastName: string;
    mobileE164: string;
    mobileVerified: boolean;
    email: string | null;
  };
  business: {
    type: string | null;
    typeOther: string | null;
    displayName: string | null;
    websiteOrSocial: string | null;
  };
  identity: {
    legalForm: string | null;
    nationalCode: string | null;
    residenceCity: string | null;
    legalName: string | null;
    registrationNumber: string | null;
    legalNationalId: string | null;
    companyCity: string | null;
    companyAddress: string | null;
    contactRole: string | null;
    contactRoleOther: string | null;
    activityAreas: string[];
    activityAreasOther: string | null;
  };
  preferences: { services: string[] };
  attribution: { source: string | null; sourceOther: string | null };
  consent: { termsAccepted: boolean; privacyAccepted: boolean };
  access: { panel: string | null };
  metadata: { schemaVersion: string };
};

/** Builds the submit payload per config.payloadSchema; hidden fields are excluded. */
export function buildRegistrationPayload(values: FormValues, opts: PayloadOptions): RegistrationPayload {
  const config = opts.config ?? registrationConfig;
  const fields = fieldMap(config);

  const visible = (id: string) => (fields[id] ? isFieldVisible(fields[id], values) : true);

  const str = (id: string, transform?: (s: string) => string): string | null => {
    if (!visible(id)) return null;
    const raw = values[id];
    if (typeof raw !== "string") return null;
    const t = raw.trim();
    if (!t) return null;
    return transform ? transform(t) : t;
  };
  const arr = (id: string): string[] => {
    if (!visible(id)) return [];
    const raw = values[id];
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  };

  return {
    contact: {
      firstName: str("contact.firstName") ?? "",
      lastName: str("contact.lastName") ?? "",
      mobileE164: normalizeIranMobile(values["contact.mobile"]) ?? "",
      mobileVerified: opts.mobileVerified === true,
      email: str("contact.email"),
    },
    access: { panel: str("access.panel") },
    business: {
      type: values["access.panel"] === "organization" ? "organization" : str("business.type"),
      typeOther: str("business.typeOther"),
      displayName: str("business.displayName"),
      websiteOrSocial: str("business.websiteOrSocial"),
    },
    identity: {
      legalForm: str("identity.legalForm"),
      nationalCode: str("identity.nationalCode", normalizeNationalCode),
      residenceCity: str("identity.residenceCity"),
      legalName: str("identity.legalName"),
      registrationNumber: str("identity.registrationNumber"),
      legalNationalId: str("identity.legalNationalId", normalizeNationalCode),
      companyCity: str("identity.companyCity"),
      companyAddress: str("identity.companyAddress"),
      contactRole: str("identity.contactRole"),
      contactRoleOther: str("identity.contactRoleOther"),
      activityAreas: arr("identity.activityAreas"),
      activityAreasOther: str("identity.activityAreasOther"),
    },
    preferences: { services: arr("preferences.services") },
    attribution: {
      source: str("attribution.source"),
      sourceOther: str("attribution.sourceOther"),
    },
    consent: {
      termsAccepted: values["consent.termsAccepted"] === true,
      privacyAccepted: values["consent.privacyAccepted"] === true,
    },
    metadata: { schemaVersion: opts.schemaVersion ?? config.schemaVersion },
  };
}
