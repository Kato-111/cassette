import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/queries";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; trackId: string }> };

export const DELETE = async (_request: Request, context: Context) => {
  const { id: playlistId, trackId } = await context.params;
  await prisma.playlistTrack.deleteMany({ where: { playlistId, trackId } });
  revalidateTag(CACHE_TAGS.playlists, "max");
  revalidatePath(`/playlist/${playlistId}`);
  return new Response(null, { status: 204 });
};
