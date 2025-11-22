import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from './app';
import { initializeMongoDB, initializeS3 } from './config';

// Initialize connections
await initializeMongoDB();
initializeS3();

// Build the Fastify app
const app = await buildApp();

// Export the Lambda handler
export const handler = awsLambdaFastify(app);

