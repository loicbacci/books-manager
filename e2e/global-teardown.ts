import { spawnSync } from "child_process";

const dockerComposeFile = "docker-compose.test.yml";

export default async function globalTeardown() {
  spawnSync("docker", ["compose", "-f", dockerComposeFile, "down", "-v"], {
    stdio: "inherit",
  });
}
