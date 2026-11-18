import { TRACKS } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const track = TRACKS.find((item) => item.id === id);
  if (!track?.canDownload || !track.audioUrl.startsWith("https://archive.org/download/")) {
    return new Response("This recording is not cleared for download.", { status: 403 });
  }
  const upstream = await fetch(track.audioUrl, { headers: { "User-Agent": "MusiqiWorld/1.0" } });
  if (!upstream.ok || !upstream.body) {
    return new Response("The licensed file could not be saved.", { status: 502 });
  }
  const type = upstream.headers.get("content-type") ?? "";
  if (type.startsWith("text/")) {
    return new Response("The licensed file could not be saved.", { status: 502 });
  }
  const cleaned = `${track.title}.mp3`.replace(/[^\w.\- ()]+/g, "").trim();
  const filename = cleaned.length > 4 ? cleaned : `${track.id}.mp3`;
  return new Response(upstream.body, {
    headers: {
      "Content-Type": type || "audio/mpeg",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
