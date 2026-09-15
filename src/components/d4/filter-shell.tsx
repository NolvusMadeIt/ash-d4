import { CreateModal } from "@/components/d4/create-modal";
import { GroundPreview } from "@/components/d4/ground-preview";
import { RuleEditor } from "@/components/d4/rule-editor";
import { RuleList } from "@/components/d4/rule-list";
import { useAsh } from "@/lib/store";

export function FilterShell() {
  const { status, error } = useAsh();

  return (
    <div className="d4-frame relative flex min-h-dvh flex-col">
      <div className="d4-pentagram pointer-events-none absolute inset-0" />
      <header className="relative flex items-center justify-between border-b border-border px-4 py-2">
        <p className="text-xs tracking-[0.28em] text-gold uppercase">Loot Filter</p>
        <p className="text-[11px] tracking-[0.32em] text-subtle uppercase">Ash</p>
      </header>
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 overflow-x-hidden p-3 sm:p-4">
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          <RuleList />
          <RuleEditor />
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            className="d4-btn min-w-40"
            onClick={() =>
              useAsh.setState({ status: "Changes saved on this device." })
            }
          >
            Save Changes
          </button>
        </div>
        <GroundPreview />
        <p className="text-center text-xs text-muted" role="status">
          {error ? <span className="text-rarity-legendary">{error}</span> : status}
        </p>
      </div>
      <CreateModal />
    </div>
  );
}
