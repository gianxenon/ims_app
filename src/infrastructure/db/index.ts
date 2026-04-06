import "server-only"
import sql from "mssql"

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  port: Number(process.env.DB_PORT || 1433),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
}

let poolPromise: Promise<sql.ConnectionPool> | null = null

export async function getPool() {
  if (!poolPromise) poolPromise = new sql.ConnectionPool(config).connect()
  return poolPromise
}

export { sql }
