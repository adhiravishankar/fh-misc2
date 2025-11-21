import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { picturesCollection, seriesCollection } from '../config.js';
import { TravelPicture, TravelPictureTable, TravelPictureSeries, VehicleSeries } from '../types.js';
import { executeWithErrorHandling, validateRequiredFields } from '../utils/helpers.js';
import { listImages } from '../utils/s3.js';

/**
 * Get all travel pictures
 */
async function getTravelPictures(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const pictures = await getTravelPicturesInternal();
  reply.send(pictures);
}

/**
 * Helper function to get travel pictures internally
 */
async function getTravelPicturesInternal(): Promise<TravelPicture[]> {
  return await picturesCollection.find({}).toArray() as TravelPicture[];
}

/**
 * Extract URLs from travel pictures
 */
function extractTravelPictureUrls(pictures: TravelPicture[]): string[] {
  return pictures.map((p) => p.url);
}

/**
 * Link a photo to a travel
 */
async function linkPhotoToTravel(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const picture = request.body as TravelPicture;
  picture._id = uuidv4();

  // Validate required fields
  if (!validateRequiredFields(reply, {
    carrier: picture.carrier,
    url: picture.url,
    vehicle: picture.vehicle,
  })) {
    return;
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await picturesCollection.insertOne(picture as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Get travel pictures table (aggregated by carrier/vehicle)
 */
async function getTravelPicturesTable(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const pictures = await picturesCollection.find({}).toArray() as TravelPicture[];
  const table = convertToTravelPictureTable(pictures);
  reply.send(table);
}

/**
 * Convert travel pictures to table format
 */
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

/**
 * Get travel pictures series (aggregated by carrier/series)
 */
async function getTravelPicturesSeries(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const pictures = await picturesCollection.find({}).toArray() as TravelPicture[];
  const seriesData = await seriesCollection.find({}).toArray() as VehicleSeries[];

  const aggregatedPictureSeries = aggregatePictureData(pictures, seriesData);
  reply.send(aggregatedPictureSeries);
}

/**
 * Aggregate picture data by carrier and series
 */
function aggregatePictureData(
  pictures: TravelPicture[],
  seriesData: VehicleSeries[]
): TravelPictureSeries[] {
  // Create lookup map for vehicle to series
  const vehicleToSeriesMap = new Map<string, string[]>();
  for (const s of seriesData) {
    if (!vehicleToSeriesMap.has(s.vehicle)) {
      vehicleToSeriesMap.set(s.vehicle, []);
    }
    vehicleToSeriesMap.get(s.vehicle)!.push(s.series);
  }

  // Aggregate the data
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

  // Convert to result array
  const result: TravelPictureSeries[] = [];
  for (const [key, count] of aggregation.entries()) {
    const [carrier, series] = key.split('|');
    result.push({ carrier, series, count });
  }

  return result;
}

/**
 * Get picture counts for vehicles using aggregation
 */
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

/**
 * Get unlinked travel pictures
 */
async function getUnlinkedTravelPictures(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const linkedPictures = extractTravelPictureUrls(await getTravelPicturesInternal());
    const s3Pictures = await listImages('milememory', 'vehicles/');

    const linked = new Set(linkedPictures);
    const unlinked = s3Pictures.filter((pic) => !linked.has(pic));

    reply.send(unlinked);
  } catch (error) {
    console.error('Failed to get unlinked pictures:', error);
    reply.status(500).send({ error: 'Failed to get unlinked pictures' });
  }
}

/**
 * Register picture routes
 */
export function registerPictureRoutes(fastify: FastifyInstance): void {
  fastify.get('/travel-pictures', getTravelPictures);
  fastify.get('/travel-pictures-table', getTravelPicturesTable);
  fastify.get('/travel-pictures-series', getTravelPicturesSeries);
  fastify.post('/travel-pictures', linkPhotoToTravel);
  fastify.get('/pictures-link/travels', getUnlinkedTravelPictures);
}

