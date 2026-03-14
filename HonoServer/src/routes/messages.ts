import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver } from 'hono-openapi/zod';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db, schema } from '../db';

const app = new Hono();

const MessageSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  subSessionId: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  data: z.string().nullable(),
  createdAt: z.string(),
});

const CreateMessageSchema = z.object({
  subSessionId: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  data: z.string().optional(),
  parentId: z.number().optional(),
});

const UpdateMessageSchema = z.object({
  content: z.string().optional(),
  data: z.string().optional(),
});

const MessageQuery = z.object({
  subSessionId: z.string().optional(),
  parentId: z.string().optional(),
});

app.get(
  '/api/messages',
  describeRoute({
    summary: 'Get messages',
    responses: { 200: { description: 'Messages list', content: { 'application/json': { schema: resolver(z.array(MessageSchema)) } } } },
  }),
  zValidator('query', MessageQuery),
  async (c) => {
    const { subSessionId, parentId } = c.req.valid('query');
    let result: typeof schema.messages.$inferSelect[] = [];

    if (subSessionId) {
      result = await db.select().from(schema.messages).where(eq(schema.messages.subSessionId, parseInt(subSessionId)));
    } else if (parentId) {
      result = await db.select().from(schema.messages).where(eq(schema.messages.parentId, parseInt(parentId)));
    } else {
      result = await db.select().from(schema.messages);
    }
    return c.json(result.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  }
);

app.post(
  '/api/messages',
  describeRoute({
    summary: 'Create message',
    responses: { 201: { description: 'Message created', content: { 'application/json': { schema: resolver(MessageSchema) } } } },
  }),
  zValidator('json', CreateMessageSchema),
  async (c) => {
    const data = c.req.valid('json');
    const [message] = await db.insert(schema.messages).values({ ...data, createdAt: new Date() }).returning();
    return c.json({ ...message, createdAt: message.createdAt.toISOString() }, 201);
  }
);

app.get(
  '/api/messages/:id',
  describeRoute({
    summary: 'Get message by id',
    responses: {
      200: { description: 'Message', content: { 'application/json': { schema: resolver(MessageSchema) } } },
      404: { description: 'Not found' },
    },
  }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const [message] = await db.select().from(schema.messages).where(eq(schema.messages.id, parseInt(id))).limit(1);
    if (!message) return c.json({ error: 'Message not found' }, 404);
    return c.json({ ...message, createdAt: message.createdAt.toISOString() });
  }
);

app.put(
  '/api/messages/:id',
  describeRoute({
    summary: 'Update message',
    responses: {
      200: { description: 'Message updated', content: { 'application/json': { schema: resolver(MessageSchema) } } },
      404: { description: 'Not found' },
    },
  }),
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', UpdateMessageSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const [message] = await db.update(schema.messages).set(data).where(eq(schema.messages.id, parseInt(id))).returning();
    if (!message) return c.json({ error: 'Message not found' }, 404);
    return c.json({ ...message, createdAt: message.createdAt.toISOString() });
  }
);

app.delete(
  '/api/messages/:id',
  describeRoute({ summary: 'Delete message', responses: { 200: { description: 'Deleted' } } }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    await db.delete(schema.messages).where(eq(schema.messages.id, parseInt(id)));
    return c.json({ success: true });
  }
);

app.get(
  '/api/messages/:id/replies',
  describeRoute({
    summary: 'Get replies',
    responses: { 200: { description: 'Replies list', content: { 'application/json': { schema: resolver(z.array(MessageSchema)) } } } },
  }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const result = await db.select().from(schema.messages).where(eq(schema.messages.parentId, parseInt(id)));
    return c.json(result.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  }
);

app.post(
  '/api/messages/:id/replies',
  describeRoute({
    summary: 'Create reply',
    responses: { 201: { description: 'Reply created', content: { 'application/json': { schema: resolver(MessageSchema) } } } },
  }),
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', CreateMessageSchema.omit({ parentId: true })),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const [message] = await db.insert(schema.messages).values({ ...data, parentId: parseInt(id), createdAt: new Date() }).returning();
    return c.json({ ...message, createdAt: message.createdAt.toISOString() }, 201);
  }
);

export default app;
