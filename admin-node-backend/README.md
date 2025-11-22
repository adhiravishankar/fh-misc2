# Admin Node Backend

A modern backend API built with Fastify and TypeScript.

## Features

- ⚡ Fast and lightweight with Fastify
- 🔒 CORS enabled
- 📝 Structured logging
- 🎯 Modern ES modules (ESM)
- 🔄 Hot reload in development mode
- 💪 Full TypeScript support with strict mode

## Prerequisites

- Node.js 18 or higher

## Installation

```bash
npm install
```

## Usage

### Development Mode (with hot reload)

Run the local Fastify server with hot reload:

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Serverless Offline Mode

Test the Lambda function locally with serverless-offline:

```bash
npm run offline
```

Server runs on `http://localhost:3001`

This mode simulates AWS Lambda + API Gateway locally and uses the same handler that will run in production.

### Production Mode

First, build the TypeScript code:

```bash
npm run build
```

Then start the server:

```bash
npm start
```

## API Endpoints

### System Routes
- `GET /health` - Health check endpoint

### Carrier Routes
- `GET /carriers` - Get all carriers with picture counts
- `POST /carriers` - Create a new carrier
- `PATCH /carriers/:carrier` - Update a carrier
- `DELETE /carriers/:carrier` - Delete a carrier
- `GET /carriers/:carrier/pictures` - Get pictures for a carrier

### Vehicle Routes
- `GET /vehicles` - Get all vehicles with picture counts
- `POST /vehicles` - Create a new vehicle
- `PATCH /vehicles/:vehicle` - Update a vehicle
- `DELETE /vehicles/:vehicle` - Delete a vehicle
- `GET /vehicles/:vehicle/pictures` - Get pictures for a vehicle
- `POST /link-series` - Link a series to a vehicle

### Region Routes
- `GET /regions` - Get all regions with transit hub counts
- `POST /regions` - Create a new region
- `PATCH /regions/:region` - Update a region
- `DELETE /regions/:region` - Delete a region
- `POST /regions/link` - Link a region to a transit hub

### Transit Hub Routes
- `GET /transit-hubs` - Get all transit hubs with picture counts
- `POST /transit-hubs` - Create a new transit hub
- `PATCH /transit-hubs/:id` - Update a transit hub
- `DELETE /transit-hubs/:id` - Delete a transit hub
- `POST /transit-hubs/link` - Link a photo to a transit hub
- `GET /pictures-link/transit-hubs` - Get unlinked transit hub pictures

### Picture Routes
- `GET /travel-pictures` - Get all travel pictures
- `GET /travel-pictures-table` - Get aggregated picture table
- `GET /travel-pictures-series` - Get pictures by series
- `POST /travel-pictures` - Link a photo to a travel
- `GET /pictures-link/travels` - Get unlinked travel pictures

### Series Routes
- `GET /series/:series` - Get vehicles within a series
- `GET /series/:series/vehicles-not-linked` - Get vehicles not linked to series

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables
- `MONGODB_URL` - MongoDB connection string (e.g., `mongodb://localhost:27017/travel-admin`)
- `AUTH_TOKEN` - Authentication token (exactly 64 characters, hexadecimal)

### Optional Variables
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment mode (development/production)
- `BDC_API_KEY` - BigDataCloud API key for timezone lookups
- `AWS_REGION` - AWS region for S3 (default: us-east-2)

Example `.env` file:
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
MONGODB_URL=mongodb://localhost:27017/travel-admin
AUTH_TOKEN=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
BDC_API_KEY=your-bdc-api-key
AWS_REGION=us-east-2
```

**Generate a secure 64-character token:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Deployment

### AWS Lambda

This project is configured to deploy as an AWS Lambda function using Serverless Framework.

#### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Set up environment variables in your `.env` file

#### Deploy to AWS:

```bash
npm run deploy
```

Or deploy to a specific stage:

```bash
serverless deploy --stage prod
```

#### Test Locally (Serverless Offline)

Run the Lambda function locally with API Gateway simulation:

```bash
npm run offline
```

This starts the server on `http://localhost:3001` and simulates the AWS Lambda environment. All routes from the deployed version will work locally.

**Differences between dev modes:**
- `npm run dev` - Direct Fastify server (port 3000) - fastest for development
- `npm run offline` - Lambda simulation (port 3001) - closest to production behavior

## Project Structure

```
admin-node-backend/
├── src/
│   ├── app.ts          # Fastify app configuration
│   ├── server.ts       # Local development server
│   ├── main.ts         # Lambda handler
│   ├── config.ts       # MongoDB & AWS configuration
│   ├── types.ts        # TypeScript type definitions
│   ├── routes/         # API route handlers
│   │   ├── carriers.ts
│   │   ├── vehicles.ts
│   │   ├── regions.ts
│   │   ├── transit-hubs.ts
│   │   ├── pictures.ts
│   │   └── vehicle-series.ts
│   ├── middleware/     # Fastify middleware
│   │   └── authentication.ts
│   └── utils/          # Helper utilities
│       ├── helpers.ts
│       └── s3.ts
├── dist/               # Compiled JavaScript (generated)
├── tsconfig.json       # TypeScript configuration
├── serverless.yml      # Serverless Framework config
├── package.json
├── .gitignore
├── README.md
└── SERVERLESS.md       # Detailed serverless guide
```

## Documentation

- [README.md](./README.md) - This file (getting started)
- [AUTH.md](./AUTH.md) - Authentication guide and token management
- [SERVERLESS.md](./SERVERLESS.md) - Detailed serverless configuration and deployment guide

## License

ISC

