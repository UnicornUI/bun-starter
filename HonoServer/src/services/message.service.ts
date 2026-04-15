import { eq } from "drizzle-orm";
import { db, schema } from "../db";

// ============================================
// 1. Types
// ============================================

type MessageRow = typeof schema.messages.$inferSelect;

interface MessageNotFoundError {
  readonly _tag: "MessageNotFoundError";
  readonly id: number;
}

interface ValidationError {
  readonly _tag: "ValidationError";
  readonly message: string;
}

// ============================================
// 2. Message Service Interface
// ============================================

interface MessageOutput {
  id: number;
  parentId: number | null;
  subSessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  data: string | null;
  createdAt: string;
}

interface CreateMessageInput {
  subSessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  data?: string;
  parentId?: number;
}

interface UpdateMessageInput {
  content?: string;
  data?: string;
}

interface MessageQuery {
  subSessionId?: string;
  parentId?: string;
}

interface IMessageService {
  readonly findAll: (params: MessageQuery) => Promise<MessageOutput[]>;
  readonly findById: (id: number) => Promise<MessageOutput>;
  readonly findReplies: (parentId: number) => Promise<MessageOutput[]>;
  readonly create: (data: CreateMessageInput) => Promise<MessageOutput>;
  readonly update: (id: number, data: UpdateMessageInput) => Promise<MessageOutput>;
  readonly delete: (id: number) => Promise<void>;
}

// ============================================
// 3. Helper Functions
// ============================================

const serializeMessage = (row: MessageRow): MessageOutput => ({
  id: row.id!,
  parentId: row.parentId,
  subSessionId: row.subSessionId,
  role: row.role as "user" | "assistant" | "system",
  content: row.content,
  data: row.data,
  createdAt: row.createdAt.toISOString(),
});

const serializeMessages = (rows: MessageRow[]): MessageOutput[] =>
  rows.map(serializeMessage);

// ============================================
// 4. Message Service Implementation
// ============================================

const createMessageService = (): IMessageService => {
  const findAll = async ({ subSessionId, parentId }: MessageQuery): Promise<MessageOutput[]> => {
    let rows: MessageRow[];
    
    if (subSessionId) {
      rows = await db.select().from(schema.messages).where(eq(schema.messages.subSessionId, parseInt(subSessionId)));
    } else if (parentId) {
      rows = await db.select().from(schema.messages).where(eq(schema.messages.parentId, parseInt(parentId)));
    } else {
      rows = await db.select().from(schema.messages).all();
    }
    
    return serializeMessages(rows);
  };

  const findById = async (id: number): Promise<MessageOutput> => {
    const rows = await db.select().from(schema.messages).where(eq(schema.messages.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "MessageNotFoundError", id } as MessageNotFoundError;
    }
    
    return serializeMessage(rows[0]);
  };

  const findReplies = async (parentId: number): Promise<MessageOutput[]> => {
    const rows = await db.select().from(schema.messages).where(eq(schema.messages.parentId, parentId));
    return serializeMessages(rows);
  };

  const create = async (data: CreateMessageInput): Promise<MessageOutput> => {
    if (!data.content || data.content.trim().length === 0) {
      throw { _tag: "ValidationError", message: "Content is required" } as ValidationError;
    }

    const rows = await db.insert(schema.messages).values({
      subSessionId: data.subSessionId,
      role: data.role,
      content: data.content,
      data: data.data ?? null,
      parentId: data.parentId ?? null,
      createdAt: new Date(),
    }).returning();

    return serializeMessage(rows[0]);
  };

  const update = async (id: number, data: UpdateMessageInput): Promise<MessageOutput> => {
    const rows = await db.select().from(schema.messages).where(eq(schema.messages.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "MessageNotFoundError", id } as MessageNotFoundError;
    }
    
    const updated = await db.update(schema.messages)
      .set(data)
      .where(eq(schema.messages.id, id))
      .returning();
    
    return serializeMessage(updated[0]);
  };

  const remove = async (id: number): Promise<void> => {
    const rows = await db.select().from(schema.messages).where(eq(schema.messages.id, id)).limit(1);
    
    if (rows.length === 0) {
      throw { _tag: "MessageNotFoundError", id } as MessageNotFoundError;
    }
    
    await db.delete(schema.messages).where(eq(schema.messages.id, id)).run();
  };

  return { findAll, findById, findReplies, create, update, delete: remove } as IMessageService;
};

// Create and export the message service instance
const messageServiceInstance = createMessageService();

// ============================================
// 5. Exports
// ============================================

export {
  messageServiceInstance,
  createMessageService,
  type IMessageService,
  type MessageOutput,
  type CreateMessageInput,
  type UpdateMessageInput,
  type MessageQuery,
  type MessageNotFoundError,
  type ValidationError,
};