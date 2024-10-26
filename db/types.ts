import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type DB = {
  accounts: Account;
};

export type Account = {
  account_id: Generated<number>;
  username: string;
  password: string;
  login_token: string | null;
  registration_ip: string | null;
  registration_date: Generated<Timestamp>;
};
