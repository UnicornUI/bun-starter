import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { Effect, Context, Layer } from "effect";
import { MsgPartNotFoundError, ValidationError } from "../errors";

// ============================================
// 1. Types
// ============================================

export type MsgPartRow = typeof schema.msgParts.$inferSelect;

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

type MsgPartError = MsgPartNotFoundError | ValidationError;

export interface IMsgPartService {
  readonly findByMessageId: (messageId: number) => Effect.Effect<MsgPartOutput[], MsgPartNotFoundError>;
  readonly findById: (id: number) => Effect.Effect<MsgPartOutput, MsgPartNotFoundError>;
  readonly create: (messageId: number, data: CreateMsgPartInput) => Effect.Effect<MsgPartOutput, ValidationError>;
  readonly update: (id: number, data: UpdateMsgPartInput) => Effect.Effect<MsgPartOutput, MsgPartError>;
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
        const [rows] = yield* Effect.promise(() => 
          db.select().from(schema.msgParts).where(eq(schema.msgParts.id, id)).limit(1)
        );
      
        if (!rows) {
          return yield* Effect.fail(new MsgPartNotFoundError({ id }));
        }
      
        return serializeMsgPart(rows!);
      });

    const create = (messageId: number, data: CreateMsgPartInput) => 
      Effect.gen(function*(){
        if (!data.type || data.type.trim().length === 0) {
          return yield* Effect.fail(new ValidationError({ 
            field: "type", 
            message: "Type is required" 
          }));
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

