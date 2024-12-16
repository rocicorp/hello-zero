import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { getRequestListener } from "@hono/node-server";
import { app } from "./api/index.js";

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  plugins: [
    react(),
    {
      name: "api-server",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith("/api")) {
            return next();
          }
          getRequestListener(async (request) => {
            return await app.fetch(request, {});
          })(req, res);
        });
      },
    },
  ],
  preview: {
    port: 5173,
  },
  server: {
    port: 5173,
  },
});
