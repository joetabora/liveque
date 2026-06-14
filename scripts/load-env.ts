import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

/** Load .env then .env.local (same order as Next.js). */
export function loadEnv() {
  const root = process.cwd();
  const envPath = resolve(root, ".env");
  const localPath = resolve(root, ".env.local");

  if (existsSync(envPath)) {
    config({ path: envPath });
  }
  if (existsSync(localPath)) {
    config({ path: localPath, override: true });
  }
}

loadEnv();
