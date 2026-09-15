import { FileCode2, Filter, FolderOpen } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NEVER_SINK_TEMPLATES, type NeverSinkId } from "@/lib/poe/neversink";
import { useCull } from "@/lib/store";

export function SetupPanel() {
  const {
    templateId,
    templateLoading,
    loadTemplate,
    importBuild,
    buildName,
    clearBuild,
  } = useCull();
  const fileRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");

  async function onTemplate(value: string) {
    if (!value) return;
    await loadTemplate(value as NeverSinkId);
  }

  async function onBuildFile(file: File) {
    const text = await file.text();
    await importBuild(text, file.name);
  }

  async function loadDemo() {
    const res = await fetch("/demo-build.json");
    const text = await res.text();
    if (!useCull.getState().templateId) {
      await loadTemplate("2-SEMI-STRICT");
    }
    await importBuild(text, "demo monk.build");
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-xs font-medium tracking-wide text-subtle uppercase">
            <Filter className="size-3.5" />
            NeverSink template
          </span>
          <select
            value={templateId ?? ""}
            disabled={templateLoading}
            onChange={(e) => void onTemplate(e.target.value)}
            className="h-11 w-full rounded-sm border border-border bg-elevated px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
          >
            <option value="">Choose a default filter</option>
            {NEVER_SINK_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-subtle uppercase">
            Build import
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".build,.json,.xml,.txt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await onBuildFile(file);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileRef.current?.click()}
            >
              <FolderOpen />
              Import .build
            </Button>
            <Button size="sm" variant="outline" onClick={() => void loadDemo()}>
              Load demo monk
            </Button>
            {buildName ? (
              <Button size="sm" variant="subtle" onClick={clearBuild}>
                Clear build
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <label className="mt-3 block">
        <span className="sr-only">Path of Building code</span>
        <textarea
          rows={3}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste Path of Building code here, then apply."
          className="w-full resize-y rounded-md border border-border bg-elevated px-3 py-3 font-mono text-xs text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        />
      </label>
      <div className="mt-2 flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          disabled={!code.trim()}
          onClick={async () => {
            await importBuild(code, "Path of Building");
            setCode("");
          }}
        >
          <FileCode2 />
          Apply PoB
        </Button>
      </div>
    </section>
  );
}
