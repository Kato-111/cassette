import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/queries";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = async (request: Request, context: Context) => {
  const { id: playlistId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { trackId?: unknown }
    | null;
  const trackId = typeof body?.trackId === "string" ? body.trackId : "";
  if (!trackId) {
    return NextResponse.json({ error: "trackId is required" }, { status: 400 });
  }

  const existing = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId, trackId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Track is already in this playlist" },
      { status: 409 },
    );
  }

  const last = await prisma.playlistTrack.findFirst({
    where: { playlistId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.playlistTrack.create({
    data: { playlistId, trackId, order: (last?.order ?? -1) + 1 },
  });

  revalidateTag(CACHE_TAGS.playlists, "max");
  revalidatePath(`/playlist/${playlistId}`);
  return NextResponse.json({ ok: true }, { status: 201 });
};
