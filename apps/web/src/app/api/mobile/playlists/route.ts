import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CACHE_TAGS, getAllPlaylists } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async () => NextResponse.json(await getAllPlaylists());

export const POST = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as
    | { name?: unknown }
    | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.create({ data: { name } });
  revalidateTag(CACHE_TAGS.playlists, "max");
  revalidatePath("/", "layout");
  return NextResponse.json(playlist, { status: 201 });
};
