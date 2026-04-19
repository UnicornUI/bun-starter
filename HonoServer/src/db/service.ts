import { Context, Effect, Layer } from "effect";
import type { BunSQLiteDatabase as DrizzleDatabase } from "drizzle-orm/bun-sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite"
import { initializeDatabase } from "./init";
import { Database as BunSQLite }   from "bun:sqlite"
import * as schema from "./schema";

// 数据库文件
export const sqlite = new BunSQLite("./data/database.sqlite");

export class Database extends Context.Service<Database, IDatabase>()("Database") {}

export type DatabaseError =
  | { _tag: "ConnectionError"; message: string }
  | { _tag: "QueryError"; message: string; query?: string }
  | { _tag: "TransactionError"; message: string };

export interface IDatabase {
  readonly db: DrizzleDatabase<typeof schema>;
  readonly schema: typeof schema;
  readonly initialize: () => Effect.Effect<void>;
  readonly close: () => Effect.Effect<void>;
}

export const DatabaseLive = Layer.effect(
  Database,
  Effect.acquireRelease(
    Effect.gen(function* () {

      initializeDatabase(sqlite);
      const db = drizzle(sqlite, { schema });

      return Database.of({
        db,
        schema,
        initialize: () => Effect.sync(() => initializeDatabase(sqlite)),
        close: () => Effect.sync(() => sqlite.close()),
      });
    }),
    (dbService) => Effect.sync(() => dbService.close())
  )
);

