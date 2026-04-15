import { Hono } from 'hono';
import { describeRoute, resolver, validator as zValidator } from 'hono-openapi';
import { z } from 'zod';
import { messageServiceInstance } from '../services';

const app = new Hono();

const MessageSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  subSessionId: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  data: z.string().nullable(),
  createdAt: z.string(),
}).meta({ id: 'Message' });

const CreateMessageSchema = z.object({
  subSessionId: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  data: z.string().optional(),
  parentId: z.number().optional(),
}).meta({ id: 'CreateMessage' });

const UpdateMessageSchema = z.object({
  content: z.string().optional(),
  data: z.string().optional(),
}).meta({ id: 'UpdateMessage' });

const MessageQuerySchema = z.object({
  subSessionId: z.string().optional(),
  parentId: z.string().optional(),
}).meta({ id: 'MessageQuery' });

app.get(
  '/api/messages',
  describeRoute({
    summary: 'Get messages',
    responses: { 200: { description: 'Messages list', content: { 'application/json': { schema: resolver(z.array(MessageSchema)) } } } },
  }),
  zValidator('query', MessageQuerySchema),
  async (c) => {
    const { subSessionId, parentId } = c.req.valid('query');
    const messages = await messageServiceInstance.findAll({ subSessionId, parentId });
    return c.json(messages);
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
    const message = await messageServiceInstance.create(data);
    return c.json(message, 201);
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
    try {
      const message = await messageServiceInstance.findById(parseInt(id));
      return c.json(message);
    } catch (error) {
      if (error._tag === 'MessageNotFoundError') {
        return c.json({ error: 'Message not found' }, 404);
      }
      throw error;
    }
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
    try {
      const message = await messageServiceInstance.update(parseInt(id), data);
      return c.json(message);
    } catch (error) {
      if (error._tag === 'MessageNotFoundError') {
        return c.json({ error: 'Message not found' }, 404);
      }
      throw error;
    }
  }
);

app.delete(
  '/api/messages/:id',
  describeRoute({ summary: 'Delete message', responses: { 200: { description: 'Deleted' } } }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    try {
      await messageServiceInstance.delete(parseInt(id));
      return c.json({ success: true });
    } catch (error) {
      if (error._tag === 'MessageNotFoundError') {
        return c.json({ error: 'Message not found' }, 404);
      }
      throw error;
    }
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
    const messages = await messageServiceInstance.findReplies(parseInt(id));
    return c.json(messages);
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
    const messageData = {
      ...data,
      parentId: parseInt(id)
    };
    const message = await messageServiceInstance.create(messageData);
    return c.json(message, 201);
  }
);

export default app;