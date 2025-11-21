import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { regionsCollection, regionTransitHubsCollection } from '../config.js';
import { Region, RegionTable, RegionTransitHub } from '../types.js';
import { executeWithErrorHandling, getEntityById, validateRequiredFields } from '../utils/helpers.js';

interface RegionParams {
  region: string;
}

/**
 * Get all regions with transit hub counts
 */
async function getRegions(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const regions = await regionsCollection.find({}).toArray() as Region[];

  // Collect all region IDs
  const regionIds = regions.map((r) => r._id);

  // Batch fetch all region-transit-hub links
  const regionTransitHubs = await regionTransitHubsCollection
    .find({ region: { $in: regionIds } } as any)
    .toArray() as RegionTransitHub[];

  // Count transit-hubs per region
  const transitHubCount: Record<string, number> = {};
  for (const rth of regionTransitHubs) {
    transitHubCount[rth.region] = (transitHubCount[rth.region] || 0) + 1;
  }

  const regionsTable: RegionTable[] = regions.map((region) => ({
    ...region,
    transit_hub_count: transitHubCount[region._id] || 0,
  }));

  reply.send(regionsTable);
}

/**
 * Create a new region
 */
async function createRegion(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const region = request.body as Region;
  region._id = uuidv4();

  // Validate required fields
  if (!validateRequiredFields(reply, { name: region.name })) {
    return;
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await regionsCollection.insertOne(region as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Update a region
 */
async function patchRegion(
  request: FastifyRequest<{ Params: RegionParams }>,
  reply: FastifyReply
): Promise<void> {
  const { region: regionId } = request.params;

  // Check if region exists
  const existingRegion = await getEntityById(reply, regionsCollection, regionId);
  if (!existingRegion) {
    return;
  }

  const region = request.body as Region;
  region._id = regionId;

  // Validate required fields
  if (!validateRequiredFields(reply, { name: region.name })) {
    return;
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await regionsCollection.replaceOne({ _id: regionId } as any, region as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Link a region to a transit hub
 */
async function linkRegionToTransitHub(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const regionTransitHub = request.body as RegionTransitHub;
  regionTransitHub._id = uuidv4();

  // Validate required fields
  if (!validateRequiredFields(reply, {
    region: regionTransitHub.region,
    transit_hub: regionTransitHub.transit_hub,
  })) {
    return;
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await regionTransitHubsCollection.insertOne(regionTransitHub as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Delete a region
 */
async function deleteRegion(
  request: FastifyRequest<{ Params: RegionParams }>,
  reply: FastifyReply
): Promise<void> {
  const { region: regionId } = request.params;

  const result = await executeWithErrorHandling(reply, async () => {
    return await regionsCollection.deleteOne({ _id: regionId } as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Register region routes
 */
export function registerRegionRoutes(fastify: FastifyInstance): void {
  fastify.get('/regions', getRegions);
  fastify.post('/regions', createRegion);
  fastify.patch('/regions/:region', patchRegion);
  fastify.post('/regions/link', linkRegionToTransitHub);
  fastify.delete('/regions/:region', deleteRegion);
}

