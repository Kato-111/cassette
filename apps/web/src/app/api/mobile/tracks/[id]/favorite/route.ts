import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/queries";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = async (request: Request, context: Context) => {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { isFavorite?: unknown }
    | null;
  const current = await prisma.track.findUnique({
    where: { id },
    select: { isFavorite: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const isFavorite =
    typeof body?.isFavorite === "boolean"
      ? body.isFavorite
      : !current.isFavorite;
  await prisma.track.update({ where: { id }, data: { isFavorite } });
  revalidateTag(CACHE_TAGS.tracks, "max");
  revalidateTag(CACHE_TAGS.favorites, "max");
  revalidatePath("/", "layout");
  revalidatePath("/favorites");
  return NextResponse.json({ isFavorite });
};
