/**
 * Construye los datos de @webrek/mx-cp a partir del CSV de SEPOMEX
 * (scripts/sepomex.csv, columnas:
 *  idEstado,estado,idMunicipio,municipio,ciudad,zona,cp,asentamiento,tipo).
 *
 * Salidas:
 *  - data/cp/<PP>.json  : un shard por prefijo de 2 dígitos del CP; cada CP es
 *      [cveEnt, cveMun, ciudad, zonaIdx, [[asentamiento, tipoIdx], ...]].
 *  - data/estados-cp.json / data/municipios-cp.json : nombres por clave.
 *  - src/generado.ts : TIPOS, ZONAS y el mapa de cargadores por prefijo.
 *
 * Uso:  node scripts/build-cp.mjs
 */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const CSV = resolve(__dirname, "sepomex.csv");

const pad = (n, len) => String(n).padStart(len, "0");

/** Parser CSV mínimo con soporte de comillas dobles. */
function parseLinea(linea) {
  const campos = [];
  let cur = "";
  let enComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (enComillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') {
          cur += '"';
          i++;
        } else enComillas = false;
      } else cur += c;
    } else if (c === '"') enComillas = true;
    else if (c === ",") {
      campos.push(cur);
      cur = "";
    } else cur += c;
  }
  campos.push(cur);
  return campos;
}

async function main() {
  const texto = await readFile(CSV, "utf8");
  const lineas = texto.split(/\r?\n/).filter((l) => l.length > 0);
  lineas.shift(); // encabezado

  const TIPOS = [];
  const ZONAS = [];
  const idxDe = (arr, val) => {
    let i = arr.indexOf(val);
    if (i < 0) {
      i = arr.length;
      arr.push(val);
    }
    return i;
  };

  const estados = {}; // cveEnt -> nombre
  const municipios = {}; // cvegeo -> nombre
  const porCp = new Map(); // cp -> { e, m, ci, z, a: [[nombre, tipoIdx]] }

  for (const linea of lineas) {
    const [idEstado, estado, idMunicipio, municipio, ciudad, zona, cp, asentamiento, tipo] =
      parseLinea(linea);
    const cveEnt = pad(idEstado, 2);
    const cveMun = pad(idMunicipio, 3);
    const cvegeo = cveEnt + cveMun;
    // El CSV pierde el cero inicial de algunos CP (p. ej. "6000" = "06000").
    const cpNorm = pad(cp, 5);
    estados[cveEnt] = estado;
    municipios[cvegeo] = municipio;

    let e = porCp.get(cpNorm);
    if (!e) {
      e = { e: cveEnt, m: cveMun, ci: ciudad || "", z: idxDe(ZONAS, zona || ""), a: [] };
      porCp.set(cpNorm, e);
    }
    e.a.push([asentamiento, idxDe(TIPOS, tipo || "")]);
  }

  // Shards por prefijo de 2 dígitos.
  const dir = resolve(root, "data/cp");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const porPrefijo = new Map();
  for (const [cp, val] of porCp) {
    const pref = cp.slice(0, 2);
    if (!porPrefijo.has(pref)) porPrefijo.set(pref, {});
    porPrefijo.get(pref)[cp] = [val.e, val.m, val.ci, val.z, val.a];
  }

  const prefijos = [...porPrefijo.keys()].sort();
  for (const pref of prefijos) {
    await writeFile(resolve(dir, `${pref}.json`), JSON.stringify(porPrefijo.get(pref)));
  }

  await writeFile(resolve(root, "data/estados-cp.json"), JSON.stringify(estados));
  await writeFile(resolve(root, "data/municipios-cp.json"), JSON.stringify(municipios));

  // Índice por estado (pivote inverso): CPs por municipio + colonias buscables.
  // data/estado/<cveEnt>.json = { cps: {cvegeo:[cp]}, colonias: [[nombre,cp,cveMun,tipoIdx]] }
  const dirEstado = resolve(root, "data/estado");
  await rm(dirEstado, { recursive: true, force: true });
  await mkdir(dirEstado, { recursive: true });

  const porEstado = new Map(); // cveEnt -> { cps, colonias }
  for (const [cp, val] of porCp) {
    const cvegeo = val.e + val.m;
    let idx = porEstado.get(val.e);
    if (!idx) {
      idx = { cps: {}, colonias: [] };
      porEstado.set(val.e, idx);
    }
    (idx.cps[cvegeo] ??= []).push(cp);
    for (const [nombre, tipoIdx] of val.a) idx.colonias.push([nombre, cp, val.m, tipoIdx]);
  }
  const clavesEstado = [...porEstado.keys()].sort();
  for (const ce of clavesEstado) {
    const idx = porEstado.get(ce);
    for (const cvegeo of Object.keys(idx.cps)) idx.cps[cvegeo].sort();
    await writeFile(resolve(dirEstado, `${ce}.json`), JSON.stringify(idx));
  }

  // Cargadores estáticos (para code-splitting del bundler) + tablas.
  const casos = prefijos
    .map((p) => `  ${JSON.stringify(p)}: () => import("../data/cp/${p}.json"),`)
    .join("\n");
  const casosEstado = clavesEstado
    .map((c) => `  ${JSON.stringify(c)}: () => import("../data/estado/${c}.json"),`)
    .join("\n");
  const ts = `// GENERADO por scripts/build-cp.mjs — no editar a mano.
/** Tipos de asentamiento (índice = código guardado en los shards). */
export const TIPOS: readonly string[] = ${JSON.stringify(TIPOS)};
/** Zonas (índice = código guardado en los shards). */
export const ZONAS: readonly string[] = ${JSON.stringify(ZONAS)};
/** Carga perezosa del shard por prefijo de 2 dígitos del CP. */
export const CARGADORES: Record<string, () => Promise<{ default: unknown }>> = {
${casos}
};
/** Carga perezosa del índice inverso por estado (CVE_ENT). */
export const CARGADORES_ESTADO: Record<string, () => Promise<{ default: unknown }>> = {
${casosEstado}
};
`;
  await writeFile(resolve(root, "src/generado.ts"), ts);

  console.log(
    `CPs: ${porCp.size} · prefijos: ${prefijos.length} · tipos: ${TIPOS.length} · ` +
      `estados: ${Object.keys(estados).length} · municipios: ${Object.keys(municipios).length} · ` +
      `índices-estado: ${clavesEstado.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
