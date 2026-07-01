import { CARGADORES, TIPOS, ZONAS } from "./generado";
import estadosData from "../data/estados-cp.json";
import municipiosData from "../data/municipios-cp.json";

const ESTADOS = estadosData as Record<string, string>;
const MUNICIPIOS = municipiosData as Record<string, string>;

/** Un asentamiento (colonia, fraccionamiento, ejido…) dentro de un CP. */
export interface Asentamiento {
  /** Nombre del asentamiento (p. ej. "Zona Centro"). */
  nombre: string;
  /** Tipo (p. ej. "Colonia", "Fraccionamiento", "Ejido"). */
  tipo: string;
}

/** Resultado de buscar un código postal. */
export interface ResultadoCP {
  /** Código postal de 5 dígitos. */
  cp: string;
  /** CVE_ENT de INEGI (2 dígitos), p. ej. "09". */
  cveEnt: string;
  /** Nombre del estado. */
  estado: string;
  /** CVE_MUN de INEGI (3 dígitos), p. ej. "003". */
  cveMun: string;
  /** CVEGEO del municipio (5 dígitos) — úsalo con `@webrek/mx-geo`. */
  cvegeo: string;
  /** Nombre del municipio. */
  municipio: string;
  /** Ciudad (si aplica), o `null`. */
  ciudad: string | null;
  /** Zona: "Urbano", "Rural" o "Semiurbano". */
  zona: string;
  /** Asentamientos (colonias) que comparten el CP. */
  asentamientos: Asentamiento[];
}

/** Fila cruda de un shard: [cveEnt, cveMun, ciudad, zonaIdx, [[asentamiento, tipoIdx]]]. */
type Fila = [string, string, string, number, [string, number][]];

const cache = new Map<string, Record<string, Fila>>();

async function cargaShard(pref: string): Promise<Record<string, Fila> | null> {
  const hit = cache.get(pref);
  if (hit) return hit;
  const loader = CARGADORES[pref];
  if (!loader) return null;
  const mod = await loader();
  const data = ((mod as { default?: unknown }).default ?? mod) as Record<string, Fila>;
  cache.set(pref, data);
  return data;
}

/** `true` si `cp` tiene forma de código postal mexicano (5 dígitos). */
export function esCPValido(cp: string): boolean {
  return /^\d{5}$/.test(String(cp).trim());
}

/**
 * Busca un código postal (SEPOMEX). Carga bajo demanda solo el shard del prefijo
 * de 2 dígitos, así que el costo por consulta es pequeño. Devuelve `null` si el
 * CP no existe o no tiene forma válida.
 *
 * El `cvegeo` del resultado es la clave de municipio de INEGI: pásalo a
 * `@webrek/mx-geo` (`municipio(cvegeo)`, `<MapaMunicipios>`) para cruzarlo con
 * la geometría.
 */
export async function buscaCP(cp: string): Promise<ResultadoCP | null> {
  const clave = String(cp).trim();
  if (!esCPValido(clave)) return null;
  const shard = await cargaShard(clave.slice(0, 2));
  const fila = shard?.[clave];
  if (!fila) return null;
  const [cveEnt, cveMun, ciudad, z, a] = fila;
  const cvegeo = cveEnt + cveMun;
  return {
    cp: clave,
    cveEnt,
    estado: ESTADOS[cveEnt] ?? "",
    cveMun,
    cvegeo,
    municipio: MUNICIPIOS[cvegeo] ?? "",
    ciudad: ciudad || null,
    zona: ZONAS[z] ?? "",
    asentamientos: a.map(([nombre, t]) => ({ nombre, tipo: TIPOS[t] ?? "" })),
  };
}

export { TIPOS, ZONAS };
