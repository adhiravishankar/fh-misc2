import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { vehiclesCollection, seriesCollection, picturesCollection } from '../config';
import { Vehicle, VehicleTable, VehicleSeriesWithPictures, TravelPicture } from '../types';
import { getInternalVehicles } from './vehicles';
import { getPictureCountsForVehicles } from './pictures';

interface SeriesParams {
  series: string;
}

/**
 * Get all vehicles within a series
 */
async function getVehiclesWithinSeries(
  request: FastifyRequest<{ Params: SeriesParams }>,
  reply: FastifyReply
): Promise<void> {
  const { series: seriesParam } = request.params;

  const vehicleIds = await getVehiclesInSeries(seriesParam);
  const vehicles = await getVehiclesFromIds(vehicleIds);

  // Batch fetch all pictures for these vehicles
  const pictureCounts = await getPictureCountsForVehicles(vehicleIds);

  let allPictures: TravelPicture[] = [];
  if (vehicleIds.length > 0) {
    allPictures = await picturesCollection.find({ vehicle: { $in: vehicleIds } } as any).toArray() as TravelPicture[];
  }

  const vehiclesTable: VehicleTable[] = vehicles.map((vehicle) => ({
    ...vehicle,
    pictures: pictureCounts[vehicle._id] || 0,
  }));

  const response: VehicleSeriesWithPictures = {
    vehicle_number: vehicles.length,
    picture_count: allPictures.length,
    vehicles: vehiclesTable,
    pictures: allPictures,
  };

  reply.send(response);
}

/**
 * Get vehicle IDs in a series
 */
async function getVehiclesInSeries(seriesParam: string): Promise<string[]> {
  const series = await seriesCollection.find({ series: seriesParam } as any).toArray();

  if (series.length === 0) {
    return [];
  }

  return series.map((s) => s.vehicle);
}

/**
 * Get vehicles from IDs
 */
async function getVehiclesFromIds(vehicleIds: string[]): Promise<Vehicle[]> {
  if (vehicleIds.length === 0) {
    return [];
  }

  return await vehiclesCollection.find({ _id: { $in: vehicleIds } } as any).toArray() as Vehicle[];
}

/**
 * Get vehicles not linked to a series
 */
async function getSeriesVehiclesNotLinked(
  request: FastifyRequest<{ Params: SeriesParams }>,
  reply: FastifyReply
): Promise<void> {
  const { series: seriesParam } = request.params;

  const allVehicles = await getInternalVehicles();
  const vehiclesInSeries = await getVehiclesInSeries(seriesParam);

  const linked = new Set(vehiclesInSeries);
  const unlinked = allVehicles.filter((vehicle) => !linked.has(vehicle._id));

  reply.send(unlinked);
}

/**
 * Register series routes
 */
export function registerSeriesRoutes(fastify: FastifyInstance): void {
  fastify.get('/series/:series', getVehiclesWithinSeries);
  fastify.get('/series/:series/vehicles-not-linked', getSeriesVehiclesNotLinked);
}

