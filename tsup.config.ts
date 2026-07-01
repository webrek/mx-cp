import { defineConfig } from "tsup";

// ESM-only con code-splitting: cada prefijo de CP es un chunk que se carga bajo
// demanda. En CJS los 90 shards se inlinearían en un solo archivo enorme.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: true,
  sourcemap: false,
});
