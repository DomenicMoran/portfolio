import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Invalidates one personalised brief after the local lead CLI has upserted it. */
export async function POST(request: Request) {
  const expectedSecret = process.env.REVALIDATE_SECRET;
  const suppliedSecret = request.headers.get("x-revalidate-secret");

  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "A valid slug is required." }, { status: 400 });
  }

  revalidateTag(`targeted-company:${slug}`, "max");
  revalidatePath(`/for/${slug}`);
  revalidatePath(`/for/${slug}/opengraph-image`);

  return NextResponse.json({ revalidated: true, slug });
}
