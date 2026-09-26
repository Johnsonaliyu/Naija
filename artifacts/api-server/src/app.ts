import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

// Bundled output lives at artifacts/api-server/dist/index.mjs (see build.mjs's
// banner, which sets globalThis.__dirname to that file's directory). The
// frontend's Vite build is at artifacts/truthlens-naija/dist/public — a
// sibling package two levels up.
const clientDistDir = path.resolve(
  __dirname,
  "../../truthlens-naija/dist/public",
);
const clientIndexHtml = path.join(clientDistDir, "index.html");
const hasClientBuild = fs.existsSync(clientIndexHtml);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (hasClientBuild) {
  app.use(express.static(clientDistDir));
  // SPA fallback: any GET that isn't /api/... and isn't a real static file
  // gets index.html so client-side routes (e.g. /dashboard) work on refresh.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(clientIndexHtml);
  });
} else {
  logger.warn(
    { clientDistDir },
    "Frontend build not found; skipping static file serving. Run the truthlens-naija build first.",
  );
}

export default app;
