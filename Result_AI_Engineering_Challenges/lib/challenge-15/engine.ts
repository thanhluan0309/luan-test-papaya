import DEFAULTS from "./defaults.json";
import type {
  Tenant,
  ResolvedConfigEntry,
  EvaluatedFlag,
  ConfigVersion,
  ConfigDiff,
  GlobalDefaults,
  ConfigValue,
} from "./types";

export const defaults: GlobalDefaults = DEFAULTS as GlobalDefaults;

// ── Config resolution ─────────────────────────────────────────────────────────
// Resolution order: tenant override > plan override > global default

export function resolveConfig(
  tenant: Tenant,
  d: GlobalDefaults = defaults,
): ResolvedConfigEntry[] {
  const globalCfg = d.config;
  const planCfg = d.planOverrides[tenant.plan]?.config ?? {};
  const tenantCfg = tenant.configOverrides;

  const allKeys = new Set([
    ...Object.keys(globalCfg),
    ...Object.keys(planCfg),
    ...Object.keys(tenantCfg),
  ]);

  const result: ResolvedConfigEntry[] = [];
  for (const key of allKeys) {
    if (key in tenantCfg) {
      result.push({ key, value: tenantCfg[key], source: "tenant" });
    } else if (key in planCfg) {
      result.push({ key, value: planCfg[key]!, source: "plan" });
    } else {
      result.push({ key, value: globalCfg[key], source: "global" });
    }
  }

  return result.sort((a, b) => a.key.localeCompare(b.key));
}

// ── Feature flag evaluation ───────────────────────────────────────────────────

export function evaluateFlags(
  tenant: Tenant,
  d: GlobalDefaults = defaults,
): EvaluatedFlag[] {
  const globalFlags = d.featureFlags;
  const planFlags = d.planOverrides[tenant.plan]?.featureFlags ?? {};
  const tenantFlags = tenant.flagOverrides;

  const allKeys = new Set([
    ...Object.keys(globalFlags),
    ...Object.keys(planFlags),
    ...Object.keys(tenantFlags),
  ]);

  const result: EvaluatedFlag[] = [];
  for (const key of allKeys) {
    if (key in tenantFlags) {
      result.push({ key, enabled: tenantFlags[key], source: "tenant" });
    } else if (key in planFlags) {
      result.push({ key, enabled: planFlags[key]!, source: "plan" });
    } else {
      result.push({ key, enabled: globalFlags[key] ?? false, source: "global" });
    }
  }

  return result.sort((a, b) => a.key.localeCompare(b.key));
}

// ── Config diff ───────────────────────────────────────────────────────────────
// Compares two ConfigVersion snapshots across both configOverrides and flagOverrides
// flag keys are prefixed with "flag:" to namespace them

export function getConfigDiff(a: ConfigVersion, b: ConfigVersion): ConfigDiff[] {
  const diffs: ConfigDiff[] = [];

  const flatA: Record<string, ConfigValue | boolean> = {
    ...a.configOverrides,
    ...Object.fromEntries(Object.entries(a.flagOverrides).map(([k, v]) => [`flag:${k}`, v])),
  };
  const flatB: Record<string, ConfigValue | boolean> = {
    ...b.configOverrides,
    ...Object.fromEntries(Object.entries(b.flagOverrides).map(([k, v]) => [`flag:${k}`, v])),
  };

  const allKeys = new Set([...Object.keys(flatA), ...Object.keys(flatB)]);

  for (const key of allKeys) {
    const fromVal = flatA[key];
    const toVal = flatB[key];

    if (fromVal === undefined && toVal !== undefined) {
      diffs.push({ key, from: undefined, to: toVal, type: "added" });
    } else if (fromVal !== undefined && toVal === undefined) {
      diffs.push({ key, from: fromVal, to: undefined, type: "removed" });
    } else if (fromVal !== toVal) {
      diffs.push({ key, from: fromVal, to: toVal, type: "changed" });
    }
  }

  return diffs.sort((a, b) => a.key.localeCompare(b.key));
}
