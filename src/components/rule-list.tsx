import { Download, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { buildFilterFile } from "@/lib/poe/filter";
import { decodeHtmlEntities } from "@/lib/poe/decode";
import { affixSummary, defenceSummary } from "@/lib/poe/mods";
import { useCull } from "@/lib/store";
import { cn } from "@/lib/utils";

export function RuleList() {
  const { rules, importedName, templateId, removeRule, setImported, ingestText } =
    useCull();
  const fileRef = useRef<HTMLInputElement>(null);

  function exportFilter() {
    const text = buildFilterFile(rules, useCull.getState().imported);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateId ? `cull-${templateId.toLowerCase()}.filter` : "cull.filter";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Filter rules</h3>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".filter,.txt"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              setImported(text, file.name);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileRef.current?.click()}
          >
            <Upload />
            Import
          </Button>
          <Button size="sm" variant="outline" onClick={exportFilter}>
            <Download />
            Export .filter
          </Button>
        </div>
      </div>
      {importedName ? (
        <p className="mb-3 text-xs text-muted">
          Cull rules inject into {importedName} at NeverSink override area 1
        </p>
      ) : (
        <p className="mb-3 text-xs text-muted">
          No template yet. Pick a NeverSink filter above, or export Cull rules alone.
        </p>
      )}
      {rules.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing customized yet. Import a build or hide an item to write a rule.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rules.map((r) => {
            const label = decodeHtmlEntities(r.uniqueName ?? r.baseType);
            const bits = [
              r.source === "build" ? "build" : null,
              r.rarities.length ? r.rarities.join(" · ") : "any",
              ...defenceSummary(r.defence),
              ...affixSummary(r.affixes),
            ].filter(Boolean);
            return (
              <li
                key={r.id}
                className="flex items-center gap-2 rounded-md border border-border bg-elevated px-3 py-2"
              >
                <button
                  type="button"
                  className="min-h-11 min-w-0 flex-1 text-left"
                  onClick={() => {
                    const rarity =
                      r.rarities[0] ??
                      (r.className.toLowerCase().includes("gem") ? "Gem" : "Normal");
                    const name = decodeHtmlEntities(r.uniqueName ?? r.baseType);
                    ingestText(
                      `Item Class: ${r.className}\nRarity: ${rarity}\n${name}\n${r.uniqueName ? decodeHtmlEntities(r.baseType) : ""}\n--------\nItem Level: 1`,
                      "rule",
                    );
                  }}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      r.action === "Hide" ? "text-danger" : "text-ok",
                    )}
                  >
                    {r.action}
                  </span>{" "}
                  <span className="text-sm">{label}</span>
                  {bits.length ? (
                    <span className="text-xs text-subtle"> · {bits.join(" · ")}</span>
                  ) : null}
                </button>
                <Button
                  size="icon"
                  variant="subtle"
                  aria-label={`Remove ${label}`}
                  onClick={() => removeRule(r.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
