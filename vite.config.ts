import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  server: { port: 5173, strictPort: true },
  plugins: [
    react(),
    {
      name: "hisab-app-route-fallback",
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          const path = request.url?.split("?")[0] ?? "";
          if (/^\/app(?:\/.*)?$/.test(path) && !/\.[^/]+$/.test(path)) {
            request.url = `/app/index.html${request.url?.includes("?") ? request.url.slice(request.url.indexOf("?")) : ""}`;
          }
          next();
        });
      },
    },
  ],
  resolve: { alias: { "@": resolve(root, "app/src") } },
  build: {
    rollupOptions: {
      input: {
        marketing: resolve(root, "index.html"),
        app: resolve(root, "app/index.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./app/src/test-setup.ts"],
    restoreMocks: true,
  },
});
