import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import authRouter from "./routes/auth";
import { logger } from "./lib/logger";

const app: Express = express();

// Belt-and-suspenders no-index header: the dashboard already ships
// `<meta name="robots" content="noindex,...">` and a Disallow-all
// robots.txt, but a server-level header is the strongest signal for
// crawlers that fetch arbitrary URLs (including API endpoints).
app.use((_req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  next();
});

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

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", authRouter);
app.use("/api", router);

// Optional: serve the built dashboard from a single Node process.
// Set STATIC_DIR (e.g. on a VPS) to the absolute path of
// `artifacts/dashboard/dist/public`. When set, all non-/api routes
// fall back to index.html so React Router works for deep links.
// In Replit dev this stays unset, so vite continues to serve the
// dashboard on its own port and this block is a no-op.
const STATIC_DIR = process.env["STATIC_DIR"];
if (STATIC_DIR) {
  if (!existsSync(STATIC_DIR)) {
    logger.warn(
      { STATIC_DIR },
      "STATIC_DIR is set but the directory does not exist — skipping static-file serving",
    );
  } else {
    const indexHtml = path.join(STATIC_DIR, "index.html");
    if (!existsSync(indexHtml)) {
      logger.warn(
        { STATIC_DIR, indexHtml },
        "STATIC_DIR is set but index.html is missing — skipping static-file serving",
      );
    } else {
      logger.info({ STATIC_DIR }, "Serving dashboard static files");
      app.use(
        express.static(STATIC_DIR, {
          index: false,
          maxAge: "1h",
          setHeaders: (res, filePath) => {
            // Never cache index.html so deploys roll out instantly.
            if (filePath.endsWith("index.html")) {
              res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            }
          },
        }),
      );
      // SPA fallback for any non-/api GET. Matches anything that is
      // not under /api/ to avoid swallowing API 404s.
      app.get(/^\/(?!api(\/|$)).*/, (_req, res) => {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(indexHtml);
      });
    }
  }
}

export default app;
