# @webrek/mx-cp

[![npm](https://img.shields.io/npm/v/@webrek/mx-cp.svg?style=flat-square)](https://www.npmjs.com/package/@webrek/mx-cp)
[![Pruebas](https://img.shields.io/github/actions/workflow/status/webrek/mx-cp/ci.yml?branch=main&label=tests&style=flat-square)](https://github.com/webrek/mx-cp/actions)
[![Licencia](https://img.shields.io/npm/l/@webrek/mx-cp.svg?style=flat-square)](LICENSE)

Códigos postales de México (**SEPOMEX**) resueltos a **estado**, **municipio**
(con la clave `CVEGEO` de INEGI) y sus **colonias/asentamientos**. Sin API key y
sin servidor: los datos viven en el paquete y se cargan **por prefijo bajo
demanda**, así que cada consulta baja solo un pedazo (~5–45 KB), no los 32 mil
códigos.

Pensado para acompañar a [`@webrek/mx-geo`](https://github.com/webrek/mx-geo): el
`cvegeo` que devuelve es la misma clave que usa ese paquete para dibujar el
municipio en el mapa.

## Instalación

```bash
pnpm add @webrek/mx-cp
```

Paquete **ESM** (usa carga dinámica por prefijo). Node 18+ y cualquier bundler
moderno (Vite, Next, etc.).

## Uso

```ts
import { buscaCP } from "@webrek/mx-cp";

const r = await buscaCP("06000");
// {
//   cp: "06000",
//   cveEnt: "09",
//   estado: "Ciudad de México",
//   cveMun: "015",
//   cvegeo: "09015",
//   municipio: "Cuauhtémoc",
//   ciudad: "Ciudad de México",
//   zona: "Urbano",
//   asentamientos: [ { nombre: "Centro (Área 1)", tipo: "Colonia" }, … ]
// }

await buscaCP("99999"); // null si no existe
```

Maneja CP con **cero inicial** (`"01000"`) y recorta espacios. `esCPValido(cp)`
te dice si tiene forma de CP mexicano (5 dígitos) sin tocar los datos.

## Con @webrek/mx-geo

El `cvegeo` cruza directo con el mapa de municipios:

```tsx
import { buscaCP } from "@webrek/mx-cp";
import { municipio } from "@webrek/mx-geo";
import { MapaMunicipios } from "@webrek/mx-geo/react";

const { cveEnt, cvegeo } = (await buscaCP("44100"))!;
municipio(cvegeo)?.nombre; // "Guadalajara"

<MapaMunicipios estado={cveEnt} data={{ [cvegeo]: 1 }} />;
```

## API

| Export            | Descripción                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| `buscaCP(cp)`     | `Promise<ResultadoCP \| null>`. Carga el shard del prefijo y resuelve. |
| `esCPValido(cp)`  | `boolean`. ¿Tiene forma de CP (5 dígitos)?                             |
| `TIPOS` / `ZONAS` | Catálogos de tipos de asentamiento y de zona.                          |

`ResultadoCP`: `cp`, `cveEnt`, `estado`, `cveMun`, `cvegeo`, `municipio`,
`ciudad`, `zona`, `asentamientos: { nombre, tipo }[]`.

## Datos y vigencia

- **Fuente:** Servicio Postal Mexicano (**SEPOMEX**), corte de abril 2016.
  32,467 códigos postales, 2,457 municipios, 32 estados.
- Los códigos postales son muy estables; para geocoding ligero y formularios el
  corte funciona bien. La geometría no se incluye aquí: va en `@webrek/mx-geo`.
- `cveEnt`/`cveMun`/`cvegeo` son claves oficiales de **INEGI**.

## Desarrollo

```bash
pnpm install
pnpm build:data   # regenera los shards desde scripts/sepomex.csv
pnpm check        # format + typecheck + test + build
```

## Licencia

MIT © webrek. Datos de SEPOMEX (Servicio Postal Mexicano).
