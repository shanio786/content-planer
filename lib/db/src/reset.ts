import { client } from "./index";

const TABLES = [
  "projects",
  "revenue",
  "tasks",
  "content",
  "notes",
  "activity",
  "planner",
  "keywords",
  "expenses",
] as const;

/**
 * Deletes all data and resets autoincrement counters.
 * Run with: pnpm --filter @workspace/db run reset
 */
export async function resetDatabase(): Promise<void> {
  console.log("Clearing all data tables...");
  for (const table of TABLES) {
    await client.execute(`DELETE FROM ${table}`);
    await client.execute({
      sql: `DELETE FROM sqlite_sequence WHERE name = ?`,
      args: [table],
    });
  }
  console.log("All tables cleared. Database is empty.");
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to reset database:", err);
      process.exit(1);
    });
}
