import { FastifyReply } from 'fastify';
import { Collection, Document } from 'mongodb';

/**
 * Execute a database operation with standardized error handling
 */
export async function executeWithErrorHandling<T>(
  reply: FastifyReply,
  operation: () => Promise<T>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation error:', error);
    reply.status(500).send({ error: 'Database operation failed', details: (error as Error).message });
    return null;
  }
}

/**
 * Get an entity by ID with error handling
 */
export async function getEntityById<T extends Document>(
  reply: FastifyReply,
  collection: Collection<T>,
  id: string
): Promise<T | null> {
  try {
    const result = await collection.findOne({ _id: id } as any);
    if (!result) {
      reply.status(404).send({ error: `Entity with id ${id} not found` });
      return null;
    }
    return result as T;
  } catch (error) {
    console.error('Get entity error:', error);
    reply.status(500).send({ error: 'Failed to retrieve entity', details: (error as Error).message });
    return null;
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  reply: FastifyReply,
  fields: Record<string, any>
): boolean {
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
      reply.status(400).send({ error: `Missing required field: ${fieldName}` });
      return false;
    }
  }
  return true;
}

/**
 * Get picture counts for entities using aggregation
 */
export async function getPictureCountsForEntities<T extends Document>(
  collection: Collection<T>,
  entityIds: string[],
  fieldName: string
): Promise<Record<string, number>> {
  if (entityIds.length === 0) {
    return {};
  }

  const pipeline = [
    { $match: { [fieldName]: { $in: entityIds } } },
    { $group: { _id: `$${fieldName}`, count: { $sum: 1 } } },
  ];

  const cursor = collection.aggregate(pipeline);
  const results = await cursor.toArray();

  const counts: Record<string, number> = {};
  for (const result of results) {
    counts[result._id] = result.count;
  }

  return counts;
}

