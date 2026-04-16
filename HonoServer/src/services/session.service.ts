import { eq, and } from "drizzle-orm";
import { db, schema } from "../db";
import { Context, Layer, Effect } from "effect";

// Types
type SessionRow = typeof schema.sessions.$inferSelect;

export interface SessionNotFoundError {
  readonly _tag: "SessionNotFoundError";
  readonly id: number;
}

export interface ValidationError {
  readonly _tag: "ValidationError";
  readonly message: string;
}

// ============================================
// Session Service Interface
// ============================================

export interface SessionOutput {
  id: number;
  parentId: number | null;
  title: string;
  agentId: string;
  data: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionInput {
  title: string;
  agentId: string;
  data?: string;
  parentId?: number;
}

export interface UpdateSessionInput {
  title?: string;
  data?: string;
}

export interface ISessionService {
  readonly findAll: (params: { agentId?: string; parentId?: string }) => Effect.Effect<SessionOutput[]>;
  readonly findById: (id: number) => Effect.Effect<SessionOutput, SessionNotFoundError>;
  readonly findChildren: (parentId: number) => Effect.Effect<SessionOutput[]>;
  readonly create: (data: CreateSessionInput) => Effect.Effect<SessionOutput, ValidationError>;
  readonly update: (id: number, data: UpdateSessionInput) => Effect.Effect<SessionOutput, SessionNotFoundError | ValidationError>;
  readonly delete: (id: number) => Effect.Effect<void, SessionNotFoundError>;
}

// ============================================
// Helpers
// ============================================

const serializeSession = (row: SessionRow): SessionOutput => ({
  id: row.id!,
  parentId: row.parentId,
  title: row.title,
  agentId: row.agentId,
  data: row.data,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const serializeSessions = (rows: SessionRow[]): SessionOutput[] =>
  rows.map(serializeSession);

// ============================================
// Session Service Implementation
// ============================================
export class SessionSevice extends Context.Service<SessionSevice, ISessionService>() ("SessionSevice") {}

export const SessionServiceLive = Layer.effect(
  SessionSevice,
  Effect.gen(function* () {
    const findAll = ({ agentId, parentId }: { agentId?: string; parentId?: string }) => 
      Effect.gen(function* () {
        let rows: SessionRow[];
        
        if (agentId && parentId) {
          rows = yield* Effect.promise(() =>  
            db.select().from(schema.sessions).where(and(
              eq(schema.sessions.agentId, agentId), 
              eq(schema.sessions.parentId, parseInt(parentId))
            ))
          );
        } else if (agentId) {
          rows = yield* Effect.promise(() => 
            db.select().from(schema.sessions).where(eq(schema.sessions.agentId, agentId))
          );
        } else if (parentId) {
          rows = yield* Effect.promise(() => 
            db.select().from(schema.sessions).where(eq(schema.sessions.parentId, parseInt(parentId)))
          );
        } else {
          rows = yield* Effect.promise(() => 
            db.select().from(schema.sessions)
          );
        }
        return serializeSessions(rows);
    });

    const findById = (id: number) => 
      Effect.gen(function* (){
        const [rows]= yield* Effect.promise(() => 
          db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1)
        );
        
        if (rows) {
          return yield* Effect.fail({ _tag: "SessionNotFoundError", id } as SessionNotFoundError);
        }
        
        return serializeSession(rows!);
      });

    const findChildren = (parentId: number) => 
      Effect.gen(function* (){
        const rows = yield* Effect.promise(() => 
          db.select().from(schema.sessions).where(eq(schema.sessions.parentId, parentId))
        );
        return serializeSessions(rows);
      });

    const create = (data: CreateSessionInput) => 
      Effect.gen(function*() {
        if (!data.title?.trim()) {
          return yield* Effect.fail({ _tag: "ValidationError", message: "Title is required" } as ValidationError);
        }
        if (!data.agentId) {
          return yield* Effect.fail({ _tag: "ValidationError", message: "AgentId is required" } as ValidationError);
        }

        const [rows] = yield* Effect.promise(() => 
          db.insert(schema.sessions).values({
            title: data.title,
            agentId: data.agentId,
            data: data.data ?? null,
            parentId: data.parentId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning()
        );

        return serializeSession(rows!);
      });

    const update = (id: number, data: UpdateSessionInput) => 
      Effect.gen(function* () {
       yield* findById(id)
        
        const [updated] = yield* Effect.promise(() =>
          db.update(schema.sessions)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.sessions.id, id))
            .returning()
        );
        
        return serializeSession(updated!);
      });

    const remove = (id: number) => 
      Effect.gen(function* (){
        yield* findById(id)
        
        yield* Effect.promise(() => db.delete(schema.sessions).where(eq(schema.sessions.id, id)));
      });

    return SessionSevice.of({
      findAll,
      findById,
      findChildren,
      create,
      update,
      delete: remove
    });
}));


