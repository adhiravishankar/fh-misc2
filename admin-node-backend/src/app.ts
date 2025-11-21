import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerCarrierRoutes } from './routes/carriers';
import { registerPictureRoutes } from './routes/pictures';
import { registerRegionRoutes } from './routes/regions';
import { registerTransitHubRoutes } from './routes/transit-hubs';
import { registerSeriesRoutes } from './routes/vehicle-series';
import { registerVehicleRoutes } from './routes/vehicles';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true
  });

  // Register CORS plugin
  await fastify.register(cors, {
    origin: true
  });

  // Health check route
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register all routes
  registerCarrierRoutes(fastify);
  registerPictureRoutes(fastify);
  registerRegionRoutes(fastify);
  registerTransitHubRoutes(fastify);
  registerSeriesRoutes(fastify);
  registerVehicleRoutes(fastify);

  return fastify;
}

