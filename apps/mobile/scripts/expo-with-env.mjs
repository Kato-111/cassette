import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const rootEnvPath = fileURLToPath(new URL("../../../.env", import.meta.url));
const expoCliPath = fileURLToPath(
  new URL("../node_modules/expo/bin/cli", import.meta.url),
);
const rootEnv = parseEnv(readFileSync(rootEnvPath, "utf8"));
const expoEnv = { ...process.env };

// Expo only needs public client configuration. Do not pass server credentials
// from the shared root env into Expo's process or development logs.
for (const key of Object.keys(rootEnv)) {
  delete expoEnv[key];
}

for (const [key, value] of Object.entries(rootEnv)) {
  if (key.startsWith("EXPO_PUBLIC_")) {
    expoEnv[key] = value;
  }
}

// The shared file sits at the workspace root, which Expo detects in a
// monorepo. Prevent Expo from loading it again after the secrets are filtered.
expoEnv.EXPO_NO_DOTENV = "1";

const child = spawn(process.execPath, [expoCliPath, ...process.argv.slice(2)], {
  env: expoEnv,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Failed to start Expo:", error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
