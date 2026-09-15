import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { FilterShell } from "@/components/d4/filter-shell";
import { useAsh } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrate = useAsh((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <FilterShell />;
}
