import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import compression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Cloudflare Pages rejects files >25 MiB. The default `hidden` sourcemap for
    // the bundle exceeds that (~27 MiB), so disable sourcemaps for production.
    sourcemap: false,
  },
  plugins: [
    react({
      babel: {
        plugins: ["react-dev-locator"],
      },
    }),
    tsconfigPaths(),
    // Pre-compress eligible assets with brotli so Cloudflare Pages can serve
    // them via Content-Encoding: br at the edge. Originals are kept so the
    // fallback (no Accept-Encoding: br) still works.
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      deleteOriginalAsset: false,
    }),
  ],
});
