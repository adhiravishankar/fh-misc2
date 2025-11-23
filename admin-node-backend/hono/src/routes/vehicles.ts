import { Hono, Context } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { vehiclesCollection, picturesCollection, seriesCollection } from '../config';
import { Vehicle, VehicleTable, VehicleSeries } from '../types';
import { executeWithErrorHandling, getPictureCountsForEntities } from '../utils/helpers';
import { authenticateAdmin } from '../middleware/authentication';

/**
 * Get all vehicles with picture counts
 */
async function getVehicles(c: Context) {
  const vehicles = await vehiclesCollection.find({}).sort({ name: 1 }).toArray() as Vehicle[];

  // Collect all vehicle IDs
  const ids = vehicles.map((v) => v._id);

  // Batch fetch picture counts
  const picCount = await getPictureCountsForEntities(picturesCollection, ids, 'vehicle');

  const vehiclesTable: VehicleTable[] = vehicles.map((vehicle) => ({
    ...vehicle,
    pictures: picCount[vehicle._id] || 0,
  }));

  return c.json(vehiclesTable);
}

/**
 * Get vehicles internally (helper function)
 */
export async function getInternalVehicles(): Promise<Vehicle[]> {
  const cursor = vehiclesCollection.find({});
  const vehicles: Vehicle[] = [];

  for await (const vehicle of cursor) {
    vehicles.push(vehicle as Vehicle);
  }

  return vehicles;
}

/**
 * Create a new vehicle
 */
async function postVehicle(c: Context) {
  const vehicle = await c.req.json() as Vehicle;
  vehicle._id = uuidv4();

  const result = await executeWithErrorHandling(c, async () => {
    return await vehiclesCollection.insertOne(vehicle as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

/**
 * Update a vehicle
 */
async function updateVehicle(c: Context) {
  const vehicleId = c.req.param('vehicle');
  const vehicle = await c.req.json() as Vehicle;
  vehicle._id = vehicleId!;

  const result = await executeWithErrorHandling(c, async () => {
    return await vehiclesCollection.replaceOne({ _id: vehicleId } as any, vehicle as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

/**
 * Delete a vehicle
 */
async function deleteVehicle(c: Context) {
  const vehicleId = c.req.param('vehicle');

  const result = await executeWithErrorHandling(c, async () => {
    return await vehiclesCollection.deleteOne({ _id: vehicleId } as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

/**
 * Get all pictures for a specific vehicle
 */
async function getVehiclePictures(c: Context) {
  const vehicleId = c.req.param('vehicle');

  const pictures = await picturesCollection.find({ vehicle: vehicleId } as any).toArray();
  return c.json(pictures);

  return;
}

/**
 * Link a series to a vehicle
 */
async function linkSeriesToVehicle(c: Context) {
  const seriesLink = await c.req.json() as VehicleSeries;
  seriesLink._id = uuidv4();

  // Validate required fields
  if (!seriesLink.series || !seriesLink.vehicle) {
    return c.json({ error: 'Missing required fields: series and vehicle' }, 400);
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await seriesCollection.insertOne(seriesLink as any);
  });

  if (result) {
    return c.json(seriesLink);
  }

  return;
}

/**
 * Register vehicle routes
 */
export function registerVehicleRoutes(app: Hono): void {
  app.get('/vehicles', authenticateAdmin, getVehicles);
  app.post('/vehicles', authenticateAdmin, postVehicle);
  app.patch('/vehicles/:vehicle', authenticateAdmin, updateVehicle);
  app.delete('/vehicles/:vehicle', authenticateAdmin, deleteVehicle);
  app.get('/vehicles/:vehicle/pictures', authenticateAdmin, getVehiclePictures);
  app.post('/link-series', authenticateAdmin, linkSeriesToVehicle);
}


