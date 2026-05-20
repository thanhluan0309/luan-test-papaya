import { store } from "@/lib/challenge-15/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tenant = store.tenants.get(id);
  if (!tenant) {
    return Response.json({ message: `Tenant ${id} not found` }, { status: 404 });
  }
  return Response.json(tenant);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!store.tenants.has(id)) {
    return Response.json({ message: `Tenant ${id} not found` }, { status: 404 });
  }
  store.tenants.delete(id);
  store.versions.delete(id);
  return new Response(null, { status: 204 });
}
