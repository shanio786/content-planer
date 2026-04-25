import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

function resolveDbUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (
    raw &&
    raw.length > 0 &&
    !raw.startsWith("postgres://") &&
    !raw.startsWith("postgresql://")
  ) {
    // Already a libsql/file/http url — pass through
    if (
      raw.startsWith("file:") ||
      raw.startsWith("libsql:") ||
      raw.startsWith("http://") ||
      raw.startsWith("https://")
    ) {
      return raw;
    }
    // Bare sqlite path (with or without sqlite: prefix) → file: url
    const stripped = raw.startsWith("sqlite:") ? raw.slice(7) : raw;
    return `file:${path.resolve(stripped)}`;
  }
  return `file:${path.resolve(process.cwd(), "data", "business-hub.db")}`;
}

const dbUrl = resolveDbUrl();

if (dbUrl.startsWith("file:")) {
  const filePath = dbUrl.slice(5);
  mkdirSync(path.dirname(filePath), { recursive: true });
}

export const client = createClient({ url: dbUrl });
export const db = drizzle(client, { schema });

export * from "./schema";
