import { createFileRoute } from "@tanstack/react-router";
import { ClipboardPaste, Scissors } from "lucide-react";
import { useEffect, useRef } from "react";
import { BuildRack } from "@/components/build-rack";
import { GroundDrops } from "@/components/ground-drops";
import { ItemOverlay } from "@/components/item-overlay";
import { RuleList } from "@/components/rule-list";
import { SetupPanel } from "@/components/setup-panel";
import { Button } from "@/components/ui/button";
import { readItemClipboard } from "@/lib/clipboard";
import { looksLikeItem } from "@/lib/poe/parse-item";
import { useCull } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { item, error, status, ingestText, hydrate, loadCatalog, clearItem } =
    useCull();
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    hydrate();
    void loadCatalog();
  }, [hydrate, loadCatalog]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text") ?? "";
      if (!looksLikeItem(text)) return;
      e.preventDefault();
      ingestText(text, "paste");
    }

    async function onKey(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        const text = await readItemClipboard();
        if (text) ingestText(text, "F2");
        else
          useCull.setState({
            error: "Clipboard has no item copy.",
            status: "Copy in game first (Ctrl+C).",
          });
      }
    }

    window.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKey);
    };
  }, [ingestText]);

  async function readNow() {
    const text = await readItemClipboard();
    if (text) ingestText(text, "button");
    else {
      useCull.setState({
        error: "Could not read the clipboard. Paste with Ctrl+V instead.",
        status: "Waiting for paste.",
      });
      pasteRef.current?.focus();
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-5 overflow-x-hidden px-4 py-5 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex size-11 items-center justify-center rounded-md bg-elevated">
          <Scissors className="size-5 text-fg" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Cull</h1>
          <p className="text-sm text-muted">
            Start from NeverSink, import a build, then hide or show items by their
            picture.
          </p>
        </div>
        <Button variant="outline" onClick={readNow}>
          <ClipboardPaste />
          Read clipboard
        </Button>
      </header>

      <SetupPanel />

      <label className="block">
        <span className="sr-only">Paste item text</span>
        <textarea
          ref={pasteRef}
          rows={3}
          placeholder="Or paste a Ctrl+C item dump here. Starts with Item Class:"
          className="w-full resize-y rounded-md border border-border bg-surface px-3 py-3 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          onChange={(e) => {
            const v = e.target.value;
            if (looksLikeItem(v)) {
              ingestText(v, "paste");
              e.target.value = "";
            }
          }}
        />
      </label>

      <p className="text-sm text-muted" role="status">
        {error ? <span className="text-danger">{error}</span> : status}
        {item ? (
          <button
            type="button"
            className="ml-3 text-xs text-subtle underline-offset-2 hover:underline"
            onClick={clearItem}
          >
            Clear
          </button>
        ) : null}
      </p>

      <BuildRack />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
        <GroundDrops />
        <div className="flex flex-col gap-5">
          {item ? (
            <ItemOverlay item={item} />
          ) : (
            <section className="rounded-xl border border-dashed border-border-strong bg-surface p-6 text-sm text-muted">
              No item loaded. Click a build piece, a drop on the ground, or paste a
              copy.
            </section>
          )}
          <RuleList />
        </div>
      </div>
    </main>
  );
}
