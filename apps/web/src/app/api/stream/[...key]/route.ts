import type { NextRequest } from "next/server";
import { getObject } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (
  req: NextRequest,
  ctx: { params: Promise<{ key: string[] }> },
) => {
  const { key } = await ctx.params;
  const objectKey = key.map(decodeURIComponent).join("/");

  const range = req.headers.get("range") ?? undefined;

  try {
    const obj = await getObject(objectKey, range);

    if (!obj.Body) {
      return new Response("Empty object", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Accept-Ranges", "bytes");
    headers.set(
      "Content-Type",
      obj.ContentType ?? "application/octet-stream",
    );
    if (obj.ContentLength !== undefined) {
      headers.set("Content-Length", obj.ContentLength.toString());
    }
    if (obj.ContentRange) {
      headers.set("Content-Range", obj.ContentRange);
    }
    if (obj.ETag) headers.set("ETag", obj.ETag);
    if (obj.LastModified) {
      headers.set("Last-Modified", obj.LastModified.toUTCString());
    }
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    const stream = obj.Body.transformToWebStream();
    const status = range ? 206 : 200;
    return new Response(stream, { status, headers });
  } catch (err) {
    const e = err as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };
    if (e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) {
      return new Response("Not found", { status: 404 });
    }
    return new Response((err as Error).message, { status: 500 });
  }
};
