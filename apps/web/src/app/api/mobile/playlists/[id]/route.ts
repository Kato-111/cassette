import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CACHE_TAGS, getPlaylistWithTracks } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const GET = async (_request: Request, context: Context) => {
  const { id } = await context.params;
  const playlist = await getPlaylistWithTracks(id);
  return playlist
    ? NextResponse.json(playlist)
    : NextResponse.json({ error: "Playlist not found" }, { status: 404 });
};

export const PATCH = async (request: Request, context: Context) => {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { name?: unknown }
    | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.update({
    where: { id },
    data: { name },
  });
  revalidateTag(CACHE_TAGS.playlists, "max");
  revalidatePath(`/playlist/${id}`);
  return NextResponse.json(playlist);
};

export const DELETE = async (_request: Request, context: Context) => {
  const { id } = await context.params;
  await prisma.$transaction([
    prisma.playlistTrack.deleteMany({ where: { playlistId: id } }),
    prisma.playlist.delete({ where: { id } }),
  ]);
  revalidateTag(CACHE_TAGS.playlists, "max");
  revalidatePath("/", "layout");
  return new Response(null, { status: 204 });
};
