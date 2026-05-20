export type TenantPlan = "basic" | "standard" | "enterprise";
export type ConfigValue = string | number | boolean;
export type ConfigSource = "global" | "plan" | "tenant";

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  environment: "sandbox" | "production";
  configOverrides: Record<string, ConfigValue>;
  flagOverrides: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedConfigEntry {
  key: string;
  value: ConfigValue;
  source: ConfigSource;
}

export interface EvaluatedFlag {
  key: string;
  enabled: boolean;
  source: ConfigSource;
}

export interface ConfigVersion {
  id: string;
  tenantId: string;
  version: number;
  configOverrides: Record<string, ConfigValue>;
  flagOverrides: Record<string, boolean>;
  createdAt: string;
  changedBy: string;
  description: string;
}

export interface ConfigDiff {
  key: string;
  from: ConfigValue | boolean | undefined;
  to: ConfigValue | boolean | undefined;
  type: "added" | "changed" | "removed";
}

export interface GlobalDefaults {
  config: Record<string, ConfigValue>;
  featureFlags: Record<string, boolean>;
  planOverrides: Record<TenantPlan, {
    config?: Record<string, ConfigValue>;
    featureFlags?: Record<string, boolean>;
  }>;
}
