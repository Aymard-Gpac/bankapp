import path from "node:path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { existsSync, mkdirSync } from "node:fs";

if (!process.env.DB_FILE) {
  throw new Error("DB_FILE is not defined");
}

const dbFile = process.env.DB_FILE;
const dbPath = path.isAbsolute(dbFile)
  ? dbFile
  : path.resolve(process.cwd(), dbFile);

const dir = path.dirname(dbPath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

export default db;
export { dbPath };
