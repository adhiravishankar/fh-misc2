import dotenv from 'dotenv';
import { MongoClient, Db, Collection } from 'mongodb';
import { S3Client } from '@aws-sdk/client-s3';
import type {
  Vehicle,
  Carrier,
  TransitHub,
  TravelPicture,
  VehicleSeries,
  Region,
  RegionTransitHub,
  TransitHubMedia,
} from './types';

dotenv.config();

// Validate environment variables
const requiredEnvVars = ['MONGODB_URL', 'AUTH_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Auth token validation (must be 64 characters)
if (process.env.AUTH_TOKEN && process.env.AUTH_TOKEN.length !== 64) {
  throw new Error('AUTH_TOKEN must be exactly 64 characters long');
}

export const config = {
  mongodbUrl: process.env.MONGODB_URL!,
  authToken: process.env.AUTH_TOKEN!,
  bdcApiKey: process.env.BDC_API_KEY || '',
  port: parseInt(process.env.PORT || '8080', 10),
  corsOrigins: ['https://admin.flighthistory.app'],
  awsRegion: process.env.AWS_REGION || 'us-east-1',
};

// MongoDB client and database
let mongoClient: MongoClient;
let mongoDB: Db;

// S3 Client
export let s3Client: S3Client;

// Collections with proper typing
export let vehiclesCollection: Collection<Vehicle>;
export let carriersCollection: Collection<Carrier>;
export let transitHubsCollection: Collection<TransitHub>;
export let picturesCollection: Collection<TravelPicture>;
export let seriesCollection: Collection<VehicleSeries>;
export let regionsCollection: Collection<Region>;
export let regionTransitHubsCollection: Collection<RegionTransitHub>;
export let transitHubPicturesCollection: Collection<TransitHubMedia>;

export async function initializeMongoDB(): Promise<void> {
  try {
    mongoClient = new MongoClient(config.mongodbUrl, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await mongoClient.connect();
    mongoDB = mongoClient.db('travel-admin');

    // Initialize collections
    vehiclesCollection = mongoDB.collection('vehicles');
    carriersCollection = mongoDB.collection('carriers');
    transitHubsCollection = mongoDB.collection('transit-hubs');
    picturesCollection = mongoDB.collection('travel-pictures');
    seriesCollection = mongoDB.collection('vehicle-series');
    regionsCollection = mongoDB.collection('regions');
    regionTransitHubsCollection = mongoDB.collection('region-transit-hubs');
    transitHubPicturesCollection = mongoDB.collection('transit-hub-pictures');

    // Create indexes
    await createDatabaseIndexes();

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function initializeS3(): void {
  s3Client = new S3Client({
    region: config.awsRegion,
  });
  console.log('S3 client initialized');
}

async function createDatabaseIndexes(): Promise<void> {
  console.log('Creating database indexes...');

  const indexes: Record<string, Record<string, number>[]> = {
    vehicles: [
      { name: 1 },
      { manufacturer: 1 },
    ],
    carriers: [
      { name: 1 },
      { iata: 1 },
      { icao: 1 },
      { country: 1 },
      { alliance: 1 },
      { active: 1 },
    ],
    'transit-hubs': [
      { name: 1 },
      { iata: 1 },
      { icao: 1 },
      { country: 1 },
      { city: 1 },
    ],
    'travel-pictures': [
      { carrier: 1 },
      { vehicle: 1 },
    ],
    'vehicle-series': [
      { series: 1 },
      { vehicle: 1 },
    ],
  };

  for (const [collectionName, indexSpecs] of Object.entries(indexes)) {
    const collection = mongoDB.collection(collectionName);
    try {
      for (const indexSpec of indexSpecs) {
        await collection.createIndex(indexSpec);
      }
      console.log(`Created ${indexSpecs.length} indexes for ${collectionName} collection`);
    } catch (error) {
      console.warn(`Warning: Failed to create indexes for ${collectionName}:`, error);
    }
  }

  console.log('Database indexes creation completed');
}

export async function closeConnections(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    console.log('MongoDB connection closed');
  }
}

