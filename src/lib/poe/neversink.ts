export const NEVER_SINK_TEMPLATES = [
  { id: "0-SOFT", file: "NeverSink's filter 2 - 0-SOFT.filter", label: "0 Soft" },
  { id: "1-REGULAR", file: "NeverSink's filter 2 - 1-REGULAR.filter", label: "1 Regular" },
  {
    id: "2-SEMI-STRICT",
    file: "NeverSink's filter 2 - 2-SEMI-STRICT.filter",
    label: "2 Semi-strict",
  },
  { id: "3-STRICT", file: "NeverSink's filter 2 - 3-STRICT.filter", label: "3 Strict" },
  {
    id: "4-VERY-STRICT",
    file: "NeverSink's filter 2 - 4-VERY-STRICT.filter",
    label: "4 Very strict",
  },
  {
    id: "5-UBER-STRICT",
    file: "NeverSink's filter 2 - 5-UBER-STRICT.filter",
    label: "5 Uber-strict",
  },
  {
    id: "6-UBER-PLUS-STRICT",
    file: "NeverSink's filter 2 - 6-UBER-PLUS-STRICT.filter",
    label: "6 Uber-plus-strict",
  },
] as const;

export type NeverSinkId = (typeof NEVER_SINK_TEMPLATES)[number]["id"];

export function injectOverride(template: string, cullBlocks: string) {
  const waypoint = "# !! Waypoint c0.start";
  const at = template.indexOf(waypoint);
  if (at >= 0) {
    const nl = template.indexOf("\n", at);
    const cut = nl < 0 ? at + waypoint.length : nl + 1;
    return `${template.slice(0, cut)}\n# --- Cull overrides (global, no AreaLevel) ---\n${cullBlocks}\n${template.slice(cut)}`;
  }
  const firstRule = template.search(/^(Show|Hide)\b/m);
  if (firstRule >= 0) {
    return `${template.slice(0, firstRule)}${cullBlocks}\n\n${template.slice(firstRule)}`;
  }
  return `${cullBlocks}\n\n${template}`;
}
