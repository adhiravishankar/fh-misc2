import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { vehiclesCollection, picturesCollection, seriesCollection } from '../config';
import { Vehicle, VehicleTable, VehicleSeries } from '../types';
import { executeWithErrorHandling, getPictureCountsForEntities } from '../utils/helpers';

interface VehicleParams {
  vehicle: string;
}

/**
 * Get all vehicles with picture counts
 */
async function getVehicles(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const vehicles = await vehiclesCollection.find({}).sort({ name: 1 }).toArray() as Vehicle[];

  // Collect all vehicle IDs
  const ids = vehicles.map((v) => v._id);

  // Batch fetch picture counts
  const picCount = await getPictureCountsForEntities(picturesCollection, ids, 'vehicle');

  const vehiclesTable: VehicleTable[] = vehicles.map((vehicle) => ({
    ...vehicle,
    pictures: picCount[vehicle._id] || 0,
  }));

  reply.send(vehiclesTable);
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
async function postVehicle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const vehicle = request.body as Vehicle;
  vehicle._id = uuidv4();

  const result = await executeWithErrorHandling(reply, async () => {
    return await vehiclesCollection.insertOne(vehicle as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Update a vehicle
 */
async function updateVehicle(
  request: FastifyRequest<{ Params: VehicleParams }>,
  reply: FastifyReply
): Promise<void> {
  const { vehicle: vehicleId } = request.params;
  const vehicle = request.body as Vehicle;
  vehicle._id = vehicleId;

  const result = await executeWithErrorHandling(reply, async () => {
    return await vehiclesCollection.replaceOne({ _id: vehicleId } as any, vehicle as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Delete a vehicle
 */
async function deleteVehicle(
  request: FastifyRequest<{ Params: VehicleParams }>,
  reply: FastifyReply
): Promise<void> {
  const { vehicle: vehicleId } = request.params;

  const result = await executeWithErrorHandling(reply, async () => {
    return await vehiclesCollection.deleteOne({ _id: vehicleId } as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Get all pictures for a specific vehicle
 */
async function getVehiclePictures(
  request: FastifyRequest<{ Params: VehicleParams }>,
  reply: FastifyReply
): Promise<void> {
  const { vehicle: vehicleId } = request.params;

  const pictures = await picturesCollection.find({ vehicle: vehicleId } as any).toArray();
  reply.send(pictures);
}

/**
 * Link a series to a vehicle
 */
async function linkSeriesToVehicle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const seriesLink = request.body as VehicleSeries;
  seriesLink._id = uuidv4();

  // Validate required fields
  if (!seriesLink.series || !seriesLink.vehicle) {
    return reply.status(400).send({ error: 'Missing required fields: series and vehicle' });
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await seriesCollection.insertOne(seriesLink as any);
  });

  if (result) {
    reply.send(seriesLink);
  }
}

/**
 * Register vehicle routes
 */
export function registerVehicleRoutes(fastify: FastifyInstance): void {
  fastify.get('/vehicles', getVehicles);
  fastify.post('/vehicles', postVehicle);
  fastify.patch('/vehicles/:vehicle', updateVehicle);
  fastify.delete('/vehicles/:vehicle', deleteVehicle);
  fastify.get('/vehicles/:vehicle/pictures', getVehiclePictures);
  fastify.post('/link-series', linkSeriesToVehicle);
}

