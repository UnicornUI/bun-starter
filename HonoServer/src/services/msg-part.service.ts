import { eq } from "drizzle-orm";
import { db, schema } from "../db";

// ============================================
// 1. Types
// ============================================

type MsgPartRow = typeof schema.msgParts.$inferSelect;

interface MsgPartNotFoundError {
  readonly _tag: "MsgPartNotFoundError";
  readonly id: number;
}

interface ValidationError {
  readonly _tag: "ValidationError";
  readonly message: string;
}

// ============================================
// 2. MsgPart Service Interface
// ============================================

interface MsgPartOutput {
  id: number;
  messageId: number;
  type: string;
  content: string | null;
  metadata: string | null;
  endTime: string | null;
  createdAt: string;
}

interface CreateMsgPartInput {
  type: string;
  content?: string;
  metadata?: string;
  endTime?: string;
}

interface UpdateMsgPartInput {
  type?: string;
  content?: string;
  metadata?: string;
  endTime?: string;
}

interface IMsgPartService {
  readonly findByMessageId: (messageId: number) => Promise<MsgPartOutput[]>;
  readonly findById: (id: number) => Promise<MsgPartOutput>;
  readonly create: (messageId: number, data: CreateMsgPartInput) => Promise<MsgPartOutput>;
  readonly update: (id: number, data: UpdateMsgPartInput) => Promise<MsgPartOutput>;
  readonly delete: (id: number) => Promise<void>;
}

// ============================================
// 3. Helper Functions
// ============================================

const serializeMsgPart = (row: MsgPartRow): MsgPartOutput => ({
  id: row.id!,
  messageId: row.messageId,
  type: row.type,
  content: row.content,
  metadata: row.metadata,
  endTime: row.endTime?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

const serializeMsgParts = (rows: MsgPartRow[]): MsgPartOutput[] =>
  rows.map(serializeMsgPart);

// ============================================
// 4. MsgPart Service Implementation
// ============================================

const createMsgPartService = (): IMsgPartService => {
  const findByMessageId = async (messageId: number): Promise<MsgPartOutput[]> => {
    const rows = await db.select().from(schema.msgParts).where(eq(schema.msgParts.messageId, messageId));
    return serializeMsgParts(rows);
  };

  const findById = async (id: number): Promise<MsgPartOutput> => {
    const rows = await db.select().from(schema.msgParts).where(eq(schema.msgParts.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "MsgPartNotFoundError", id } as MsgPartNotFoundError;
    }
    
    return serializeMsgPart(rows[0]);
  };

  const create = async (messageId: number, data: CreateMsgPartInput): Promise<MsgPartOutput> => {
    if (!data.type || data.type.trim().length === 0) {
      throw { _tag: "ValidationError", message: "Type is required" } as ValidationError;
    }

    const rows = await db.insert(schema.msgParts).values({
      messageId,
      type: data.type,
      content: data.content ?? null,
      metadata: data.metadata ?? null,
      endTime: data.endTime ? new Date(data.endTime) : null,
      createdAt: new Date(),
    }).returning();

    return serializeMsgPart(rows[0]);
  };

  const update = async (id: number, data: UpdateMsgPartInput): Promise<MsgPartOutput> => {
    const rows = await db.select().from(schema.msgParts).where(eq(schema.msgParts.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "MsgPartNotFoundError", id } as MsgPartNotFoundError;
    }
    
    const updated = await db.update(schema.msgParts)
      .set({
        ...data,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      })
      .where(eq(schema.msgParts.id, id))
      .returning();
    
    return serializeMsgPart(updated[0]);
  };

  const remove = async (id: number): Promise<void> => {
    const rows = await db.select().from(schema.msgParts).where(eq(schema.msgParts.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "MsgPartNotFoundError", id } as MsgPartNotFoundError;
    }
    
    await db.delete(schema.msgParts).where(eq(schema.msgParts.id, id)).run();
  };

  return { findByMessageId, findById, create, update, delete: remove } as IMsgPartService;
};

// Create and export the msg part service instance
const msgPartServiceInstance = createMsgPartService();

// ============================================
// 5. Exports
// ============================================

export {
  msgPartServiceInstance,
  createMsgPartService,
  type IMsgPartService,
  type MsgPartOutput,
  type CreateMsgPartInput,
  type UpdateMsgPartInput,
  type MsgPartNotFoundError,
  type ValidationError,
};