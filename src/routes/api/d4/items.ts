import { createFileRoute } from "@tanstack/react-router";
import { ALL_ITEM_TYPES, UNIQUES, typeLabel } from "@/lib/d4/catalog";
import { slotIcon, uniqueIcon } from "@/lib/d4/icons";

export const Route = createFileRoute("/api/d4/items")({
  server: {
    handlers: {
      GET: async () => {
        const uniques = UNIQUES.map((u) => ({
          id: u.name,
          name: u.name,
          slot: u.slot,
          base: typeLabel(u.slot),
          rarity: u.mythic ? "mythic" : "unique",
          mythic: u.mythic,
          icon: uniqueIcon(u.name),
        }));
        const bases = ALL_ITEM_TYPES.map((t) => ({
          id: t.id,
          name: t.label,
          slot: t.id,
          base: t.label,
          rarity: "legendary",
          mythic: false,
          icon: slotIcon(t.id),
        }));
        return Response.json({ items: [...uniques, ...bases], count: uniques.length + bases.length });
      },
    },
  },
});
