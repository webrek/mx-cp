# Changelog

Todas las versiones notables de este paquete se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y el versionado es [SemVer](https://semver.org/lang/es/).

## [0.2.0]

### Agregado

- **Búsquedas inversas** (índice por estado, carga perezosa por CVE_ENT):
  - `cpsDeMunicipio(cvegeo)` — todos los CP de un municipio.
  - `buscaColonia(texto, { cveEnt?, limite? })` — busca colonias por nombre
    (sin acentos ni mayúsculas); ideal para un typeahead. Acota con `cveEnt`.

### Corregido

- `buscaColonia` nacional recorría los estados en orden incorrecto: en JS las
  claves `"10".."32"` son índices enteros y salían antes que `"01".."09"`. Ahora
  se ordenan explícitamente (01..32).

## [0.1.0]

Primera versión.

- `buscaCP(cp)`: resuelve un código postal (SEPOMEX, abril 2016) a estado,
  municipio (`CVEGEO` de INEGI), ciudad, zona y asentamientos.
- Carga por prefijo de 2 dígitos bajo demanda (un shard por prefijo); maneja CP
  con cero inicial.
- `esCPValido`, catálogos `TIPOS` y `ZONAS`.
- El `cvegeo` cruza directo con `@webrek/mx-geo`.
