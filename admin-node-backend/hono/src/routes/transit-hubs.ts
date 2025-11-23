import { Hono, Context } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import ky from 'ky';
import { transitHubsCollection, transitHubPicturesCollection } from '../config';
import { TransitHub, TransitHubTable, TransitHubMedia, LatLongResponse } from '../types';
import { executeWithErrorHandling, getPictureCountsForEntities } from '../utils/helpers';
import { listImages } from '../utils/s3';
import { config } from '../config';
import { authenticateAdmin } from '../middleware/authentication';

async function getTransitHubs(c: Context) {
  const transitHubs = await transitHubsCollection.find({}).toArray() as TransitHub[];
  const ids = transitHubs.map((th) => th._id);
  const picCount = await getPictureCountsForEntities(transitHubPicturesCollection, ids, 'transit_hub');

  const transitHubsTable: TransitHubTable[] = transitHubs.map((transitHub) => ({
    ...transitHub,
    pictures: picCount[transitHub._id] || 0,
  }));

  return c.json(transitHubsTable);
}

async function createTransitHub(c: Context) {
  const transitHub = await c.req.json() as TransitHub;
  transitHub._id = uuidv4();

  try {
    const response = await ky.get('https://api-bdc.net/data/timezone-by-location', {
      searchParams: {
        latitude: transitHub.latitude.toString(),
        longitude: transitHub.longitude.toString(),
        key: config.bdcApiKey,
      },
      timeout: 10000,
    }).json<LatLongResponse>();

    transitHub.iana = response.ianaTimeId;
  } catch (error) {
    console.error('Failed to fetch timezone information:', error);
    return c.json({ error: 'Failed to fetch timezone information' }, 500);
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await transitHubsCollection.insertOne(transitHub as any);
  });

  if (result) {
    return c.json(result);
  }
}

async function patchTransitHub(c: Context) {
  const transitHubId = c.req.param('id');
  const transitHub = await c.req.json() as TransitHub;

  try {
    const response = await ky.get('https://api-bdc.net/data/timezone-by-location', {
      searchParams: {
        latitude: transitHub.latitude.toString(),
        longitude: transitHub.longitude.toString(),
        key: config.bdcApiKey,
      },
      timeout: 10000,
    }).json<LatLongResponse>();

    transitHub.iana = response.ianaTimeId;
  } catch (error) {
    console.error('Failed to fetch timezone information:', error);
    return c.json({ error: 'Failed to fetch timezone information' }, 500);
  }

  transitHub._id = transitHubId!;

  const result = await executeWithErrorHandling(c, async () => {
    return await transitHubsCollection.replaceOne({ _id: transitHubId } as any, transitHub as any);
  });

  if (result) {
    return c.json(result);
  }
}

async function deleteTransitHub(c: Context) {
  const transitHubId = c.req.param('id');

  const result = await executeWithErrorHandling(c, async () => {
    return await transitHubsCollection.deleteOne({ _id: transitHubId } as any);
  });

  if (result) {
    return c.json(result);
  }
}

async function getTransitHubPicturesInternal(): Promise<string[]> {
  const pictures = await transitHubPicturesCollection.find({}).toArray();
  return pictures.map((p) => p.url);
}

async function getUnlinkedTransitHubPictures(c: Context) {
  try {
    const linkedPictures = await getTransitHubPicturesInternal();
    const s3Pictures = await listImages('flight-history', 'flights/');

    const linked = new Set(linkedPictures);
    const unlinked = s3Pictures.filter((pic) => !linked.has(pic));

    return c.json(unlinked);
  } catch (error) {
    console.error('Failed to get unlinked pictures:', error);
    return c.json({ error: 'Failed to get unlinked pictures' }, 500);
  }
}

async function linkPhotoToTransitHub(c: Context) {
  const transitHubMedia = await c.req.json() as TransitHubMedia;
  transitHubMedia._id = uuidv4();

  if (!transitHubMedia.transit_hub || !transitHubMedia.url) {
    return c.json({ error: 'Missing required fields: transit_hub and url' }, 400);
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await transitHubPicturesCollection.insertOne(transitHubMedia as any);
  });

  if (result) {
    return c.json(transitHubMedia);
  }
}

export function registerTransitHubRoutes(app: Hono): void {
  app.get('/transit-hubs', authenticateAdmin, getTransitHubs);
  app.post('/transit-hubs', authenticateAdmin, createTransitHub);
  app.patch('/transit-hubs/:id', authenticateAdmin, patchTransitHub);
  app.delete('/transit-hubs/:id', authenticateAdmin, deleteTransitHub);
  app.get('/pictures-link/transit-hubs', authenticateAdmin, getUnlinkedTransitHubPictures);
  app.post('/transit-hubs/link', authenticateAdmin, linkPhotoToTransitHub);
}


