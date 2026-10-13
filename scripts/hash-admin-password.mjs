import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.log("Usage: node scripts/hash-admin-password.mjs <your-password>");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
crypto.scrypt(password, salt, 64, (err, derivedKey) => {
  if (err) {
    console.error("Error hashing password:", err);
    process.exit(1);
  }
  const hash = `${salt}:${derivedKey.toString("hex")}`;
  console.log("\nGenerated ADMIN_PASSWORD_HASH:");
  console.log(hash);
  console.log("\nAdd this to your .env or production environment:");
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
});
