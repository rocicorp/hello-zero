import { getRequestListener } from "@hono/node-server";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "development") {
  dotenv.config();
}

export default defineConfig({
  build: {
    target: "es2022",
  },
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
            const { app } = await import("./api/index.js");
            return await app.fetch(request, {});
          })(req, res);
        });
      },
    },
  ],
});
