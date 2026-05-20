import { store } from "@/lib/challenge-15/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!store.tenants.has(id)) {
    return Response.json({ message: `Tenant ${id} not found` }, { status: 404 });
  }
  const versions = store.versions.get(id) ?? [];
  return Response.json([...versions].reverse()); // newest first
}
