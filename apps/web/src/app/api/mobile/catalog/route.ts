import { NextResponse } from "next/server";
import { getAllAlbums, getAllPlaylists, getAllTracks } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const [tracks, albums, playlists] = await Promise.all([
      getAllTracks(),
      getAllAlbums(),
      getAllPlaylists(),
    ]);

    return NextResponse.json({ tracks, albums, playlists });
  } catch (error) {
    console.error("Mobile catalog request failed", error);
    return NextResponse.json(
      { error: "Unable to load the music catalog" },
      { status: 500 },
    );
  }
};
