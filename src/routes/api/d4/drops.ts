import { createFileRoute } from "@tanstack/react-router";
import { generateGroundDrops } from "@/lib/d4/drops";

export const Route = createFileRoute("/api/d4/drops")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const seed = Number(url.searchParams.get("seed") || Date.now());
        const count = Number(url.searchParams.get("count") || 16);
        const drops = generateGroundDrops(seed, count);
        return Response.json({ seed, count: drops.length, drops });
      },
    },
  },
});
