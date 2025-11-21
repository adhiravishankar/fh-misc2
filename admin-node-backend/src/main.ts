import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from './app';

// Build the Fastify app
const app = await buildApp();

// Export the Lambda handler
export const handler = awsLambdaFastify(app);

