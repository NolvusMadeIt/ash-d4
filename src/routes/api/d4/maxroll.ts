import { readFile } from "node:fs/promises";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/d4/maxroll")({
  server: {
    handlers: {
      GET: async () => {
        const raw = await readFile("public/data/d4/maxroll-catalog.json", "utf8");
        return new Response(raw, {
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      },
    },
  },
});
