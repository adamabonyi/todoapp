import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import mq from 'mqemitter';
import websocket from '@fastify/websocket';

const PORT = 8080;
const prisma = new PrismaClient();
const emitter = mq({ concurrency: 5 });

const fastify = Fastify({
  logger: true,
});

fastify.register(websocket);
fastify.register(cors, (instance) => {
  return (req, callback) => {
    const corsOptions = {
      // This is NOT recommended for production as it enables reflection exploits
      origin: true,
    };

    // do not include CORS headers for requests from localhost
    if (/^localhost$/m.test(req.headers.origin)) {
      corsOptions.origin = false;
    }

    // callback expects two parameters: error and options
    callback(null, corsOptions);
  };
});
fastify.register(require('fastify-graceful-shutdown'));

fastify.get('/', async (request, reply) => {
  const users = await prisma.user.findMany({});

  return { hello: 'world', users };
});

fastify.get('/todos', async (request, reply) => {
  const todos = await prisma.todo.findMany({});

  return todos;
});

fastify.register(async (fastify) => {
  fastify.get('/events', { websocket: true }, async (connection, request) => {
    let messageListener;

    connection.socket.on('message', async (message: string) => {
      const { meta, room, participant, payload } = JSON.parse(message);
      console.log('received message', { meta, room, participant, payload });

      switch (meta) {
        case 'join':
          // Activate a new message listener
          messageListener = (event, done) => {
            if (event.room == room && (event.broadCast || event.participant == participant)) {
              console.log('sending message', JSON.stringify(event));
              if (event.participant !== participant) {
                connection.socket.send(JSON.stringify({ meta: event.meta, payload: event.payload }));
              }
            }

            done();
          };

          emitter.on('room-event', messageListener);

          connection.socket.send(
            JSON.stringify({
              meta: 'room-joined',
              room,
              participant,
            }),
          );
          break;

        case 'send-message':
          // Use the emitter to broadcast the message to the room participants
          emitter.emit({
            topic: 'room-event',
            meta: 'send-message',
            room,
            participant,
            broadCast: true,
            payload,
          });
          break;

        case 'save-changes':
          if (!payload) break;

          const { newTodos, removeTodos, updateTodos } = payload;

          if (newTodos?.length) {
            for (const n of newTodos) {
              try {
                await prisma.todo.create({ data: n });
              } catch (e) {
                console.error(e);
              }
            }
          }

          if (removeTodos?.length) {
            await prisma.todo.deleteMany({
              where: {
                id: {
                  in: removeTodos,
                },
              },
            });
          }

          if (updateTodos?.length) {
            for (const u of updateTodos) {
              try {
                await prisma.todo.update({
                  where: {
                    id: u.id,
                  },
                  data: u,
                });
              } catch (e) {
                console.error(e);
              }
            }
          }

          break;

        default:
          break;
      }
    });
    connection.socket.on('close', () => {
      console.log('removing message listener', { messageListener });

      if (messageListener) {
        emitter.removeListener('room-event', messageListener);
      }
    });
  });
});

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.ready();
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
