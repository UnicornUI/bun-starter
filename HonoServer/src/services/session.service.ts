import { eq, and } from "drizzle-orm";
import { db, schema } from "../db";

// Types
type SessionRow = typeof schema.sessions.$inferSelect;

interface SessionNotFoundError {
  readonly _tag: "SessionNotFoundError";
  readonly id: number;
}

interface ValidationError {
  readonly _tag: "ValidationError";
  readonly message: string;
}

// ============================================
// Session Service Interface
// ============================================

interface SessionOutput {
  id: number;
  parentId: number | null;
  title: string;
  agentId: string;
  data: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateSessionInput {
  title: string;
  agentId: string;
  data?: string;
  parentId?: number;
}

interface UpdateSessionInput {
  title?: string;
  data?: string;
}

interface ISessionService {
  readonly findAll: (params: { agentId?: string; parentId?: string }) => Promise<SessionOutput[]>;
  readonly findById: (id: number) => Promise<SessionOutput>;
  readonly findChildren: (parentId: number) => Promise<SessionOutput[]>;
  readonly create: (data: CreateSessionInput) => Promise<SessionOutput>;
  readonly update: (id: number, data: UpdateSessionInput) => Promise<SessionOutput>;
  readonly delete: (id: number) => Promise<void>;
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

const createSessionService = (): ISessionService => {
  const findAll = async ({ agentId, parentId }: { agentId?: string; parentId?: string }): Promise<SessionOutput[]> => {
    let rows: SessionRow[];
    
    if (agentId && parentId) {
      rows = await db.select().from(schema.sessions).where(
        and(eq(schema.sessions.agentId, agentId), eq(schema.sessions.parentId, parseInt(parentId)))
      );
    } else if (agentId) {
      rows = await db.select().from(schema.sessions).where(eq(schema.sessions.agentId, agentId));
    } else if (parentId) {
      rows = await db.select().from(schema.sessions).where(eq(schema.sessions.parentId, parseInt(parentId)));
    } else {
      rows = await db.select().from(schema.sessions).all();
    }
    
    return serializeSessions(rows);
  };

  const findById = async (id: number): Promise<SessionOutput> => {
    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "SessionNotFoundError", id } as SessionNotFoundError;
    }
    
    return serializeSession(rows[0]);
  };

  const findChildren = async (parentId: number): Promise<SessionOutput[]> => {
    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.parentId, parentId));
    return serializeSessions(rows);
  };

  const create = async (data: CreateSessionInput): Promise<SessionOutput> => {
    if (!data.title?.trim()) {
      throw { _tag: "ValidationError", message: "Title is required" } as ValidationError;
    }
    if (!data.agentId) {
      throw { _tag: "ValidationError", message: "AgentId is required" } as ValidationError;
    }

    const rows = await db.insert(schema.sessions).values({
      title: data.title,
      agentId: data.agentId,
      data: data.data ?? null,
      parentId: data.parentId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return serializeSession(rows[0]);
  };

  const update = async (id: number, data: UpdateSessionInput): Promise<SessionOutput> => {
    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "SessionNotFoundError", id } as SessionNotFoundError;
    }
    
    const updated = await db.update(schema.sessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.sessions.id, id))
      .returning();
    
    return serializeSession(updated[0]);
  };

  const remove = async (id: number): Promise<void> => {
    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "SessionNotFoundError", id } as SessionNotFoundError;
    }
    
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run();
  };

  return { findAll, findById, findChildren, create, update, delete: remove } as ISessionService;
};

// Create and export the session service instance
const sessionServiceInstance = createSessionService();

// Exports
export {
  sessionServiceInstance,
  createSessionService,
  type ISessionService,
  type SessionOutput,
  type CreateSessionInput,
  type UpdateSessionInput,
  type SessionNotFoundError,
  type ValidationError,
};