import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerCarrierRoutes } from './routes/carriers';
import { registerVehicleRoutes } from './routes/vehicles';
import { registerRegionRoutes } from './routes/regions';
import { registerTransitHubRoutes } from './routes/transit-hubs';
import { registerPictureRoutes } from './routes/pictures';
import { registerSeriesRoutes } from './routes/vehicle-series';

export function buildApp(): Hono {
  const app = new Hono();

  // Register CORS middleware
  app.use('/*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  // Health check route (no auth required)
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Register all routes
  registerCarrierRoutes(app);
  registerVehicleRoutes(app);
  registerRegionRoutes(app);
  registerTransitHubRoutes(app);
  registerPictureRoutes(app);
  registerSeriesRoutes(app);

  return app;
}

