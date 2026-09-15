import { createFileRoute } from "@tanstack/react-router";
import { generateGroundDrops, seedFromFilter } from "@/lib/d4/drops";
import { matchItem } from "@/lib/d4/evaluate";
import type { LootFilter } from "@/lib/d4/types";

export const Route = createFileRoute("/api/d4/evaluate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { filter?: LootFilter; seed?: number; count?: number };
        try {
          body = (await request.json()) as { filter?: LootFilter; seed?: number; count?: number };
        } catch {
          return Response.json({ error: "Expected JSON body" }, { status: 400 });
        }
        const filter = body.filter;
        if (!filter || !Array.isArray(filter.rules)) {
          return Response.json({ error: "Missing filter.rules" }, { status: 400 });
        }
        const seed = body.seed ?? seedFromFilter(filter.id || "f", filter.scatterSeed || 1);
        const drops = generateGroundDrops(seed, body.count ?? 16);
        const rows = drops.map((item) => ({ item, match: matchItem(filter, item) }));
        return Response.json({
          seed,
          visible: rows.filter((r) => r.match.visibility !== "hideAll"),
          hidden: rows.filter((r) => r.match.visibility === "hideAll").map((r) => r.item.name),
        });
      },
    },
  },
});
