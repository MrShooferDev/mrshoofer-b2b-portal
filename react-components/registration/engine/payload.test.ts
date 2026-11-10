// Run: node --experimental-strip-types --test registration/engine/payload.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { isValidIranNationalCode, normalizeIranMobile, toEnglishDigits, isValidIranMobile } from "./digits.ts";
import { evaluateCondition } from "./conditions.ts";
import { applyValueChange, cleanupValues } from "./cleanup.ts";
import { buildRegistrationPayload } from "./payload.ts";
import { validateStep } from "./validation.ts";
import { registrationConfig } from "./config.ts";

test("digits & mobile", () => {
  assert.equal(toEnglishDigits("۰۹۱۲۱۲۳۴۵۶۷"), "09121234567");
  assert.equal(normalizeIranMobile("۰۹۱۲۱۲۳۴۵۶۷"), "+989121234567");
  assert.equal(normalizeIranMobile("9121234567"), "+989121234567");
  assert.equal(normalizeIranMobile("+98 912 123 4567"), "+989121234567");
  assert.equal(normalizeIranMobile("00989121234567"), "+989121234567");
  assert.equal(normalizeIranMobile("02112345678"), null);
  assert.equal(isValidIranMobile("0912"), false);
});

test("national code checksum", () => {
  assert.equal(isValidIranNationalCode("0499370899"), true);
  assert.equal(isValidIranNationalCode("۰۴۹۹۳۷۰۸۹۹"), true);
  assert.equal(isValidIranNationalCode("0499370898"), false);
  assert.equal(isValidIranNationalCode("1111111111"), false);
  assert.equal(isValidIranNationalCode("123"), false);
});

test("conditions", () => {
  const v = { a: "x", list: ["p", "q"], empty: "" };
  assert.equal(evaluateCondition({ equals: { field: "a", value: "x" } }, v), true);
  assert.equal(evaluateCondition({ notEquals: { field: "a", value: "x" } }, v), false);
  assert.equal(evaluateCondition({ isSet: { field: "empty" } }, v), false);
  assert.equal(evaluateCondition({ isEmpty: { field: "empty" } }, v), true);
  assert.equal(evaluateCondition({ contains: { field: "list", value: "q" } }, v), true);
  assert.equal(
    evaluateCondition({ all: [{ equals: { field: "a", value: "x" } }, { contains: { field: "list", value: "z" } }] }, v),
    false,
  );
});

test("exclusive not_sure and hidden cleanup", () => {
  let v = applyValueChange({}, "preferences.services", ["intercity_taxi", "not_sure"]);
  assert.deepEqual(v["preferences.services"], ["not_sure"]);
  v = applyValueChange(v, "preferences.services", ["not_sure", "private_car"]);
  assert.deepEqual(v["preferences.services"], ["private_car"]);

  let w = applyValueChange({}, "business.type", "travel_agency");
  w = applyValueChange(w, "business.displayName", "آژانس نمونه");
  w = applyValueChange(w, "identity.legalForm", "legal_entity");
  assert.equal(w["identity.legalName"], "آژانس نمونه"); // copyValue onlyIfEmpty
  w = applyValueChange(w, "identity.companyCity", "تهران");
  w = applyValueChange(w, "identity.activityAreas", ["ticket_sales", "other"]);
  w = applyValueChange(w, "identity.legalForm", "individual");
  assert.equal("identity.legalName" in w, false);
  assert.equal("identity.companyCity" in w, false);
  assert.equal("identity.activityAreas" in w, false);
});

test("payload excludes hidden branches", () => {
  const values = cleanupValues({
    "contact.firstName": " علی ",
    "contact.lastName": "رضایی",
    "contact.mobile": "۰۹۱۲۱۲۳۴۵۶۷",
    "business.type": "independent_seller",
    "business.typeOther": "stale",
    "business.displayName": "",
    "business.hasWebsite": "no",
    "business.websiteOrSocial": "stale.example.com",
    "identity.legalForm": "individual",
    "identity.nationalCode": "۰۴۹۹۳۷۰۸۹۹",
    "identity.residenceCity": "تهران",
    "identity.legalName": "stale",
    "identity.activityAreas": ["other"],
    "preferences.services": ["intercity_taxi"],
    "consent.termsAccepted": true,
    "consent.privacyAccepted": true,
  });
  const p = buildRegistrationPayload(values, { mobileVerified: true, schemaVersion: "1.0.0" });
  assert.equal(p.contact.firstName, "علی");
  assert.equal(p.contact.mobileE164, "+989121234567");
  assert.equal(p.contact.mobileVerified, true);
  assert.equal(p.contact.email, null);
  assert.equal(p.business.typeOther, null);
  assert.equal(p.business.displayName, null);
  assert.equal(p.business.websiteOrSocial, null);
  assert.equal(p.identity.nationalCode, "0499370899");
  assert.equal(p.identity.legalName, null);
  assert.deepEqual(p.identity.activityAreas, []);
  assert.deepEqual(p.preferences.services, ["intercity_taxi"]);
  assert.equal(p.metadata.schemaVersion, "1.0.0");
});

test("validation: Persian errors, verification gate", () => {
  const step = registrationConfig.steps[0];
  const e = validateStep(step, { "contact.mobile": "0912" }, { mobileVerified: false });
  assert.ok(e["contact.firstName"]);
  assert.equal(e["contact.mobile"], "شماره موبایل معتبر نیست.");
  const ok = {
    "access.panel": "agency",
    "contact.firstName": "علی",
    "contact.lastName": "رضایی",
    "contact.mobile": "09121234567",
  };
  assert.equal(validateStep(step, ok, { mobileVerified: false })["contact.mobile"], "شماره موبایل هنوز تأیید نشده است.");
  assert.deepEqual(validateStep(step, ok, { mobileVerified: true }), {});
});
