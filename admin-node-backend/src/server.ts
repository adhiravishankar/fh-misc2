import { buildApp } from './app';

// Start the server for local development
const start = async (): Promise<void> => {
  try {
    const fastify = await buildApp();
    
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`Server is running on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

