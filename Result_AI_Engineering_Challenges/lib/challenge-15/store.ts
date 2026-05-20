import type { Tenant, TenantPlan, ConfigValue, ConfigVersion } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var _ch15Store: Ch15Store | undefined;
}

class Ch15Store {
  tenants = new Map<string, Tenant>();
  versions = new Map<string, ConfigVersion[]>(); // keyed by tenantId
}

export const store: Ch15Store = (global._ch15Store ??= new Ch15Store());

export function createTenant(input: {
  name: string;
  plan: TenantPlan;
  environment?: "sandbox" | "production";
}): Tenant {
  const id = `TEN-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const tenant: Tenant = {
    id,
    name: input.name,
    plan: input.plan,
    environment: input.environment ?? "sandbox",
    configOverrides: {},
    flagOverrides: {},
    createdAt: now,
    updatedAt: now,
  };
  store.tenants.set(id, tenant);
  store.versions.set(id, []);
  return tenant;
}

export function updateTenantConfig(
  id: string,
  configOverrides: Record<string, ConfigValue>,
  flagOverrides: Record<string, boolean>,
  changedBy: string,
  description: string,
): Tenant {
  const tenant = store.tenants.get(id);
  if (!tenant) throw new Error(`Tenant ${id} not found`);

  const existingVersions = store.versions.get(id) ?? [];
  const version = existingVersions.length + 1;

  const snapshot: ConfigVersion = {
    id: `VER-${id}-${version}`,
    tenantId: id,
    version,
    configOverrides: { ...configOverrides },
    flagOverrides: { ...flagOverrides },
    createdAt: new Date().toISOString(),
    changedBy,
    description,
  };

  store.versions.set(id, [...existingVersions, snapshot]);

  const updated: Tenant = {
    ...tenant,
    configOverrides,
    flagOverrides,
    updatedAt: new Date().toISOString(),
  };
  store.tenants.set(id, updated);
  return updated;
}
