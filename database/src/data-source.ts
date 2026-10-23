import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { DataSource } from "typeorm";
import { User } from "./entities/User";

config({ path: resolve(__dirname, "../.env"), quiet: true });

// Use one connection for both the backend and migration commands.
if (!process.env.DATABASE_URL) {
  throw new Error("Add DATABASE_URL to database/.env.");
}

// TLS settings are managed here, rather than inside the connection URL.
const url = new URL(process.env.DATABASE_URL);
for (const parameter of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
  url.searchParams.delete(parameter);
}

const sslMode = process.env.DATABASE_SSL_MODE || "verify-full";
if (sslMode !== "disable" && sslMode !== "verify-full") {
  throw new Error("DATABASE_SSL_MODE must be disable or verify-full.");
}
const caFile = process.env.DATABASE_SSL_CA_PATH;

const database = new DataSource({
  type: "postgres",
  url: url.toString(),
  ssl: sslMode === "disable" ? false : {
    rejectUnauthorized: true,
    ca: caFile ? readFileSync(caFile, "utf8") : undefined,
  },
  entities: [User],
  migrations: [resolve(__dirname, "migrations/*{.ts,.js}")],
  synchronize: false, // Change tables only through migrations.
  extra: { max: 5, connectionTimeoutMillis: 10000 },
  uuidExtension: "pgcrypto",
  installExtensions: false, // PostgreSQL 13+ already provides gen_random_uuid().
});

export { User };
export default database;
