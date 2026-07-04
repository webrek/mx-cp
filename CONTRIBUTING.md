# Contribuir

Gracias por tomarte el tiempo de contribuir.

## Para empezar

```bash
git clone https://github.com/webrek/mx-cp
cd mx-cp
pnpm install
```

## Antes de abrir un pull request

Corre la batería completa de revisiones localmente — CI corre lo mismo en toda
la matriz de Node soportada (20 y 22):

```bash
pnpm check     # format:check, typecheck, test, build
```

O por separado:

```bash
pnpm format        # formatear con Prettier
pnpm format:check  # verificar formato sin escribir
pnpm typecheck     # tsc --noEmit
pnpm test          # vitest
pnpm build         # tsup
```

## Datos (SEPOMEX / catálogo)

Los archivos bajo `data/` se **generan**, no se editan a mano. Si tu cambio toca
el catálogo de códigos postales, colonias o las claves CVEGEO de INEGI,
regénralos desde las fuentes SEPOMEX/INEGI y súbelos junto con el cambio:

```bash
pnpm build:data
```

## Lineamientos

- Mantén los _pull requests_ enfocados; un cambio lógico por PR.
- Agrega o actualiza pruebas para cualquier cambio de comportamiento. Las
  correcciones de errores deben venir con una prueba que falle antes del arreglo.
- Respeta el estilo de código existente — Prettier es la fuente de verdad, así
  que córrelo antes de hacer _push_.
- Actualiza `CHANGELOG.md` bajo el encabezado `Unreleased`.
