import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let _db: Db | null = null;

export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not configured");
  }

  const url = raw.replace(/^["']|["']$/g, "");

  if (
    url.includes("user:password@host") ||
    url.includes("placeholder:placeholder@localhost")
  ) {
    throw new Error("DATABASE_URL is still a placeholder");
  }

  return url;
}

function createDb(): Db {
  const sql = neon(getDatabaseUrl());
  return drizzle(sql, { schema });
}

export function getDb(): Db {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    if (typeof value === "function") {
      return value.bind(real);
    }
    return value;
  },
});
