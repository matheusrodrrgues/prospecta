import { describe, expect, it } from "vitest";
import { filterOccurrences } from "@/lib/dashboard-utils";
import { seedOccurrences } from "@/lib/seed";

describe("filterOccurrences", () => {
  it("keeps the research hub while filtering a region", () => {
    const result = filterOccurrences(seedOccurrences, "irece", "all");
    expect(result.map(({ id }) => id)).toEqual(["irece", "hub"]);
  });

  it("filters mineral categories", () => {
    const result = filterOccurrences(seedOccurrences, "all", "critico");
    expect(result.every((item) => item.category === "critico" || item.category === "hub")).toBe(true);
  });
});
