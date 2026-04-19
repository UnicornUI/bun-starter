import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { Database } from "../db/service";
import { MessageNotFoundError, ValidationError } from "../errors";
import type { Message as MessageRow } from "../db/schema";

// ============================================
// 2. Message Service Interface
// ============================================

export interface MessageOutput {
  id: number;
  parentId: number | null;
  subSessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  data: string | null;
  createdAt: string;
}

export interface CreateMessageInput {
  subSessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  data?: string;
  parentId?: number;
}

export interface UpdateMessageInput {
  content?: string;
  data?: string;
}

export interface MessageQuery {
  subSessionId?: string;
  parentId?: string;
}


export interface IMessageService {
  readonly findAll: (params: MessageQuery) => Effect.Effect<MessageOutput[]>;
  readonly findById: (id: number) => Effect.Effect<MessageOutput, MessageNotFoundError>;
  readonly findReplies: (parentId: number) => Effect.Effect<MessageOutput[]>;
  readonly create: (data: CreateMessageInput) => Effect.Effect<MessageOutput, ValidationError>;
  readonly update: (id: number, data: UpdateMessageInput) => Effect.Effect<MessageOutput, MessageNotFoundError | ValidationError>;
  readonly delete: (id: number) => Effect.Effect<void, MessageNotFoundError>;
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
export class MessageService extends Context.Service<MessageService, IMessageService>()("MessageService"){}

export const MessageServiceLive = Layer.effect(
  MessageService,
  Effect.gen(function* () {
    const { db, schema } = yield* Database;

    const findAll = ({ subSessionId, parentId }: MessageQuery) => 
      Effect.gen(function* () {
        let rows: MessageRow[];
        
        if (subSessionId) {
          rows = yield* Effect.promise(() => 
            db.select().from(schema.messages).where(eq(schema.messages.subSessionId, parseInt(subSessionId)))
          );
        } else if (parentId) {
          rows = yield* Effect.promise(() => 
            db.select().from(schema.messages).where(eq(schema.messages.parentId, parseInt(parentId)))
          );
        } else {
          rows = yield* Effect.promise(() =>
            db.select().from(schema.messages)
          );
        }
        return serializeMessages(rows);
      });

    const findById = (id: number)=> 
      Effect.gen(function* () {
        const [rows] = yield* Effect.promise(() => 
          db.select().from(schema.messages).where(eq(schema.messages.id, id)).limit(1)
        );
        if (!rows) {
          return yield* Effect.fail(new MessageNotFoundError({ id }));
        }
        return serializeMessage(rows!);
      });

    const findReplies = (parentId: number) => 
      Effect.gen(function* (){
        const rows = yield* Effect.promise(() => 
          db.select().from(schema.messages).where(eq(schema.messages.parentId, parentId))
        );
        return serializeMessages(rows);
      });

    const create = (data: CreateMessageInput) => 
      Effect.gen(function* () {

        if (!data.content || data.content.trim().length === 0) {
          return yield* Effect.fail(new ValidationError({ 
            field: "content", 
            message: "Content is required" 
          }));
        }

        const [message] = yield* Effect.promise(() =>  
          db.insert(schema.messages).values({
            subSessionId: data.subSessionId,
            role: data.role,
            content: data.content,
            data: data.data ?? null,
            parentId: data.parentId ?? null,
            createdAt: new Date(),
          }).returning()
        );
        return serializeMessage(message!);
      });

    const update = (id: number, data: UpdateMessageInput) => 
      Effect.gen(function* () {
        yield* findById(id) 
        const [updated] = yield* Effect.promise(() => db.update(schema.messages)
          .set(data)
          .where(eq(schema.messages.id, id))
          .returning())
        
        return serializeMessage(updated!);
      });

    const remove = (id: number) => 
      Effect.gen(function* () {
        yield* findById(id)
        yield* Effect.promise(() => db.delete(schema.messages).where(eq(schema.messages.id, id)));
      });

    return MessageService.of({ 
      findAll, 
      findById, 
      findReplies, 
      create,  
      update, 
      delete: remove 
    });
  }));
