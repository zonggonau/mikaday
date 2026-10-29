import { db } from "@/lib/db";

/** Serves images uploaded in the admin panel. IDs never change, so responses are cached for a year. */
export async function GET(_request: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response("Not found", { status: 404 });

  const media = await db.media.findUnique({ where: { id }, select: { data: true, mimeType: true } });
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
