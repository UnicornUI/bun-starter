import { Hono } from 'hono';
import { describeRoute, resolver, validator as zValidator } from 'hono-openapi';
import { z } from 'zod';
import { sessionServiceInstance } from '../services/session.service';

const app = new Hono();

const SessionSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  title: z.string(),
  agentId: z.string(),
  data: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).meta({ id: 'Session' });

const CreateSessionSchema = z.object({
  title: z.string().min(1),
  agentId: z.string().min(1),
  data: z.string().optional(),
  parentId: z.number().optional(),
}).meta({ id: 'CreateSession' });

const UpdateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  data: z.string().optional(),
}).meta({ id: 'UpdateSession' });

const SessionListQuery = z.object({
  agentId: z.string().optional(),
  parentId: z.string().optional(),
}).meta({ id: 'SessionListQuery' });

const IdParam = z.object({ id: z.string() });

app.get(
  '/api/sessions',
  describeRoute({
    summary: 'Get sessions list',
    responses: {
      200: { description: 'Sessions list', content: { 'application/json': { schema: resolver(z.array(SessionSchema)) } } },
    },
  }),
  zValidator('query', SessionListQuery),
  async (c) => {
    const { agentId, parentId } = c.req.valid('query');
    const sessions = await sessionServiceInstance.findAll({ agentId, parentId });
    return c.json(sessions);
  }
);

app.post(
  '/api/sessions',
  describeRoute({
    summary: 'Create session',
    responses: {
      201: { description: 'Session created', content: { 'application/json': { schema: resolver(SessionSchema) } } },
    },
  }),
  zValidator('json', CreateSessionSchema),
  async (c) => {
    const data = c.req.valid('json');
    const session = await sessionServiceInstance.create(data);
    return c.json(session, 201);
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
  zValidator('param', IdParam),
  async (c) => {
    const { id } = c.req.valid('param');
    try {
      const session = await sessionServiceInstance.findById(parseInt(id));
      return c.json(session);
    } catch (error) {
      if (error._tag === 'SessionNotFoundError') {
        return c.json({ error: 'Session not found' }, 404);
      }
      throw error;
    }
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
  zValidator('param', IdParam),
  zValidator('json', UpdateSessionSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    try {
      const session = await sessionServiceInstance.update(parseInt(id), data);
      return c.json(session);
    } catch (error) {
      if (error._tag === 'SessionNotFoundError') {
        return c.json({ error: 'Session not found' }, 404);
      }
      throw error;
    }
  }
);

app.delete(
  '/api/sessions/:id',
  describeRoute({ summary: 'Delete session', responses: { 200: { description: 'Deleted' } } }),
  zValidator('param', IdParam),
  async (c) => {
    const { id } = c.req.valid('param');
    try {
      await sessionServiceInstance.delete(parseInt(id));
      return c.json({ success: true });
    } catch (error) {
      if (error._tag === 'SessionNotFoundError') {
        return c.json({ error: 'Session not found' }, 404);
      }
      throw error;
    }
  }
);

app.get(
  '/api/sessions/:id/children',
  describeRoute({
    summary: 'Get sub-sessions',
    responses: { 200: { description: 'Sub-sessions', content: { 'application/json': { schema: resolver(z.array(SessionSchema)) } } } },
  }),
  zValidator('param', IdParam),
  async (c) => {
    const { id } = c.req.valid('param');
    const sessions = await sessionServiceInstance.findChildren(parseInt(id));
    return c.json(sessions);
  }
);

app.post(
  '/api/sessions/:id/children',
  describeRoute({
    summary: 'Create sub-session',
    responses: { 201: { description: 'Sub-session created', content: { 'application/json': { schema: resolver(SessionSchema) } } } },
  }),
  zValidator('param', IdParam),
  zValidator('json', CreateSessionSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const sessionData = {
      ...data,
      parentId: parseInt(id)
    };
    const session = await sessionServiceInstance.create(sessionData);
    return c.json(session, 201);
  }
);

export default app;