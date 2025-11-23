import { Hono, Context } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { picturesCollection, seriesCollection } from '../config';
import { TravelPicture, TravelPictureTable, TravelPictureSeries, VehicleSeries } from '../types';
import { executeWithErrorHandling, validateRequiredFields } from '../utils/helpers';
import { listImages } from '../utils/s3';
import { authenticateAdmin } from '../middleware/authentication';

async function getTravelPicturesInternal(): Promise<TravelPicture[]> {
  return await picturesCollection.find({}).toArray() as TravelPicture[];
}

function extractTravelPictureUrls(pictures: TravelPicture[]): string[] {
  return pictures.map((p) => p.url);
}

async function getTravelPictures(c: Context) {
  const pictures = await getTravelPicturesInternal();
  return c.json(pictures);
}

function convertToTravelPictureTable(pictures: TravelPicture[]): TravelPictureTable[] {
  const counts = new Map<string, number>();

  for (const picture of pictures) {
    const key = `${picture.carrier}|${picture.vehicle}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const result: TravelPictureTable[] = [];
  for (const [key, count] of counts.entries()) {
    const [carrier, vehicle] = key.split('|');
    result.push({ carrier, vehicle, count });
  }

  return result;
}

async function getTravelPicturesTable(c: Context) {
  const pictures = await picturesCollection.find({}).toArray() as TravelPicture[];
  const table = convertToTravelPictureTable(pictures);
  return c.json(table);
}

function aggregatePictureData(
  pictures: TravelPicture[],
  seriesData: VehicleSeries[]
): TravelPictureSeries[] {
  const vehicleToSeriesMap = new Map<string, string[]>();
  for (const s of seriesData) {
    if (!vehicleToSeriesMap.has(s.vehicle)) {
      vehicleToSeriesMap.set(s.vehicle, []);
    }
    vehicleToSeriesMap.get(s.vehicle)!.push(s.series);
  }

  const aggregation = new Map<string, number>();

  for (const pic of pictures) {
    const seriesList = vehicleToSeriesMap.get(pic.vehicle);
    if (seriesList) {
      for (const series of seriesList) {
        const key = `${pic.carrier}|${series}`;
        aggregation.set(key, (aggregation.get(key) || 0) + 1);
      }
    }
  }

  const result: TravelPictureSeries[] = [];
  for (const [key, count] of aggregation.entries()) {
    const [carrier, series] = key.split('|');
    result.push({ carrier, series, count });
  }

  return result;
}

async function getTravelPicturesSeries(c: Context) {
  const pictures = await picturesCollection.find({}).toArray() as TravelPicture[];
  const seriesData = await seriesCollection.find({}).toArray() as VehicleSeries[];

  const aggregatedPictureSeries = aggregatePictureData(pictures, seriesData);
  return c.json(aggregatedPictureSeries);
}

async function linkPhotoToTravel(c: Context) {
  const picture = await c.req.json() as TravelPicture;
  picture._id = uuidv4();

  if (!validateRequiredFields(c, {
    carrier: picture.carrier,
    url: picture.url,
    vehicle: picture.vehicle,
  })) {
    return;
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await picturesCollection.insertOne(picture as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

export async function getPictureCountsForVehicles(vehicleIds: string[]): Promise<Record<string, number>> {
  if (vehicleIds.length === 0) {
    return {};
  }

  const pipeline = [
    { $match: { vehicle: { $in: vehicleIds } } },
    { $group: { _id: '$vehicle', count: { $sum: 1 } } },
  ];

  const cursor = picturesCollection.aggregate(pipeline);
  const results = await cursor.toArray();

  const counts: Record<string, number> = {};
  for (const result of results) {
    counts[result._id] = result.count;
  }

  return counts;
}

async function getUnlinkedTravelPictures(c: Context) {
  try {
    const linkedPictures = extractTravelPictureUrls(await getTravelPicturesInternal());
    const s3Pictures = await listImages('milememory', 'vehicles/');

    const linked = new Set(linkedPictures);
    const unlinked = s3Pictures.filter((pic) => !linked.has(pic));

    return c.json(unlinked);
  } catch (error) {
    console.error('Failed to get unlinked pictures:', error);
    return c.json({ error: 'Failed to get unlinked pictures' }, 500);
  }
}

export function registerPictureRoutes(app: Hono): void {
  app.get('/travel-pictures', authenticateAdmin, getTravelPictures);
  app.get('/travel-pictures-table', authenticateAdmin, getTravelPicturesTable);
  app.get('/travel-pictures-series', authenticateAdmin, getTravelPicturesSeries);
  app.post('/travel-pictures', authenticateAdmin, linkPhotoToTravel);
  app.get('/pictures-link/travels', authenticateAdmin, getUnlinkedTravelPictures);
}


