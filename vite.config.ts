import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

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
  ],
});
