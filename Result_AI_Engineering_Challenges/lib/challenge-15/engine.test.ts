import { describe, it, expect } from "vitest";
import { resolveConfig, evaluateFlags, getConfigDiff, defaults } from "./engine";
import type { Tenant, ConfigVersion } from "./types";

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  const now = new Date().toISOString();
  return {
    id: "TEN-TEST",
    name: "Test Tenant",
    plan: "basic",
    environment: "sandbox",
    configOverrides: {},
    flagOverrides: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeVersion(
  tenantId: string,
  version: number,
  configOverrides: Record<string, unknown> = {},
  flagOverrides: Record<string, boolean> = {},
): ConfigVersion {
  return {
    id: `VER-${tenantId}-${version}`,
    tenantId,
    version,
    configOverrides: configOverrides as Record<string, string | number | boolean>,
    flagOverrides,
    createdAt: new Date().toISOString(),
    changedBy: "admin",
    description: `Version ${version}`,
  };
}

// ── Scenario 1: Basic tenant resolves from global + plan ──────────────────────

describe("Scenario 1: Basic tenant config resolution", () => {
  it("returns all global config keys for a basic tenant with no overrides", () => {
    const tenant = makeTenant({ plan: "basic" });
    const resolved = resolveConfig(tenant);

    const keys = resolved.map((e) => e.key);
    expect(keys).toContain("currency");
    expect(keys).toContain("data_retention_days");
    expect(keys).toContain("claim_review_sla_days");
  });

  it("basic plan overrides global max_claim_amount", () => {
    const tenant = makeTenant({ plan: "basic" });
    const resolved = resolveConfig(tenant);
    const entry = resolved.find((e) => e.key === "max_claim_amount")!;
    expect(entry.value).toBe(50000);
    expect(entry.source).toBe("plan");
  });

  it("global value used when plan doesn't override it", () => {
    const tenant = makeTenant({ plan: "basic" });
    const resolved = resolveConfig(tenant);
    const entry = resolved.find((e) => e.key === "currency")!;
    expect(entry.value).toBe("THB");
    expect(entry.source).toBe("global");
  });
});

// ── Scenario 2: Standard tenant gets plan-granted flags ───────────────────────

describe("Scenario 2: Standard tenant feature flags", () => {
  it("api_access enabled by standard plan", () => {
    const tenant = makeTenant({ plan: "standard" });
    const flags = evaluateFlags(tenant);
    const flag = flags.find((f) => f.key === "api_access")!;
    expect(flag.enabled).toBe(true);
    expect(flag.source).toBe("plan");
  });

  it("bulk_claim_upload enabled by standard plan", () => {
    const tenant = makeTenant({ plan: "standard" });
    const flags = evaluateFlags(tenant);
    const flag = flags.find((f) => f.key === "bulk_claim_upload")!;
    expect(flag.enabled).toBe(true);
    expect(flag.source).toBe("plan");
  });

  it("ai_fraud_detection disabled for standard plan", () => {
    const tenant = makeTenant({ plan: "standard" });
    const flags = evaluateFlags(tenant);
    const flag = flags.find((f) => f.key === "ai_fraud_detection")!;
    expect(flag.enabled).toBe(false);
    expect(flag.source).toBe("global");
  });
});

// ── Scenario 3: Enterprise tenant gets all flags ──────────────────────────────

describe("Scenario 3: Enterprise tenant gets all feature flags", () => {
  const enterpriseFlags = [
    "api_access", "bulk_claim_upload", "ai_fraud_detection",
    "real_time_notifications", "multi_currency_support",
    "advanced_analytics", "document_ocr", "custom_workflows",
  ];

  for (const flagKey of enterpriseFlags) {
    it(`${flagKey} enabled for enterprise`, () => {
      const tenant = makeTenant({ plan: "enterprise" });
      const flags = evaluateFlags(tenant);
      const flag = flags.find((f) => f.key === flagKey)!;
      expect(flag.enabled).toBe(true);
      expect(flag.source).toBe("plan");
    });
  }

  it("enterprise gets highest max_claim_amount", () => {
    const tenant = makeTenant({ plan: "enterprise" });
    const resolved = resolveConfig(tenant);
    const entry = resolved.find((e) => e.key === "max_claim_amount")!;
    expect(entry.value).toBe(5000000);
    expect(entry.source).toBe("plan");
  });
});

// ── Scenario 4: Tenant override wins over plan ────────────────────────────────

describe("Scenario 4: Tenant-level override takes priority", () => {
  it("tenant override replaces global currency", () => {
    const tenant = makeTenant({
      plan: "basic",
      configOverrides: { currency: "USD" },
    });
    const resolved = resolveConfig(tenant);
    const entry = resolved.find((e) => e.key === "currency")!;
    expect(entry.value).toBe("USD");
    expect(entry.source).toBe("tenant");
  });

  it("tenant override replaces plan max_claim_amount", () => {
    const tenant = makeTenant({
      plan: "standard",
      configOverrides: { max_claim_amount: 999999 },
    });
    const resolved = resolveConfig(tenant);
    const entry = resolved.find((e) => e.key === "max_claim_amount")!;
    expect(entry.value).toBe(999999);
    expect(entry.source).toBe("tenant");
  });

  it("tenant flag override enables a flag not granted by plan", () => {
    const tenant = makeTenant({
      plan: "basic",
      flagOverrides: { ai_fraud_detection: true },
    });
    const flags = evaluateFlags(tenant);
    const flag = flags.find((f) => f.key === "ai_fraud_detection")!;
    expect(flag.enabled).toBe(true);
    expect(flag.source).toBe("tenant");
  });

  it("tenant flag override disables a plan-granted flag", () => {
    const tenant = makeTenant({
      plan: "enterprise",
      flagOverrides: { custom_workflows: false },
    });
    const flags = evaluateFlags(tenant);
    const flag = flags.find((f) => f.key === "custom_workflows")!;
    expect(flag.enabled).toBe(false);
    expect(flag.source).toBe("tenant");
  });
});

// ── Scenario 5: Version diff ──────────────────────────────────────────────────

describe("Scenario 5: Config diff between versions", () => {
  it("identical versions → empty diff", () => {
    const v1 = makeVersion("T1", 1, { currency: "THB" }, { api_access: true });
    const v2 = makeVersion("T1", 2, { currency: "THB" }, { api_access: true });
    expect(getConfigDiff(v1, v2)).toHaveLength(0);
  });

  it("changed config value → type 'changed'", () => {
    const v1 = makeVersion("T1", 1, { currency: "THB" });
    const v2 = makeVersion("T1", 2, { currency: "USD" });
    const diffs = getConfigDiff(v1, v2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].key).toBe("currency");
    expect(diffs[0].from).toBe("THB");
    expect(diffs[0].to).toBe("USD");
    expect(diffs[0].type).toBe("changed");
  });

  it("added key → type 'added'", () => {
    const v1 = makeVersion("T1", 1, {});
    const v2 = makeVersion("T1", 2, { max_claim_amount: 200000 });
    const diffs = getConfigDiff(v1, v2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe("added");
    expect(diffs[0].from).toBeUndefined();
    expect(diffs[0].to).toBe(200000);
  });

  it("removed key → type 'removed'", () => {
    const v1 = makeVersion("T1", 1, { max_claim_amount: 200000 });
    const v2 = makeVersion("T1", 2, {});
    const diffs = getConfigDiff(v1, v2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe("removed");
    expect(diffs[0].from).toBe(200000);
    expect(diffs[0].to).toBeUndefined();
  });

  it("changed flag → type 'changed' with flag: prefix", () => {
    const v1 = makeVersion("T1", 1, {}, { api_access: false });
    const v2 = makeVersion("T1", 2, {}, { api_access: true });
    const diffs = getConfigDiff(v1, v2);
    const flagDiff = diffs.find((d) => d.key === "flag:api_access")!;
    expect(flagDiff).toBeDefined();
    expect(flagDiff.type).toBe("changed");
    expect(flagDiff.from).toBe(false);
    expect(flagDiff.to).toBe(true);
  });
});

// ── Unit: resolveConfig source accuracy ──────────────────────────────────────

describe("resolveConfig source accuracy", () => {
  it("all entries have a valid source", () => {
    const tenant = makeTenant({ plan: "standard", configOverrides: { currency: "SGD" } });
    const resolved = resolveConfig(tenant);
    for (const entry of resolved) {
      expect(["global", "plan", "tenant"]).toContain(entry.source);
    }
  });

  it("tenant-only key appears in resolved config", () => {
    const tenant = makeTenant({ configOverrides: { custom_sla: 5 } });
    const resolved = resolveConfig(tenant);
    const entry = resolved.find((e) => e.key === "custom_sla")!;
    expect(entry).toBeDefined();
    expect(entry.source).toBe("tenant");
  });
});

// ── Unit: isolation ───────────────────────────────────────────────────────────

describe("Tenant isolation", () => {
  it("tenant A override doesn't affect tenant B resolved config", () => {
    const tenantA = makeTenant({
      id: "TEN-A",
      plan: "basic",
      configOverrides: { currency: "USD" },
    });
    const tenantB = makeTenant({
      id: "TEN-B",
      plan: "basic",
      configOverrides: {},
    });

    const resolvedA = resolveConfig(tenantA);
    const resolvedB = resolveConfig(tenantB);

    const currencyA = resolvedA.find((e) => e.key === "currency")!;
    const currencyB = resolvedB.find((e) => e.key === "currency")!;

    expect(currencyA.value).toBe("USD");
    expect(currencyB.value).toBe("THB");
  });

  it("defaults object is not mutated by resolveConfig calls", () => {
    const original = JSON.stringify(defaults.config);
    const tenant = makeTenant({ configOverrides: { new_key: "value" } });
    resolveConfig(tenant);
    expect(JSON.stringify(defaults.config)).toBe(original);
  });
});
