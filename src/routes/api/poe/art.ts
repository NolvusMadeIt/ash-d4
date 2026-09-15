import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/poe/art")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { fetchArt } = await import("@/lib/poe/sources.server");
        const url = new URL(request.url);
        const dds = url.searchParams.get("dds");
        const unique = url.searchParams.get("u");
        const art = await fetchArt({ dds, unique });
        if (!art) return new Response("Not found", { status: 404 });
        return new Response(Buffer.from(art.body), {
          headers: {
            "Content-Type": art.type.startsWith("image/") ? art.type : "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});