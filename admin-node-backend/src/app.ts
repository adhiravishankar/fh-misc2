import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerCarrierRoutes } from './routes/carriers.js';
import { registerPictureRoutes } from './routes/pictures.js';
import { registerRegionRoutes } from './routes/regions.js';
import { registerTransitHubRoutes } from './routes/transit-hubs.js';
import { registerSeriesRoutes } from './routes/vehicle-series.js';
import { registerVehicleRoutes } from './routes/vehicles.js';

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

