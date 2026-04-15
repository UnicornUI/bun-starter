import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { swaggerUI } from '@hono/swagger-ui';
import { openAPIRouteHandler } from 'hono-openapi';
import sessions from './sessions';
import messages from './messages';
import parts from './parts';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ message: 'Agent Session API', version: '1.0.0' }));

app.route('/', sessions);
app.route('/', messages);
app.route('/', parts);

app.get(
  '/openapi.json',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Agent Session API',
        version: '1.0.0',
        description: 'Agent 会话管理 API',
      },
      servers: [{ url: 'http://localhost:8080' }],
    },
  })
);

app.get('/doc', swaggerUI({ url: '/openapi.json' }));

export default {
  port: 8080,
  fetch: app.fetch,
};
