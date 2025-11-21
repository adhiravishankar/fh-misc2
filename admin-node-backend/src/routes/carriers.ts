import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { carriersCollection, picturesCollection } from '../config.js';
import { Carrier, CarrierTable } from '../types.js';
import { executeWithErrorHandling, getEntityById, validateRequiredFields, getPictureCountsForEntities } from '../utils/helpers.js';

interface CarrierParams {
  carrier: string;
}

/**
 * Get all carriers with picture counts
 */
async function getCarriers(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const carriers = await carriersCollection.find({}).sort({ name: 1 }).toArray();

  // Collect all carrier IDs
  const ids = carriers.map((c) => c._id);

  // Batch fetch picture counts
  const picCount = await getPictureCountsForEntities(picturesCollection, ids, 'carrier');

  const carriersTable: CarrierTable[] = carriers.map((carrier) => ({
    ...carrier,
    pictures: picCount[carrier._id] || 0,
  }));

  reply.send(carriersTable);
}

/**
 * Create a new carrier
 */
async function postCarrier(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const carrier = request.body as Carrier;
  carrier._id = uuidv4();

  // Validate required fields
  if (!validateRequiredFields(reply, {
    name: carrier.name,
    iata: carrier.iata,
    icao: carrier.icao,
  })) {
    return;
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await carriersCollection.insertOne(carrier as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Update a carrier
 */
async function patchCarrier(
  request: FastifyRequest<{ Params: CarrierParams }>,
  reply: FastifyReply
): Promise<void> {
  const { carrier: carrierId } = request.params;

  // Check if carrier exists
  const existingCarrier = await getEntityById(reply, carriersCollection, carrierId);
  if (!existingCarrier) {
    return;
  }

  const carrier = request.body as Carrier;
  carrier._id = carrierId;

  // Validate required fields
  if (!validateRequiredFields(reply, {
    name: carrier.name,
    iata: carrier.iata,
    icao: carrier.icao,
  })) {
    return;
  }

  const result = await executeWithErrorHandling(reply, async () => {
    return await carriersCollection.replaceOne({ _id: carrierId } as any, carrier as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Delete a carrier
 */
async function deleteCarrier(
  request: FastifyRequest<{ Params: CarrierParams }>,
  reply: FastifyReply
): Promise<void> {
  const { carrier: carrierId } = request.params;

  const result = await executeWithErrorHandling(reply, async () => {
    return await carriersCollection.deleteOne({ _id: carrierId } as any);
  });

  if (result) {
    reply.send(result);
  }
}

/**
 * Get all pictures for a specific carrier
 */
async function getCarrierPictures(
  request: FastifyRequest<{ Params: CarrierParams }>,
  reply: FastifyReply
): Promise<void> {
  const { carrier: carrierId } = request.params;

  const pictures = await picturesCollection.find({ carrier: carrierId } as any).toArray();
  reply.send(pictures);
}

/**
 * Register carrier routes
 */
export function registerCarrierRoutes(fastify: FastifyInstance): void {
  fastify.get('/carriers', getCarriers);
  fastify.post('/carriers', postCarrier);
  fastify.patch('/carriers/:carrier', patchCarrier);
  fastify.delete('/carriers/:carrier', deleteCarrier);
  fastify.get('/carriers/:carrier/pictures', getCarrierPictures);
}

