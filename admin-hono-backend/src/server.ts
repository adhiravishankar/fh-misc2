import { serve } from '@hono/node-server';
import { buildApp } from './app';
import { initializeMongoDB, initializeS3, config } from './config';

// Initialize connections
await initializeMongoDB();
initializeS3();

// Build the app
const app = buildApp();

// Start the server
console.log(`Server is running on http://localhost:${config.port}`);

serve({
  fetch: app.fetch,
  port: config.port,
});

