import { Hono } from 'hono';
import { describeRoute, resolver, validator as zValidator } from 'hono-openapi';
import { z } from 'zod';
import { Runtime } from "../effects"
import { Effect } from "effect"
import { MsgPartService } from '../services/msg-part.service';

const app = new Hono();

const MsgPartSchema = z.object({
  id: z.number(),
  messageId: z.number(),
  type: z.string(),
  content: z.string().nullable(),
  metadata: z.string().nullable(),
  endTime: z.string().nullable(),
  createdAt: z.string(),
}).meta({ id: 'MsgPart' });

const CreateMsgPartSchema = z.object({
  type: z.string().min(1),
  content: z.string().optional(),
  metadata: z.string().optional(),
  endTime: z.string().optional(),
}).meta({ id: 'CreateMsgPart' });

const UpdateMsgPartSchema = z.object({
  type: z.string().min(1).optional(),
  content: z.string().optional(),
  metadata: z.string().optional(),
  endTime: z.string().optional(),
}).meta({ id: 'UpdateMsgPart' });

app.get(
  '/api/parts/message/:messageId',
  describeRoute({
    summary: 'Get msg parts by message id',
    responses: { 200: { description: 'Msg parts list', content: { 'application/json': { schema: resolver(z.array(MsgPartSchema)) } } } },
  }),
  zValidator('param', z.object({ messageId: z.string() })),
  async (c) => {
    const { messageId } = c.req.valid('param');
    const msgParts = await Runtime.runPromise(MsgPartService.use(svc => svc.findByMessageId(parseInt(messageId))));
    return c.json(msgParts);
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
    const msgPart = await Runtime.runPromise(MsgPartService.use(svc => svc.create(parseInt(messageId), data))); 
    return c.json(msgPart, 201);
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
    const msgPart = await Runtime.runPromise(MsgPartService.use(svc => svc.findById(parseInt(id))));
    return c.json(msgPart);
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
    const msgPart = await Runtime.runPromise(MsgPartService.use(svc => svc.update(parseInt(id), data)));
    return c.json(msgPart);
  }
);

app.delete(
  '/api/parts/:id',
  describeRoute({ summary: 'Delete msg part', responses: { 200: { description: 'Deleted' } } }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    await Runtime.runPromise(MsgPartService.use(svc => svc.delete(parseInt(id))));
    return c.json({ success: true });
  }
);

export default app;
