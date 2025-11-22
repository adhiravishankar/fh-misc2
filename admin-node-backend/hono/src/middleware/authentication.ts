import { Context, Next } from 'hono';
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

export async function authenticateAdmin(c: Context, next: Next): Promise<Response | void> {
  try {
    // Validate auth token is configured
    if (!config.authToken) {
      return c.json({ error: 'Server configuration error: AUTH_TOKEN not set' }, 500);
    }

    // Get Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Check if it starts with "Bearer "
    const bearerPrefix = 'Bearer ';
    if (!authHeader.startsWith(bearerPrefix)) {
      return c.json({ error: 'Invalid authorization format. Use: Bearer <token>' }, 401);
    }

    // Extract the token
    const providedToken = authHeader.slice(bearerPrefix.length).trim();

    // Validate token length (should be 64 characters)
    if (providedToken.length !== 64) {
      return c.json({ error: 'Invalid token length. Token must be 64 characters.' }, 401);
    }

    // Compare tokens using constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(providedToken, config.authToken)) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Token is valid, continue to next handler
    await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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


