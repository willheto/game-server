import { DB } from "./types";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
import Environment from "../util/Environment";

const dialect = new MysqlDialect({
  pool: async () =>
    createPool({
      database: Environment.DB_DATABASE as string,
      host: Environment.DB_HOST as string,
      user: Environment.DB_USERNAME as string,
      password: Environment.DB_PASSWORD as string,
    }),
});

export const db = new Kysely<DB>({
  dialect,
});
