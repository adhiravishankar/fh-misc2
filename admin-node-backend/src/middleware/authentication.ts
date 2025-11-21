import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../types';

/**
 * Authentication middleware for admin backend
 *
 * This middleware provides JWT token-based authentication for all admin routes.
 * All routes (except /health) require a valid Bearer token in the Authorization header.
 *
 * Usage:
 *   Authorization: Bearer <your-jwt-token>
 *
 * The JWT token must:
 *   - Be signed with the JWT_SECRET environment variable
 *   - Have valid expiration (exp) and issued-at (iat) claims
 *   - Contain a valid UUID in the subject (sub) claim
 *   - Optionally contain role: "admin" for admin-specific validation
 */

export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Validate JWT secret
    if (!config.jwtSecret || config.jwtSecret.length < 32) {
      return reply.status(500).send({ error: 'Server configuration error' });
    }

    // Get Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'Authorization required' });
    }

    // Check if it starts with "Bearer "
    const bearerPrefix = 'Bearer ';
    if (!authHeader.startsWith(bearerPrefix)) {
      return reply.status(401).send({ error: 'Invalid authorization format' });
    }

    // Extract the token
    const tokenString = authHeader.slice(bearerPrefix.length);

    // Parse and validate the token
    try {
      const decoded = jwt.verify(tokenString, config.jwtSecret, {
        algorithms: ['HS256'],
      }) as JWTPayload;

      // Optionally validate the payload structure
      if (!decoded.sub || !decoded.exp || !decoded.iat) {
        return reply.status(401).send({ error: 'Invalid token (missing claims)' });
      }

      // Attach decoded token to request for use in route handlers
      (request as any).user = decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return reply.status(401).send({ error: 'Token expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return reply.status(401).send({ error: 'Invalid token (malformed)' });
      } else if (error.name === 'NotBeforeError') {
        return reply.status(401).send({ error: 'Token not valid yet' });
      } else {
        return reply.status(401).send({ error: 'Invalid token (unknown error)' });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

