import { eq, and } from "drizzle-orm";
import { Context, Layer, Effect } from "effect";
import { Database } from "../db/service";
import type { Session as SessionRow } from "../db/schema";
import {
  SessionNotFoundError,
  ValidationError,
  SessionValidationError,
} from "../errors";

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

type SessionError = SessionNotFoundError | SessionValidationError | ValidationError;

export interface ISessionService {
  readonly findAll: (params: { agentId?: string; parentId?: string }) => Effect.Effect<SessionOutput[]>;
  readonly findById: (id: number) => Effect.Effect<SessionOutput, SessionNotFoundError>;
  readonly findChildren: (parentId: number) => Effect.Effect<SessionOutput[]>;
  readonly create: (data: CreateSessionInput) => Effect.Effect<SessionOutput, SessionValidationError | ValidationError>;
  readonly update: (id: number, data: UpdateSessionInput) => Effect.Effect<SessionOutput, SessionError>;
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
export class SessionService extends Context.Service<SessionService, ISessionService>() ("SessionSevice") {}

export const SessionServiceLive = Layer.effect(
  SessionService,
  Effect.gen(function* () {
    const { db, schema } = yield* Database;

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
        if (!rows) {
          return yield* Effect.fail(new SessionNotFoundError({ id }));
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
          return yield* Effect.fail(new SessionValidationError({ 
            field: "title", 
            message: "Title is required" 
          }));
        }
        if (!data.agentId) {
          return yield* Effect.fail(new SessionValidationError({ 
            field: "agentId", 
            message: "AgentId is required" 
          }));
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

    return SessionService.of({
      findAll,
      findById,
      findChildren,
      create,
      update,
      delete: remove
    });
}));


