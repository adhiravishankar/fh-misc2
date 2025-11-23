import { Hono, Context } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { carriersCollection, picturesCollection } from '../config';
import { Carrier, CarrierTable } from '../types';
import { executeWithErrorHandling, getEntityById, validateRequiredFields, getPictureCountsForEntities } from '../utils/helpers';
import { authenticateAdmin } from '../middleware/authentication';

/**
 * Get all carriers with picture counts
 */
async function getCarriers(c: Context) {
  const carriers = await carriersCollection.find({}).sort({ name: 1 }).toArray() as Carrier[];

  // Collect all carrier IDs
  const ids = carriers.map((carrier) => carrier._id);

  // Batch fetch picture counts
  const picCount = await getPictureCountsForEntities(picturesCollection, ids, 'carrier');

  const carriersTable: CarrierTable[] = carriers.map((carrier) => ({
    ...carrier,
    pictures: picCount[carrier._id] || 0,
  }));

  return c.json(carriersTable);
}

/**
 * Create a new carrier
 */
async function postCarrier(c: Context) {
  const carrier = await c.req.json() as Carrier;
  carrier._id = uuidv4();

  // Validate required fields
  if (!validateRequiredFields(c, {
    name: carrier.name,
    iata: carrier.iata,
    icao: carrier.icao,
  })) {
    return;
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await carriersCollection.insertOne(carrier as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

/**
 * Update a carrier
 */
async function patchCarrier(c: Context) {
  const carrierId = c.req.param('carrier');

  // Check if carrier exists
  const existingCarrier = await getEntityById(c, carriersCollection, carrierId!);
  if (!existingCarrier) {
    return;
  }

  const carrier = await c.req.json() as Carrier;
  carrier._id = carrierId!;

  // Validate required fields
  if (!validateRequiredFields(c, {
    name: carrier.name,
    iata: carrier.iata,
    icao: carrier.icao,
  })) {
    return;
  }

  const result = await executeWithErrorHandling(c, async () => {
    return await carriersCollection.replaceOne({ _id: carrierId } as any, carrier as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

/**
 * Delete a carrier
 */
async function deleteCarrier(c: Context) {
  const carrierId = c.req.param('carrier');

  const result = await executeWithErrorHandling(c, async () => {
    return await carriersCollection.deleteOne({ _id: carrierId } as any);
  });

  if (result) {
    return c.json(result);
  }

  return;
}

/**
 * Get all pictures for a specific carrier
 */
async function getCarrierPictures(c: Context) {
  const carrierId = c.req.param('carrier');

  const pictures = await picturesCollection.find({ carrier: carrierId } as any).toArray();
  return c.json(pictures);
}

/**
 * Register carrier routes
 */
export function registerCarrierRoutes(app: Hono): void {
  app.get('/carriers', authenticateAdmin, getCarriers);
  app.post('/carriers', authenticateAdmin, postCarrier);
  app.patch('/carriers/:carrier', authenticateAdmin, patchCarrier);
  app.delete('/carriers/:carrier', authenticateAdmin, deleteCarrier);
  app.get('/carriers/:carrier/pictures', authenticateAdmin, getCarrierPictures);
}


