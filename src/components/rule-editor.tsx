import { FolderOpen, Volume2 } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { FilterRule } from "@/lib/poe/filter";
import {
  AFFIX_PRESETS,
  DEFENCE_STATS,
  type DefenceId,
  type DefenceWanted,
} from "@/lib/poe/mods";
import {
  GAME_ALERTS,
  NEVER_SINK_SOUNDS,
  parseSoundSelect,
  soundSelectValue,
  type FilterSound,
} from "@/lib/poe/sounds";
import { cn } from "@/lib/utils";

function Chip({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-sm border px-3 text-xs font-medium",
        on ? "border-border-strong bg-elevated text-fg" : "border-border text-subtle",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number | undefined;
  max: number;
  onChange: (n: number | undefined) => void;
}) {
  return (
    <label className="flex min-h-11 flex-1 items-center gap-2 rounded-sm border border-border bg-bg px-3">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        inputMode="numeric"
        placeholder="any"
        value={value && value > 0 ? value : ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n > 0 ? n : undefined);
        }}
        className="h-11 w-full bg-transparent text-sm text-fg outline-none"
      />
    </label>
  );
}

export function RuleEditor({
  rule,
  onPatch,
}: {
  rule: FilterRule | null;
  onPatch: (patch: Partial<FilterRule>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const defence: DefenceWanted = rule?.defence ?? {};
  const affixes = rule?.affixes ?? [];
  const sound: FilterSound | undefined = rule?.sound;
  const selectValue = soundSelectValue(sound, rule?.disableDropSound);
  const volume = sound?.volume ?? 300;
  const custom = sound?.kind === "custom";
  const plays = selectValue !== "none" && selectValue !== "mute";

  function setDefence(id: DefenceId, on: boolean) {
    onPatch({
      action: rule?.action ?? "Show",
      defence: { ...defence, [id]: on },
    });
  }

  function toggleAffix(id: string) {
    const next = affixes.includes(id) ? affixes.filter((x) => x !== id) : [...affixes, id];
    onPatch({ action: rule?.action ?? "Show", affixes: next });
  }

  function setSound(next: FilterSound) {
    onPatch({
      action: rule?.action ?? "Show",
      sound: next,
      disableDropSound: next.kind === "mute",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
          Looking for
        </p>
        <p className="mb-2 text-xs text-muted">
          Base defence uses NeverSink's Armour / Evasion / Energy Shield checks. Affixes
          become HasExplicitMod lines.
        </p>
        <p className="mb-1.5 text-xs text-subtle">Base defence</p>
        <div className="flex flex-wrap gap-1.5">
          {DEFENCE_STATS.map((stat) => (
            <Chip
              key={stat.id}
              on={!!defence[stat.id]}
              onClick={() => setDefence(stat.id, !defence[stat.id])}
            >
              {stat.label}
            </Chip>
          ))}
          <Chip
            on={!!defence.pure}
            onClick={() =>
              onPatch({
                action: rule?.action ?? "Show",
                defence: { ...defence, pure: !defence.pure },
              })
            }
          >
            Pure only
          </Chip>
        </div>
        <p className="mt-3 mb-1.5 text-xs text-subtle">Affixes</p>
        <div className="flex flex-wrap gap-1.5">
          {AFFIX_PRESETS.map((mod) => (
            <Chip
              key={mod.id}
              on={affixes.includes(mod.id)}
              onClick={() => toggleAffix(mod.id)}
            >
              {mod.label}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Field
            label="Item level ≥"
            value={rule?.itemLevelMin}
            max={100}
            onChange={(itemLevelMin) =>
              onPatch({ action: rule?.action ?? "Show", itemLevelMin })
            }
          />
          <Field
            label="Quality ≥"
            value={rule?.qualityMin}
            max={30}
            onChange={(qualityMin) =>
              onPatch({ action: rule?.action ?? "Show", qualityMin })
            }
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-elevated p-3">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-subtle uppercase">
          <Volume2 className="size-3.5" />
          Drop sound
        </p>
        <label className="block">
          <span className="sr-only">Alert sound</span>
          <select
            value={selectValue}
            onChange={(e) => setSound(parseSoundSelect(e.target.value, sound))}
            className="h-11 w-full rounded-sm border border-border bg-bg px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <option value="mute">Mute drop sound</option>
            <option value="none">Game default</option>
            <optgroup label="NeverSink — game sounds">
              {GAME_ALERTS.map((s) => (
                <option key={s.id} value={`builtin:${s.id}`}>
                  {s.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="NeverSink — custom files">
              {NEVER_SINK_SOUNDS.map((s) => (
                <option key={s.file} value={`ns:${s.file}`}>
                  {s.label}
                </option>
              ))}
            </optgroup>
            <option value="custom">My own file…</option>
          </select>
        </label>

        {custom ? (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={sound?.file ?? ""}
                onChange={(e) =>
                  setSound({ kind: "custom", file: e.target.value, volume })
                }
                placeholder="my-alert.mp3"
                className="h-11 min-w-0 flex-1 rounded-sm border border-border bg-bg px-3 font-mono text-xs text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              />
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSound({ kind: "custom", file: file.name, volume });
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-11 shrink-0"
                onClick={() => fileRef.current?.click()}
              >
                <FolderOpen />
                File
              </Button>
            </div>
            <p className="text-xs leading-snug text-muted">
              CustomAlertSound plays from the same folder as the exported .filter —
              Path of Exile 2's item filter directory. Drop the audio file there,
              then export.
            </p>
          </div>
        ) : null}

        {selectValue.startsWith("ns:") ? (
          <p className="mt-2 text-xs leading-snug text-muted">
            Copy NeverSink's custom sound pack into the filter folder so the mp3
            name matches.
          </p>
        ) : null}

        {plays ? (
          <label className="mt-3 block">
            <span className="text-xs text-muted">Volume {volume}</span>
            <input
              type="range"
              min={50}
              max={300}
              step={10}
              value={volume}
              onChange={(e) =>
                setSound({ ...(sound ?? { kind: "builtin", id: 3 }), volume: Number(e.target.value) })
              }
              className="mt-1 w-full accent-accent"
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}