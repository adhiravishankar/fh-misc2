import { handle } from 'hono/aws-lambda';
import { buildApp } from './app';
import { initializeMongoDB, initializeS3 } from './config';

// Initialize connections
await initializeMongoDB();
initializeS3();

// Build the Hono app
const app = buildApp();

// Export the Lambda handler
export const handler = handle(app);

