import { defineConfig } from "drizzle-kit";
import path from "path";

const dbUrl = process.env.DATABASE_URL?.trim();
const isPostgres =
  !!dbUrl && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"));
const sqlitePath =
  dbUrl && !isPostgres
    ? dbUrl.startsWith("sqlite:")
      ? dbUrl.slice(7)
      : dbUrl
    : path.resolve(process.cwd(), "data", "business-hub.db");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: sqlitePath,
  },
});
