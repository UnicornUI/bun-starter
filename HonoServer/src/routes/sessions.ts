import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver } from 'hono-openapi/zod';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db, schema } from '../db';

const app = new Hono();

const SessionSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  title: z.string(),
  agentId: z.string(),
  data: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateSessionSchema = z.object({
  title: z.string().min(1),
  agentId: z.string().min(1),
  data: z.string().optional(),
  parentId: z.number().optional(),
});

const UpdateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  data: z.string().optional(),
});

const SessionListQuery = z.object({
  agentId: z.string().optional(),
  parentId: z.string().optional(),
});

app.get(
  '/api/sessions',
  describeRoute({
    summary: 'Get sessions list',
    responses: {
      200: { description: 'Sessions list', content: { 'application/json': { schema: resolver(SessionSchema) } } },
    },
  }),
  zValidator('query', SessionListQuery),
  async (c) => {
    const { agentId, parentId } = c.req.valid('query');
    let result: typeof schema.sessions.$inferSelect[] = [];

    if (agentId && parentId) {
      result = await db.select().from(schema.sessions).where(eq(schema.sessions.agentId, agentId));
      result = result.filter(s => s.parentId === (parentId ? parseInt(parentId) : null));
    } else if (agentId) {
      result = await db.select().from(schema.sessions).where(eq(schema.sessions.agentId, agentId));
    } else if (parentId) {
      result = await db.select().from(schema.sessions).where(eq(schema.sessions.parentId, parseInt(parentId)));
    } else {
      result = await db.select().from(schema.sessions);
    }

    return c.json(result.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() })));
  }
);

app.post(
  '/api/sessions',
  describeRoute({
    summary: 'Create session',
    responses: { 
      201: { 
        description: 'Session created', 
        content: { 'application/json': { schema: resolver(SessionSchema) } } 
      } 
    },
  }),
  zValidator('json', CreateSessionSchema),
  async (c) => {
    const data = c.req.valid('json');
    const [session] = await db
      .insert(schema.sessions)
      .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return c.json({ ...session, createdAt: session.createdAt.toISOString(), updatedAt: session.updatedAt.toISOString() }, 201);
  }
);

app.get(
  '/api/sessions/:id',
  describeRoute({
    summary: 'Get session by id',
    responses: {
      200: { description: 'Session', content: { 'application/json': { schema: resolver(SessionSchema) } } },
      404: { description: 'Not found' },
    },
  }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, parseInt(id))).limit(1);
    if (!session) return c.json({ error: 'Session not found' }, 404);
    return c.json({ ...session, createdAt: session.createdAt.toISOString(), updatedAt: session.updatedAt.toISOString() });
  }
);

app.put(
  '/api/sessions/:id',
  describeRoute({
    summary: 'Update session',
    responses: {
      200: { description: 'Session updated', content: { 'application/json': { schema: resolver(SessionSchema) } } },
      404: { description: 'Not found' },
    },
  }),
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', UpdateSessionSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const [session] = await db.update(schema.sessions).set({ ...data, updatedAt: new Date() }).where(eq(schema.sessions.id, parseInt(id))).returning();
    if (!session) return c.json({ error: 'Session not found' }, 404);
    return c.json({ ...session, createdAt: session.createdAt.toISOString(), updatedAt: session.updatedAt.toISOString() });
  }
);

app.delete(
  '/api/sessions/:id',
  describeRoute({ summary: 'Delete session', responses: { 200: { description: 'Deleted' } } }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    await db.delete(schema.sessions).where(eq(schema.sessions.id, parseInt(id)));
    return c.json({ success: true });
  }
);

app.get(
  '/api/sessions/:id/children',
  describeRoute({
    summary: 'Get sub-sessions',
    responses: { 200: { description: 'Sub-sessions', content: { 'application/json': { schema: resolver(z.array(SessionSchema)) } } } },
  }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const result = await db.select().from(schema.sessions).where(eq(schema.sessions.parentId, parseInt(id)));
    return c.json(result.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() })));
  }
);

app.post(
  '/api/sessions/:id/children',
  describeRoute({
    summary: 'Create sub-session',
    responses: { 201: { description: 'Sub-session created', content: { 'application/json': { schema: resolver(SessionSchema) } } } },
  }),
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', CreateSessionSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const [session] = await db.insert(schema.sessions).values({ ...data, parentId: parseInt(id), createdAt: new Date(), updatedAt: new Date() }).returning();
    return c.json({ ...session, createdAt: session.createdAt.toISOString(), updatedAt: session.updatedAt.toISOString() }, 201);
  }
);

export default app;
