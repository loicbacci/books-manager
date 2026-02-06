import { execSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const DB_URL =
  process.env.PLAYWRIGHT_DB_URL ??
  "postgresql://postgres:postgres@localhost:5433/booksmanager_test";

const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: DB_URL,
};

const run = (command: string) => {
  execSync(command, { stdio: "inherit", env });
};

const waitForDb = async () => {
  const attempts = 20;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      execSync(
        "docker compose -f docker-compose.test.yml exec -T db pg_isready -U postgres",
        { stdio: "ignore", env }
      );
      return;
    } catch {
      if (attempt === attempts) {
        throw new Error("Database did not become ready in time.");
      }
      await delay(1500);
    }
  }
};

export default async function globalSetup() {
  run("docker compose -f docker-compose.test.yml up -d");
  await waitForDb();
  run("npx prisma db push --skip-generate");
  run("npm run db:seed");
}
