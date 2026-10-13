import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL not found in environment.");
  process.exit(1);
}

const parsed = new URL(dbUrl);
const dbName = parsed.pathname.replace(/^\//, "");
const host = parsed.hostname;
const port = parsed.port || "3306";
const user = decodeURIComponent(parsed.username);
const password = decodeURIComponent(parsed.password);

// Look for mysqldump in common locations or PATH
const candidates = [
  "mysqldump",
  "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
  "C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
  "C:\\xampp\\mysql\\bin\\mysqldump.exe",
  "C:\\laragon\\bin\\mysql\\current\\bin\\mysqldump.exe",
];

let mysqldumpBin = null;
for (const cand of candidates) {
  try {
    if (cand === "mysqldump") {
      // test if in PATH
      execFileSync("mysqldump", ["--version"], { stdio: "ignore" });
      mysqldumpBin = "mysqldump";
      break;
    } else if (fs.existsSync(cand)) {
      mysqldumpBin = cand;
      break;
    }
  } catch {
    // continue
  }
}

if (!mysqldumpBin) {
  console.error("Could not find mysqldump binary.");
  process.exit(1);
}

const backupsDir = path.resolve(__dirname, "../backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const dumpFilePath = path.join(backupsDir, `${dbName}_backup_${timestamp}.sql`);

console.log(`Starting backup of database '${dbName}' using ${mysqldumpBin}...`);

const args = [
  `-h${host}`,
  `-P${port}`,
  `-u${user}`,
  `--databases`,
  dbName,
  `--single-transaction`,
  `--quick`,
  `--routines`,
  `--triggers`,
  `--result-file=${dumpFilePath}`,
];

// Provide password via env MYSQL_PWD to prevent CLI exposure
const env = { ...process.env, MYSQL_PWD: password };

try {
  execFileSync(mysqldumpBin, args, { env, stdio: "inherit" });
  const stat = fs.statSync(dumpFilePath);
  console.log(`✓ Backup successfully created!`);
  console.log(`  File: ${dumpFilePath}`);
  console.log(`  Size: ${stat.size} bytes`);
} catch (err) {
  console.error("Backup failed:", err.message);
  process.exit(1);
}
