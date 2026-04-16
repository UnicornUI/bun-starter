import { Console, Effect, Context, Layer } from "effect";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

type Session = typeof schema.sessions.$inferSelect;
type NewSession = Omit<typeof schema.sessions.$inferInsert, "createdAt" | "updatedAt">;
type UpdateSession = Partial<Pick<NewSession, "title" | "data">>;

interface SessionNotFoundError {
  readonly _tag: "SessionNotFoundError";
  readonly id: number;
}
interface ValidationError {
  readonly _tag: "ValidationError";
  readonly message: string;
}

interface ISessionService {
  readonly findAll: () => Effect.Effect<Session[]>;
  readonly findById: (id: number) => Effect.Effect<Session, SessionNotFoundError>;
  readonly create: (data: NewSession) => Effect.Effect<Session, ValidationError>;
  readonly update: (id: number, data: UpdateSession) => Effect.Effect<Session, SessionNotFoundError | ValidationError>;
  readonly remove: (id: number) => Effect.Effect<void, SessionNotFoundError>;
  readonly findChildren: (parentId: number) => Effect.Effect<Session[]>;
}

export class SessionService extends Context.Service<SessionService, ISessionService>()("SessionService"){};

interface IConfigService {
  readonly defaultAgentId: string;
  readonly maxTitleLength: number;
}

export class ConfigService extends Context.Service<IConfigService, IConfigService>()("ConfigService") {};

const SessionServiceLive = Layer.effect(
  SessionService,
  Effect.gen(function* () {
    const findAll = () =>
      Effect.promise(() => db.select().from(schema.sessions));

    const findById = (id: number) =>
      Effect.gen(function* () {
        const result = yield* Effect.promise(() =>
          db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1)
        );
        if (result.length === 0) {
          return yield* Effect.fail({ _tag: "SessionNotFoundError", id } as SessionNotFoundError);
        }
        return result[0]!;
      });

    const create = (data: NewSession) =>
      Effect.gen(function* () {
        if (!data.title || data.title.trim().length === 0) {
          return yield* Effect.fail({ _tag: "ValidationError", message: "Title is required" } as ValidationError);
        }
        if (!data.agentId) {
          return yield* Effect.fail({ _tag: "ValidationError", message: "AgentId is required" } as ValidationError);
        }
        const [session] = yield* Effect.promise(() =>
          db.insert(schema.sessions).values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning()
        );
        return session!;
      });

    const update = (id: number, data: UpdateSession) =>
      Effect.gen(function* () {
        yield* findById(id);
        const [updated] = yield* Effect.promise(() =>
          db.update(schema.sessions)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.sessions.id, id))
            .returning()
        );
        return updated!;
      });

    const remove = (id: number) =>
      Effect.gen(function* () {
        yield* findById(id);
        yield* Effect.promise(() =>
          db.delete(schema.sessions).where(eq(schema.sessions.id, id))
        );
      });

    const findChildren = (parentId: number) =>
      Effect.promise(() =>
        db.select().from(schema.sessions).where(eq(schema.sessions.parentId, parentId))
      );

    return SessionService.of({
      findAll,
      findById,
      create,
      update,
      remove,
      findChildren,
    })
  })
);

const ConfigServiceLive = Layer.effect(
  ConfigService,
  Effect.gen(function* () {
    return ConfigService.of({
      defaultAgentId: "default-agent",
      maxTitleLength: 200,
    })
  })
);

const AllLayers = Layer.provideMerge(SessionServiceLive, ConfigServiceLive);

const program = Effect.gen(function* () {
  const sessionService = yield* SessionService;
  const config = yield* ConfigService;

  yield* Console.log("\n" + "=".repeat(50));
  yield* Console.log("Effect Framework - SessionService 演示");
  yield* Console.log("=".repeat(50));

  yield* Console.log("\n[1] 创建新会话...");
  const newSession = yield* sessionService.create({
    title: "Demo Session",
    agentId: "agent-001",
  });
  yield* Console.log(`    创建成功: id=${newSession.id}, title=${newSession.title}`);

  yield* Console.log("\n[2] 查询会话...");
  const session = yield* sessionService.findById(newSession.id!);
  yield* Console.log(`    查询结果: id=${session.id}, title=${session.title}`);

  yield* Console.log("\n[3] 更新会话...");
  const updated = yield* sessionService.update(newSession.id!, { title: "Updated Title" });
  yield* Console.log(`    更新成功: id=${updated.id}, title=${updated.title}`);

  yield* Console.log("\n[4] 测试错误处理 - 查询不存在的会话...");
  const errorResult = yield* sessionService.findById(99999).pipe(
    Effect.catchTag("SessionNotFoundError", (e) =>
      Effect.succeed({ caught: true, id: e.id } as const)
    )
  );
  if ("caught" in errorResult) {
    yield* Console.log(`    ✓ 捕获错误: SessionNotFoundError (id=${errorResult.id})`);
  }

  yield* Console.log("\n[5] 使用配置服务...");
  yield* Console.log(`    配置: defaultAgentId="${config.defaultAgentId}", maxTitleLength=${config.maxTitleLength}`);

  yield* Console.log("\n[6] 删除会话...");
  yield* sessionService.remove(newSession.id!);
  yield* Console.log("    ✓ 删除成功");

  yield* Console.log("\n" + "=".repeat(50));
  yield* Console.log("演示完成!");
  yield* Console.log("=".repeat(50));
});

const main = program.pipe(Effect.provide(AllLayers));

Effect.runPromise(main);
