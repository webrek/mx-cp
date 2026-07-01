import { describe, it, expect } from "vitest";
import { buscaCP, esCPValido } from "../src/index";

describe("esCPValido", () => {
  it("acepta 5 dígitos y rechaza lo demás", () => {
    expect(esCPValido("06000")).toBe(true);
    expect(esCPValido("6000")).toBe(false);
    expect(esCPValido("abcde")).toBe(false);
    expect(esCPValido("123456")).toBe(false);
  });
});

describe("buscaCP", () => {
  it("resuelve un CP a estado, municipio (CVEGEO) y asentamientos", async () => {
    const r = await buscaCP("20000");
    expect(r).not.toBeNull();
    expect(r!.cveEnt).toBe("01");
    expect(r!.estado).toBe("Aguascalientes");
    expect(r!.cvegeo).toBe("01001");
    expect(r!.municipio).toBe("Aguascalientes");
    expect(r!.asentamientos.length).toBeGreaterThan(0);
    expect(r!.asentamientos[0]).toHaveProperty("nombre");
    expect(r!.asentamientos[0]).toHaveProperty("tipo");
  });

  it("maneja CP con cero inicial (CDMX)", async () => {
    const cuauhtemoc = await buscaCP("06000");
    expect(cuauhtemoc!.cveEnt).toBe("09");
    expect(cuauhtemoc!.cvegeo).toBe("09015");
    expect(cuauhtemoc!.municipio).toBe("Cuauhtémoc");

    const alvaro = await buscaCP("01000");
    expect(alvaro!.cvegeo).toBe("09010");
  });

  it("resuelve Monterrey y Guadalajara", async () => {
    expect((await buscaCP("64000"))!.cvegeo).toBe("19039");
    expect((await buscaCP("44100"))!.cvegeo).toBe("14039");
  });

  it("acepta el CP con espacios alrededor", async () => {
    expect((await buscaCP("  20000 "))!.cveEnt).toBe("01");
  });

  it("devuelve null para CP inexistente o inválido", async () => {
    expect(await buscaCP("00000")).toBeNull();
    expect(await buscaCP("abcde")).toBeNull();
    expect(await buscaCP("123")).toBeNull();
  });

  it("el cvegeo siempre es de 5 dígitos y concuerda con cveEnt+cveMun", async () => {
    const r = (await buscaCP("97000"))!;
    expect(r.cvegeo).toMatch(/^\d{5}$/);
    expect(r.cvegeo).toBe(r.cveEnt + r.cveMun);
    expect(r.zona).toBe("Urbano");
  });
});
