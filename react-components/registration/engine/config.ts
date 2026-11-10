import rawConfig from "../mrshoofer_b2b_onboarding_config_v2.json" with { type: "json" };
import type { FieldConfig, RegistrationConfig, StepConfig } from "./types.ts";

export const registrationConfig = rawConfig as unknown as RegistrationConfig;

export function allFields(config: RegistrationConfig = registrationConfig): FieldConfig[] {
  return config.steps.flatMap((s) => s.fields);
}

export function fieldMap(config: RegistrationConfig = registrationConfig): Record<string, FieldConfig> {
  const map: Record<string, FieldConfig> = {};
  for (const f of allFields(config)) map[f.id] = f;
  return map;
}

export function stepById(id: string, config: RegistrationConfig = registrationConfig): StepConfig | undefined {
  return config.steps.find((s) => s.id === id);
}
