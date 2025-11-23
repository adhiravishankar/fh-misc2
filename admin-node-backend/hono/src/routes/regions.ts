import { Hono, Context } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { regionsCollection, regionTransitHubsCollection } from '../config';
import { Region, RegionTable, RegionTransitHub } from '../types';
import { executeWithErrorHandling, getEntityById, validateRequiredFields } from '../utils/helpers';
import { authenticateAdmin } from '../middleware/authentication';

async function getRegions(c: Context) {
  const regions = await regionsCollection.find({}).toArray() as Region[];
  const regionIds = regions.map((r) => r._id);

  const regionTransitHubs = await regionTransitHubsCollection
    .find({ region: { $in: regionIds } } as any)
    .toArray() as RegionTransitHub[];

  const transitHubCount: Record<string, number> = {};
  for (const rth of regionTransitHubs) {
    transitHubCount[rth.region] = (transitHubCount[rth.region] || 0) + 1;
  }

  const regionsTable: RegionTable[] = regions.map((region) => ({
    ...region,
    transit_hub_count: transitHubCount[region._id] || 0,
  }));

  return c.json(regionsTable);
}

async function createRegion(c: Context) {
  const region = await c.req.json() as Region;
  region._id = uuidv4();

  if (!validateRequiredFields(c, { name: region.name })) {
    return;
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await regionsCollection.insertOne(region as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

async function patchRegion(c: Context) {
  const regionId = c.req.param('region');

  const existingRegion = await getEntityById(c, regionsCollection, regionId!);
  if (!existingRegion) {
    return;
  }

  const region = await c.req.json() as Region;
  region._id = regionId!;

  if (!validateRequiredFields(c, { name: region.name })) {
    return;
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await regionsCollection.replaceOne({ _id: regionId } as any, region as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

async function linkRegionToTransitHub(c: Context) {
  const regionTransitHub = await c.req.json() as RegionTransitHub;
  regionTransitHub._id = uuidv4();

  if (!validateRequiredFields(c, {
    region: regionTransitHub.region,
    transit_hub: regionTransitHub.transit_hub,
  })) {
    return;
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await regionTransitHubsCollection.insertOne(regionTransitHub as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

async function deleteRegion(c: Context) {
  const regionId = c.req.param('region');

  const result = await executeWithErrorHandling(c, async () => {
    return await regionsCollection.deleteOne({ _id: regionId } as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

export function registerRegionRoutes(app: Hono): void {
  app.get('/regions', authenticateAdmin, getRegions);
  app.post('/regions', authenticateAdmin, createRegion);
  app.patch('/regions/:region', authenticateAdmin, patchRegion);
  app.post('/regions/link', authenticateAdmin, linkRegionToTransitHub);
  app.delete('/regions/:region', authenticateAdmin, deleteRegion);
}


