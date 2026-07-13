import { describe, expect, it } from "vitest";
import { parseGeoData } from "@/lib/contributions";

describe("parseGeoData", () => {
  it("converts CSV points into GeoJSON", () => {
    const result = parseGeoData("longitude,latitude,valor,nome\n-41.93,-12.58,82,Alvo A");
    expect(result.features).toHaveLength(1);
    expect(result.features[0].geometry).toEqual({ type: "Point", coordinates: [-41.93, -12.58] });
    expect(result.features[0].properties).toMatchObject({ value: 82, label: "Alvo A" });
  });

  it("rejects datasets without valid coordinates", () => {
    expect(() => parseGeoData("999,999,10,Inválido")).toThrow("Nenhum ponto válido");
  });
});
