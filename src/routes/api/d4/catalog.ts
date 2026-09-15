import { createFileRoute } from "@tanstack/react-router";
import {
  AFFIXES,
  ALL_ITEM_TYPES,
  ITEM_TYPE_GROUPS,
  TALISMAN_SETS,
  UNIQUES,
} from "@/lib/d4/catalog";
import { GROUND_BG, GROUND_BG_ALT, slotIcon, uniqueIcon } from "@/lib/d4/icons";

export const Route = createFileRoute("/api/d4/catalog")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          source: {
            data: "DiabloTools/d4data + community unique lists (Maxroll, d4builds)",
            art: "Lothrik/diablo4-build-calc Sanctuary stills; local slot/unique tiles",
          },
          images: {
            ground: [GROUND_BG, GROUND_BG_ALT, "/images/d4/ground/cathedral.jpg"],
            slots: `/images/d4/slots/{slot}.svg`,
            uniques: `/images/d4/uniques/{slug}.svg`,
          },
          itemTypes: ITEM_TYPE_GROUPS,
          slots: ALL_ITEM_TYPES.map((t) => ({ ...t, icon: slotIcon(t.id) })),
          affixes: AFFIXES,
          talismanSets: TALISMAN_SETS,
          uniques: UNIQUES.map((u) => ({
            ...u,
            icon: uniqueIcon(u.name),
          })),
        });
      },
    },
  },
});
