import { useState } from "react";
import { useAsh } from "@/lib/store";

export function CreateModal() {
  const modal = useAsh((s) => s.modal);
  const { openModal, createFilter, importCode, renameActive, active } = useAsh();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"create" | "import">("create");

  if (!modal) return null;

  if (modal === "rename") {
    return (
      <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4">
        <div className="d4-modal w-full max-w-md p-5">
          <h2 className="d4-head-stone -mx-5 -mt-5 mb-4 h-10 text-center leading-10">
            Rename Filter
          </h2>
          <input
            className="d4-input w-full"
            defaultValue={active().name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="d4-btn" onClick={() => openModal(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="d4-btn"
              onClick={() => renameActive(name || active().name)}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4">
      <div className="d4-modal w-full max-w-lg p-5">
        <h2 className="d4-head-stone -mx-5 -mt-5 mb-5 h-10 text-center leading-10">
          Create Loot Filter
        </h2>
        <div className="mb-4 flex items-start gap-3">
          <input
            type="radio"
            className="mt-1"
            name="filter-mode"
            checked={mode === "create"}
            onChange={() => setMode("create")}
            aria-label="Create new loot filter"
          />
          <div className="flex-1">
            <p className="text-sm">Create New Loot Filter</p>
            <input
              className="d4-input mt-2 w-full"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setMode("create")}
              aria-label="Filter name"
            />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <input
            type="radio"
            className="mt-1"
            name="filter-mode"
            checked={mode === "import"}
            onChange={() => setMode("import")}
            aria-label="Import loot filter"
          />
          <div className="flex-1">
            <p className="text-sm">Import Loot Filter</p>
            <p className="mt-1 text-xs text-muted">
              Import an existing loot filter using a unique code.
            </p>
            <textarea
              className="d4-input mt-2 min-h-24 w-full py-2"
              placeholder='Paste a loot filter "Import Code"'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={() => setMode("import")}
              aria-label="Loot filter import code"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="d4-btn" onClick={() => openModal(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="d4-btn"
            onClick={() => {
              if (mode === "import") importCode(code, name);
              else createFilter(name);
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
