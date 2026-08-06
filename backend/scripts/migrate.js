/**
 * CLI entry point for database migrations.
 *
 * Usage:
 *   npm run db:migrate           # apply pending migrations
 *   npm run db:migrate:status    # show executed / pending migrations
 *   npm run db:migrate:down      # roll back the most recent migration
 */

const { connectDatabase, closeDatabase } = require("../src/database");
const { migrator, migrationStatus } = require("../src/database/migrator");
const logger = require("../src/utils/logger");

async function main() {
  const command = process.argv[2] || "up";
  await connectDatabase();
  try {
    if (command === "status") {
      const status = await migrationStatus();
      console.log(JSON.stringify(status, null, 2));
    } else if (command === "up") {
      const executed = await migrator.up();
      console.log(`Applied ${executed.length} migration(s).`);
    } else if (command === "down") {
      const rolledBack = await migrator.down();
      console.log(`Rolled back ${rolledBack.length} migration(s).`);
    } else {
      console.error(`Unknown command: ${command}`);
      console.error("Available commands: up | down | status");
      process.exitCode = 1;
    }
  } finally {
    await closeDatabase();
  }
}

main().catch((error) => {
  logger.error({ message: "Migration command failed", error: error.message, stack: error.stack });
  process.exit(1);
});
