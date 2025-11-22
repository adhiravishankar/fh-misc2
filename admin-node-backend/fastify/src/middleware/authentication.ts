import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

/**
 * Authentication middleware for admin backend
 *
 * This middleware provides simple token-based authentication for all admin routes.
 * All routes (except /health) require a valid Bearer token in the Authorization header.
 *
 * Usage:
 *   Authorization: Bearer <your-64-character-token>
 *
 * The token must match the AUTH_TOKEN environment variable (64 characters).
 */

export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Validate auth token is configured
    if (!config.authToken) {
      return reply.status(500).send({ error: 'Server configuration error: AUTH_TOKEN not set' });
    }

    // Get Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'Authorization required' });
    }

    // Check if it starts with "Bearer "
    const bearerPrefix = 'Bearer ';
    if (!authHeader.startsWith(bearerPrefix)) {
      return reply.status(401).send({ error: 'Invalid authorization format. Use: Bearer <token>' });
    }

    // Extract the token
    const providedToken = authHeader.slice(bearerPrefix.length).trim();

    // Validate token length (should be 64 characters)
    if (providedToken.length !== 64) {
      return reply.status(401).send({ error: 'Invalid token length. Token must be 64 characters.' });
    }

    // Compare tokens using constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(providedToken, config.authToken)) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    // Token is valid, request can proceed
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

