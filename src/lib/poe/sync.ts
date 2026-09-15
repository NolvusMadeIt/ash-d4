import { createServerFn } from "@tanstack/react-start";
import type { ScoutCatalog } from "./catalog";
import type { NeverSinkId } from "./neversink";

export type SourceSnapshot = {
  catalog: ScoutCatalog;
  baseIcons: Record<string, string>;
  league: string;
  checkedAt: number;
  itemCount: number;
  baseCount: number;
};

export const refreshSources = createServerFn({ method: "GET" }).handler(
  async (): Promise<SourceSnapshot> => {
    const { refreshAll } = await import("./sources.server");
    return refreshAll();
  },
);

export const loadNeverSinkFilter = createServerFn({ method: "GET" })
  .validator((id: NeverSinkId) => id)
  .handler(async ({ data }) => {
    const { loadNeverSinkFilter: load } = await import("./sources.server");
    return load(data);
  });