import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true
  });

  // Register CORS plugin
  await fastify.register(cors, {
    origin: true
  });

  // Health check route
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Example API route
  fastify.get('/api/hello', async (request: FastifyRequest, reply: FastifyReply) => {
    return { message: 'Hello from Fastify Admin Backend!' };
  });

  // Define request body type for POST
  interface DataBody {
    [key: string]: any;
  }

  // Example POST route
  fastify.post<{ Body: DataBody }>('/api/data', async (request: FastifyRequest<{ Body: DataBody }>, reply: FastifyReply) => {
    const body = request.body;
    return { 
      success: true, 
      received: body,
      timestamp: new Date().toISOString()
    };
  });

  return fastify;
}

