import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
if (existsSync(resolve(root, ".env"))) {
  config({ path: resolve(root, ".env") });
}
if (existsSync(resolve(root, ".env.local"))) {
  config({ path: resolve(root, ".env.local"), override: true });
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes("user:password@host")) {
  throw new Error(
    "DATABASE_URL is missing or still a placeholder. Set a real Neon connection string in .env.local"
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
