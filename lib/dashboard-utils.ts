import type { Occurrence } from "@/lib/types";

export function filterOccurrences(occurrences: Occurrence[], region: string, category: "all" | "critico" | "estrategico") {
  return occurrences.filter((occurrence) =>
    (region === "all" || occurrence.regionSlug === region || occurrence.category === "hub") &&
    (category === "all" || occurrence.category === category || occurrence.category === "hub")
  );
}
