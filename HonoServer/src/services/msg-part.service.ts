import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { Effect, Context, Layer } from "effect";

// ============================================
// 1. Types
// ============================================

export type MsgPartRow = typeof schema.msgParts.$inferSelect;

export interface MsgPartNotFoundError {
  readonly _tag: "MsgPartNotFoundError";
  readonly id: number;
}

export interface ValidationError {
  readonly _tag: "ValidationError";
  readonly message: string;
}

// ============================================
// 2. MsgPart Service Interface
// ============================================

export interface MsgPartOutput {
  id: number;
  messageId: number;
  type: string;
  content: string | null;
  metadata: string | null;
  endTime: string | null;
  createdAt: string;
}

export interface CreateMsgPartInput {
  type: string;
  content?: string;
  metadata?: string;
  endTime?: string;
}

export interface UpdateMsgPartInput {
  type?: string;
  content?: string;
  metadata?: string;
  endTime?: string;
}

export interface IMsgPartService {
  readonly findByMessageId: (messageId: number) => Effect.Effect<MsgPartOutput[], MsgPartNotFoundError>;
  readonly findById: (id: number) => Effect.Effect<MsgPartOutput, MsgPartNotFoundError>;
  readonly create: (messageId: number, data: CreateMsgPartInput) => Effect.Effect<MsgPartOutput, ValidationError>;
  readonly update: (id: number, data: UpdateMsgPartInput) => Effect.Effect<MsgPartOutput, MsgPartNotFoundError | ValidationError>;
  readonly delete: (id: number) => Effect.Effect<void, MsgPartNotFoundError>;
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

export class MsgPartService extends Context.Service<MsgPartService, IMsgPartService>() ("MsgPartService") {}

export const MsgPartServiceLive = Layer.effect(
  MsgPartService,
  Effect.gen(function* (){
    const findByMessageId = (messageId: number) => 
      Effect.gen(function* (){
        const rows = yield* Effect.promise(() =>
          db.select().from(schema.msgParts).where(eq(schema.msgParts.messageId, messageId))
        );
        return serializeMsgParts(rows);
      });

    const findById = (id: number) => 
      Effect.gen(function* () {
        const rows = yield* Effect.promise(() => 
          db.select().from(schema.msgParts).where(eq(schema.msgParts.id, id)).limit(1)
        );
      
        if (rows.length === 0) {
          return yield* Effect.fail({ _tag: "MsgPartNotFoundError", id } as MsgPartNotFoundError);
        }
      
        return serializeMsgPart(rows[0]!);
      });

    const create = (messageId: number, data: CreateMsgPartInput) => 
      Effect.gen(function*(){
        if (!data.type || data.type.trim().length === 0) {
          return yield* Effect.fail({ _tag: "ValidationError", message: "Type is required" } as ValidationError);
        }

        const [rows] = yield* Effect.promise(() => 
          db.insert(schema.msgParts).values({
            messageId,
            type: data.type,
            content: data.content ?? null,
            metadata: data.metadata ?? null,
            endTime: data.endTime ? new Date(data.endTime) : null,
            createdAt: new Date(),
          }).returning()
        );
        return serializeMsgPart(rows!);
      });

    const update = (id: number, data: UpdateMsgPartInput) => 
      Effect.gen(function *() {
        yield* findById(id)
        const [updated] = yield* Effect.promise(() => 
          db.update(schema.msgParts)
            .set({
              ...data,
              endTime: data.endTime ? new Date(data.endTime) : undefined,
            })
            .where(eq(schema.msgParts.id, id))
            .returning());
        
        return serializeMsgPart(updated!);
      });

    const remove = (id: number) => 
      Effect.gen(function* () {
        yield* findById(id);
        yield* Effect.promise(() => db.delete(schema.msgParts).where(eq(schema.msgParts.id, id)));
      });

  return MsgPartService.of({
    findByMessageId,
    findById,
    create,
    update,
    delete:remove
  });
}));

