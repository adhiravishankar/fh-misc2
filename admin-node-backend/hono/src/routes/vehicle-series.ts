import { Hono, Context } from 'hono';
import { vehiclesCollection, seriesCollection, picturesCollection } from '../config';
import { Vehicle, VehicleTable, VehicleSeriesWithPictures, TravelPicture } from '../types';
import { getInternalVehicles } from './vehicles';
import { getPictureCountsForVehicles } from './pictures';
import { authenticateAdmin } from '../middleware/authentication';

async function getVehiclesInSeries(seriesParam: string): Promise<string[]> {
  const series = await seriesCollection.find({ series: seriesParam } as any).toArray();

  if (series.length === 0) {
    return [];
  }

  return series.map((s) => s.vehicle);
}

async function getVehiclesFromIds(vehicleIds: string[]): Promise<Vehicle[]> {
  if (vehicleIds.length === 0) {
    return [];
  }

  return await vehiclesCollection.find({ _id: { $in: vehicleIds } } as any).toArray() as Vehicle[];
}

async function getVehiclesWithinSeries(c: Context) {
  const seriesParam = c.req.param('series');

  const vehicleIds = await getVehiclesInSeries(seriesParam!);
  const vehicles = await getVehiclesFromIds(vehicleIds);

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

  return c.json(response);
}

async function getSeriesVehiclesNotLinked(c: Context) {
  const seriesParam = c.req.param('series');

  const allVehicles = await getInternalVehicles();
  const vehiclesInSeries = await getVehiclesInSeries(seriesParam!);

  const linked = new Set(vehiclesInSeries);
  const unlinked = allVehicles.filter((vehicle) => !linked.has(vehicle._id));

  return c.json(unlinked);
}

export function registerSeriesRoutes(app: Hono): void {
  app.get('/series/:series', authenticateAdmin, getVehiclesWithinSeries);
  app.get('/series/:series/vehicles-not-linked', authenticateAdmin, getSeriesVehiclesNotLinked);
}


