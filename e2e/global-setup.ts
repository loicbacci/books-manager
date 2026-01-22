import { spawnSync } from "child_process";
import net from "net";

const dockerComposeFile = "docker-compose.test.yml";
const databaseUrl =
  process.env.PLAYWRIGHT_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/booksmanager_test";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const useShell = process.platform === "win32";

const run = (command: string, args: string[], env?: NodeJS.ProcessEnv) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: useShell,
    env: env ?? process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
};

const runWithOutput = (
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv
) => {
  const result = spawnSync(command, args, {
    shell: useShell,
    env: env ?? process.env,
    encoding: "utf8",
  });
  const stdout = result.stdout?.toString() ?? "";
  const stderr = result.stderr?.toString() ?? "";

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const output = [stdout, stderr].filter(Boolean).join("\n");
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${output || "No output"}`
    );
  }

  if (stdout.trim()) {
    console.log(stdout.trim());
  }
};

const getContainerId = () => {
  const result = spawnSync("docker", [
    "compose",
    "-f",
    dockerComposeFile,
    "ps",
    "-q",
    "db",
  ]);

  if (result.status !== 0) {
    throw new Error("Failed to resolve test database container id.");
  }

  return (result.stdout || "").toString().trim();
};

const waitForDbReady = async (timeoutMs: number) => {
  const start = Date.now();
  const containerId = getContainerId();

  if (!containerId) {
    throw new Error("Test database container is not running.");
  }

  while (Date.now() - start < timeoutMs) {
    const result = spawnSync("docker", [
      "exec",
      containerId,
      "pg_isready",
      "-U",
      "postgres",
    ]);

    if (result.status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Timed out waiting for database readiness.");
};

const waitForPort = async (
  host: string,
  port: number,
  timeoutMs: number
) => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const isOpen = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });

    if (isOpen) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for database at ${host}:${port}`);
};

const parseDatabaseUrl = (url: string) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parsed.port ? Number(parsed.port) : 5432,
  };
};

const withRetry = async (
  action: () => void,
  attempts: number,
  delayMs: number
) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      action();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
};

export default async function globalSetup() {
  try {
    run("docker", ["compose", "-f", dockerComposeFile, "up", "-d"]);

    const { host, port } = parseDatabaseUrl(databaseUrl);
    await waitForPort(host, port, 60_000);
    await waitForDbReady(60_000);

    const env = { ...process.env, DATABASE_URL: databaseUrl };
    await withRetry(
      () => runWithOutput(npmCommand, ["run", "db:push", "--", "--skip-generate"], env),
      3,
      2000
    );
    await withRetry(
      () => runWithOutput(npmCommand, ["run", "db:seed"], env),
      3,
      2000
    );
  } catch (error) {
    try {
      run("docker", ["compose", "-f", dockerComposeFile, "down", "-v"]);
    } catch {
      // Best effort cleanup
    }
    throw error;
  }
}
