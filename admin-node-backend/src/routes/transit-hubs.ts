import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { transitHubsCollection, transitHubPicturesCollection } from '../config.js';
import { TransitHub, TransitHubTable, TransitHubMedia, LatLongResponse } from '../types.js';
import { executeWithErrorHandling, getPictureCountsForEntities } from '../utils/helpers.js';
import { listImages } from '../utils/s3.js';
import { config } from '../config.js';

interface TransitHubParams {
  id: string;
}

/**
 * Get all transit hubs with picture counts
 */
async function getTransitHubs(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const transitHubs = await transitHubsCollection.find({}).toArray() as TransitHub[];

  // Collect all transit hub IDs
  const ids = transitHubs.map((th) => th._id);

  // Batch fetch picture counts
  const picCount = await getPictureCountsForEntities(transitHubPicturesCollection, ids, 'transit_hub');

  const transitHubsTable: TransitHubTable[] = transitHubs.map((transitHub) => ({
    ...transitHub,
    pictures: picCount[transitHub._id] || 0,
  }));

  reply.send(transitHubsTable);
}

/**
 * Create a new transit hub
 */
async function createTransitHub(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const transitHub = request.body as TransitHub;
  transitHub._id = uuidv4();

  try {
    // Fetch timezone information from external API
    const response = await axios.get<LatLongResponse>(
      'https://api-bdc.net/data/timezone-by-location',
      {
        params: {
          latitude: transitHub.latitude,
          longitude: transitHub.longitude,
          key: config.bdcApiKey,
        },
        timeout: 10000,
      }
    );

    transitHub.iana = response.data.ianaTimeId;
  } catch (error) {
    console.error('Failed to fetch timezone information:', error);
    return reply.status(500).send({ error: 'Failed to fetch timezone information' });
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await transitHubsCollection.insertOne(transitHub as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Update a transit hub
 */
async function patchTransitHub(
  request: FastifyRequest<{ Params: TransitHubParams }>,
  reply: FastifyReply
): Promise<void> {
  const { id: transitHubId } = request.params;
  const transitHub = request.body as TransitHub;

  try {
    // Fetch timezone information from external API
    const response = await axios.get<LatLongResponse>(
      'https://api-bdc.net/data/timezone-by-location',
      {
        params: {
          latitude: transitHub.latitude,
          longitude: transitHub.longitude,
          key: config.bdcApiKey,
        },
        timeout: 10000,
      }
    );

    transitHub.iana = response.data.ianaTimeId;
  } catch (error) {
    console.error('Failed to fetch timezone information:', error);
    return reply.status(500).send({ error: 'Failed to fetch timezone information' });
  }

  transitHub._id = transitHubId;

  const result = await executeWithErrorHandling(reply, async () => {
    return await transitHubsCollection.replaceOne({ _id: transitHubId } as any, transitHub as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Delete a transit hub
 */
async function deleteTransitHub(
  request: FastifyRequest<{ Params: TransitHubParams }>,
  reply: FastifyReply
): Promise<void> {
  const { id: transitHubId } = request.params;

  const result = await executeWithErrorHandling(reply, async () => {
    return await transitHubsCollection.deleteOne({ _id: transitHubId } as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Get transit hub pictures (helper function)
 */
async function getTransitHubPicturesInternal(): Promise<string[]> {
  const pictures = await transitHubPicturesCollection.find({}).toArray();
  return pictures.map((p) => p.url);
}

/**
 * Get unlinked transit hub pictures
 */
async function getUnlinkedTransitHubPictures(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const linkedPictures = await getTransitHubPicturesInternal();
    const s3Pictures = await listImages('flight-history', 'flights/');

    const linked = new Set(linkedPictures);
    const unlinked = s3Pictures.filter((pic) => !linked.has(pic));

    reply.send(unlinked);
  } catch (error) {
    console.error('Failed to get unlinked pictures:', error);
    reply.status(500).send({ error: 'Failed to get unlinked pictures' });
  }
}

/**
 * Link a photo to a transit hub
 */
async function linkPhotoToTransitHub(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const transitHubMedia = request.body as TransitHubMedia;
  transitHubMedia._id = uuidv4();

  // Validate required fields
  if (!transitHubMedia.transit_hub || !transitHubMedia.url) {
    return reply.status(400).send({ error: 'Missing required fields: transit_hub and url' });
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await transitHubPicturesCollection.insertOne(transitHubMedia as any);
  });

  if (result) {
    reply.send(transitHubMedia);
  }
}

/**
 * Register transit hub routes
 */
export function registerTransitHubRoutes(fastify: FastifyInstance): void {
  fastify.get('/transit-hubs', getTransitHubs);
  fastify.post('/transit-hubs', createTransitHub);
  fastify.patch('/transit-hubs/:id', patchTransitHub);
  fastify.delete('/transit-hubs/:id', deleteTransitHub);
  fastify.get('/pictures-link/transit-hubs', getUnlinkedTransitHubPictures);
  fastify.post('/transit-hubs/link', linkPhotoToTransitHub);
}

