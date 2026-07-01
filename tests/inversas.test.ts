import { describe, it, expect } from "vitest";
import { cpsDeMunicipio, buscaColonia } from "../src/index";

describe("cpsDeMunicipio", () => {
  it("lista los CP de un municipio (Cuauhtémoc = 09015)", async () => {
    const cps = await cpsDeMunicipio("09015");
    expect(cps.length).toBeGreaterThan(30);
    expect(cps).toContain("06000");
    expect(cps.every((c) => /^\d{5}$/.test(c))).toBe(true);
  });

  it("devuelve [] para un CVEGEO inválido o sin datos", async () => {
    expect(await cpsDeMunicipio("abc")).toEqual([]);
    expect(await cpsDeMunicipio("99999")).toEqual([]);
  });
});

describe("buscaColonia", () => {
  it("encuentra colonias por nombre dentro de un estado", async () => {
    const r = await buscaColonia("roma norte", { cveEnt: "09" });
    const roma = r.find((c) => c.nombre === "Roma Norte");
    expect(roma).toBeTruthy();
    expect(roma!.cp).toBe("06700");
    expect(roma!.municipio).toBe("Cuauhtémoc");
    expect(roma!.cvegeo).toBe("09015");
  });

  it("es indiferente a acentos y mayúsculas", async () => {
    const a = await buscaColonia("MERIDA", { cveEnt: "31", limite: 1 });
    expect(a.length).toBe(1);
  });

  it("ignora consultas de menos de 2 caracteres", async () => {
    expect(await buscaColonia("a")).toEqual([]);
  });

  it("respeta el límite", async () => {
    const r = await buscaColonia("centro", { cveEnt: "09", limite: 3 });
    expect(r).toHaveLength(3);
  });

  it("la búsqueda nacional empieza en el estado 01 (regresión: claves 10-32 son índices enteros)", async () => {
    const r = await buscaColonia("centro", { limite: 2 });
    // Sin ordenar, Object.keys pondría "10".."32" antes que "01".."09".
    expect(r[0]!.cveEnt).toBe("01");
  });
});
