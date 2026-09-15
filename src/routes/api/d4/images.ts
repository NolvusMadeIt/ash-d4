import { createFileRoute } from "@tanstack/react-router";
import { GROUND_BG, GROUND_BG_ALT, CATHEDRAL_TEX, slotIcon, uniqueIcon } from "@/lib/d4/icons";
import { ALL_ITEM_TYPES, UNIQUES } from "@/lib/d4/catalog";

export const Route = createFileRoute("/api/d4/images")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          ground: {
            sanctuary: GROUND_BG,
            dungeon: GROUND_BG_ALT,
            cathedral: CATHEDRAL_TEX,
          },
          slots: Object.fromEntries(ALL_ITEM_TYPES.map((t) => [t.id, slotIcon(t.id)])),
          uniques: Object.fromEntries(UNIQUES.map((u) => [u.name, uniqueIcon(u.name)])),
          catalog: "/data/d4/maxroll-catalog.json",
          api: "/api/d4/maxroll",
          hotlinked: false,
        });
      },
    },
  },
});
