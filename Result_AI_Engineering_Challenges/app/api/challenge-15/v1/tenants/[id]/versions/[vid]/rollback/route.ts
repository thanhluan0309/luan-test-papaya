import { store, updateTenantConfig } from "@/lib/challenge-15/store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; vid: string }> },
) {
  const { id, vid } = await params;
  const tenant = store.tenants.get(id);
  if (!tenant) {
    return Response.json({ message: `Tenant ${id} not found` }, { status: 404 });
  }

  const versions = store.versions.get(id) ?? [];
  const target = versions.find((v) => v.id === vid || String(v.version) === vid);
  if (!target) {
    return Response.json({ message: `Version ${vid} not found for tenant ${id}` }, { status: 404 });
  }

  const updated = updateTenantConfig(
    id,
    { ...target.configOverrides },
    { ...target.flagOverrides },
    "system",
    `Rollback to version ${target.version}`,
  );

  return Response.json({ tenant: updated, rolledBackTo: target.version });
}
