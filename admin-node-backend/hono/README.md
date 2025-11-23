# Admin Node Backend (Hono)

A modern backend API built with Hono and TypeScript.

> **Note:** This is the Hono implementation. See [../README.md](../README.md) for an overview of both implementations (Fastify and Hono).

## Features

- ⚡ Ultrafast with Hono (5x faster than Express)
- 🔒 Simple token-based authentication
- 📝 Structured logging
- 🎯 Modern ES modules (ESM)
- 🔄 Hot reload in development mode
- 💪 Full TypeScript support with strict mode
- ☁️ AWS Lambda ready with @hono/aws-lambda
- 🌐 Edge-ready (can run on Cloudflare Workers, Deno, Bun)

## Prerequisites

- Node.js 18 or higher

## Installation

```bash
npm install
```

## Usage

### Development Mode (with hot reload)

Run the local Hono server with hot reload:

```bash
npm run dev
```

Server runs on `http://localhost:8080`

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
- `GET /health` - Health check endpoint (no auth required)

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

### Required Variables
- `MONGODB_URL` - MongoDB connection string (e.g., `mongodb://localhost:27017/travel-admin`)
- `AUTH_TOKEN` - Authentication token (exactly 64 characters, hexadecimal)

### Optional Variables
- `PORT` - Server port (default: 8080)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment mode (development/production)
- `BDC_API_KEY` - BigDataCloud API key for timezone lookups
- `AWS_REGION` - AWS region for S3 (default: us-east-2)

Example `.env` file:
```env
PORT=8080
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

## Authentication

All routes (except `/health`) require authentication. Include the token in the `Authorization` header:

```bash
curl http://localhost:8080/carriers \
  -H "Authorization: Bearer your_64_character_token_here"
```

See [../fastify/AUTH.md](../fastify/AUTH.md) for detailed authentication documentation (applies to both implementations).

## Deployment

### AWS Lambda

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

This starts the server on `http://localhost:3001` and simulates the AWS Lambda environment.

## Why Hono?

Hono is a modern web framework that's:

- **Ultrafast** - 5x faster than Express, optimized for edge computing
- **Lightweight** - ~13KB bundle size (vs Express ~200KB)
- **Standards-based** - Uses Web Standards API (Request, Response, Headers)
- **Universal** - Runs on Node.js, Deno, Bun, Cloudflare Workers, AWS Lambda
- **TypeScript-first** - Excellent type inference and autocomplete
- **Simple** - Clean API similar to Express but more modern

## Project Structure

```
admin-node-backend/hono/
├── src/
│   ├── app.ts          # Hono app configuration
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
│   ├── middleware/     # Hono middleware
│   │   └── authentication.ts
│   └── utils/          # Helper utilities
│       ├── helpers.ts
│       └── s3.ts
├── dist/               # Compiled JavaScript (generated)
├── tsconfig.json       # TypeScript configuration
├── serverless.yml      # Serverless Framework config
├── package.json
└── README.md           # This file
```

## Differences from Fastify Implementation

This is the Hono implementation with identical functionality to the Fastify version:

| Feature | Fastify | Hono |
|---------|------------------------------|---------------------------|
| Performance | Very Fast | **Ultrafast** (5x faster) |
| Bundle Size | ~500KB | **~13KB** |
| Framework | Fastify | Hono |
| Standards | Node.js-specific | **Web Standards** |
| Edge Ready | No | **Yes** |
| TypeScript | Good | **Excellent** |
| API Style | Fastify decorators | Clean context-based |

Both backends have identical functionality and API routes.

## License

ISC


