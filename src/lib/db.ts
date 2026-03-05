import "server-only";
import sql from "mssql";

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST ?? "",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect();
  }
  return poolPromise;
}

export type DbParam = {
  name: string;
  type: unknown;
  value: unknown;
};

export async function query<T>(
  queryText: string,
  params: DbParam[] = [],
  options?: { timeoutMs?: number }
): Promise<T[]> {
  const pool = await getPool();
  const request = pool.request();
  if (options?.timeoutMs) {
    (request as unknown as { timeout: number }).timeout = options.timeoutMs;
  }
  for (const param of params) {
    request.input(param.name, param.type as sql.ISqlType, param.value);
  }
  const result = await request.query<T>(queryText);
  return result.recordset;
}

export { sql };
