import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver } from 'hono-openapi/zod';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db, schema } from '../db';

const app = new Hono();

const MsgPartSchema = z.object({
  id: z.number(),
  messageId: z.number(),
  type: z.string(),
  content: z.string().nullable(),
  metadata: z.string().nullable(),
  endTime: z.string().nullable(),
  createdAt: z.string(),
});

const CreateMsgPartSchema = z.object({
  type: z.string().min(1),
  content: z.string().optional(),
  metadata: z.string().optional(),
  endTime: z.string().optional(),
});

const UpdateMsgPartSchema = z.object({
  type: z.string().min(1).optional(),
  content: z.string().optional(),
  metadata: z.string().optional(),
  endTime: z.string().optional(),
});

app.get(
  '/api/parts/message/:messageId',
  describeRoute({
    summary: 'Get msg parts by message id',
    responses: { 200: { description: 'Msg parts list', content: { 'application/json': { schema: resolver(z.array(MsgPartSchema)) } } } },
  }),
  zValidator('param', z.object({ messageId: z.string() })),
  async (c) => {
    const { messageId } = c.req.valid('param');
    const result = await db.select().from(schema.msgParts).where(eq(schema.msgParts.messageId, parseInt(messageId)));
    return c.json(result.map(p => ({
      ...p,
      endTime: p.endTime?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })));
  }
);

app.post(
  '/api/parts/message/:messageId',
  describeRoute({
    summary: 'Create msg part',
    responses: { 201: { description: 'Msg part created', content: { 'application/json': { schema: resolver(MsgPartSchema) } } } },
  }),
  zValidator('param', z.object({ messageId: z.string() })),
  zValidator('json', CreateMsgPartSchema),
  async (c) => {
    const { messageId } = c.req.valid('param');
    const data = c.req.valid('json');
    const [msgPart] = await db.insert(schema.msgParts).values({
      messageId: parseInt(messageId),
      ...data,
      endTime: data.endTime ? new Date(data.endTime) : null,
      createdAt: new Date(),
    }).returning();
    return c.json({
      ...msgPart,
      endTime: msgPart.endTime?.toISOString() ?? null,
      createdAt: msgPart.createdAt.toISOString(),
    }, 201);
  }
);

app.get(
  '/api/parts/:id',
  describeRoute({
    summary: 'Get msg part by id',
    responses: {
      200: { description: 'Msg part', content: { 'application/json': { schema: resolver(MsgPartSchema) } } },
      404: { description: 'Not found' },
    },
  }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const [msgPart] = await db.select().from(schema.msgParts).where(eq(schema.msgParts.id, parseInt(id))).limit(1);
    if (!msgPart) return c.json({ error: 'MsgPart not found' }, 404);
    return c.json({
      ...msgPart,
      endTime: msgPart.endTime?.toISOString() ?? null,
      createdAt: msgPart.createdAt.toISOString(),
    });
  }
);

app.put(
  '/api/parts/:id',
  describeRoute({
    summary: 'Update msg part',
    responses: {
      200: { description: 'Msg part updated', content: { 'application/json': { schema: resolver(MsgPartSchema) } } },
      404: { description: 'Not found' },
    },
  }),
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', UpdateMsgPartSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const [msgPart] = await db.update(schema.msgParts).set({
      ...data,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
    }).where(eq(schema.msgParts.id, parseInt(id))).returning();
    if (!msgPart) return c.json({ error: 'MsgPart not found' }, 404);
    return c.json({
      ...msgPart,
      endTime: msgPart.endTime?.toISOString() ?? null,
      createdAt: msgPart.createdAt.toISOString(),
    });
  }
);

app.delete(
  '/api/parts/:id',
  describeRoute({ summary: 'Delete msg part', responses: { 200: { description: 'Deleted' } } }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    await db.delete(schema.msgParts).where(eq(schema.msgParts.id, parseInt(id)));
    return c.json({ success: true });
  }
);

export default app;
