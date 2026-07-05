import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { app } from "electron";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const database_path = app.isPackaged
  ? path.join(app.getPath("userData"), "papdex.db")
  : path.join(__dirname, "papdex.db");

const database = new Database(database_path);

database.pragma("journal_mode = WAL");

export { database_path };
export default database;
