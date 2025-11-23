# Serverless Configuration Guide

This document explains how to run and deploy the admin backend using Serverless Framework.

## Overview

The backend can run in three modes:

1. **Local Development** (`npm run dev`) - Direct Fastify server on port 3000
2. **Serverless Offline** (`npm run offline`) - Lambda simulation on port 3001
3. **AWS Lambda** (`npm run deploy`) - Production deployment

## Prerequisites

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Required
MONGODB_URL=mongodb://localhost:27017/travel-admin
AUTH_TOKEN=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Optional
BDC_API_KEY=your-bdc-api-key
AWS_REGION=us-east-2
NODE_ENV=development
```

Generate a secure 64-character token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# or
openssl rand -hex 32
```

### 3. AWS Credentials (for deployment only)

```bash
aws configure
```

## Running Serverless Offline

Serverless Offline simulates AWS Lambda + API Gateway locally, giving you a development environment that closely matches production.

### Start Offline Server

```bash
npm run offline
```

This will:
- Build the TypeScript code
- Start the Lambda simulation
- Listen on `http://localhost:3001`
- Hot reload is NOT enabled (rebuild required for changes)

### Configuration

The offline configuration is in `serverless.yml`:

```yaml
custom:
  serverless-offline:
    httpPort: 3001              # Main HTTP port
    host: 0.0.0.0               # Listen on all interfaces
    noPrependStageInUrl: true   # Don't add /dev/ prefix
    lambdaPort: 3002            # Lambda invocation port
    websocketPort: 3003         # WebSocket port
```

### Testing Routes

All routes work the same as in development mode:

```bash
# Health check
curl http://localhost:3001/health

# Get carriers
curl http://localhost:3001/carriers

# Get vehicles
curl http://localhost:3001/vehicles
```

## Deployment to AWS

### Deploy to Development

```bash
npm run deploy
```

This deploys to the `dev` stage by default.

### Deploy to Production

```bash
serverless deploy --stage prod
```

### Environment Variables in AWS

The serverless.yml automatically passes environment variables from your `.env` file to Lambda:

```yaml
environment:
  MONGODB_URL: ${env:MONGODB_URL}
  AUTH_TOKEN: ${env:AUTH_TOKEN}
  BDC_API_KEY: ${env:BDC_API_KEY, ''}
  AWS_REGION: ${self:provider.region}
```

**⚠️ Security Note:** For production, use AWS Secrets Manager or Parameter Store instead of `.env` files.

### View Deployment Info

```bash
serverless info
```

### View Logs

```bash
serverless logs -f api
```

### Remove Deployment

```bash
serverless remove
```

## Differences Between Modes

| Feature | Local Dev | Serverless Offline | AWS Lambda |
|---------|-----------|-------------------|------------|
| Port | 3000 | 3001 | N/A (API Gateway) |
| Hot Reload | ✅ Yes | ❌ No | ❌ No |
| Build Required | ❌ No | ✅ Yes | ✅ Yes |
| MongoDB Required | ✅ Yes | ✅ Yes | ✅ Yes (remote) |
| AWS Services | Local/Mock | Local/Mock | ✅ Real |
| Cold Start | ❌ No | ✅ Simulated | ✅ Yes |
| API Gateway | ❌ No | ✅ Simulated | ✅ Real |

## Troubleshooting

### Port Already in Use

If port 3001 is in use, update `serverless.yml`:

```yaml
custom:
  serverless-offline:
    httpPort: 3005  # Change to any available port
```

### MongoDB Connection Failed

Ensure MongoDB is running and the `MONGODB_URL` in your `.env` is correct:

```bash
# Check MongoDB is running
mongosh --eval "db.adminCommand('ping')"
```

### Lambda Handler Not Found

Ensure the build was successful and `dist/main.js` exists:

```bash
npm run build
ls dist/main.js
```

### Environment Variables Not Loading

Serverless Offline loads environment variables from:
1. `.env` file (via dotenv in your code)
2. `serverless.yml` environment section
3. System environment variables

Make sure your `.env` file is in the root directory.

## Route Testing Examples

### Carriers

```bash
# Get all carriers
curl http://localhost:3001/carriers

# Create carrier
curl -X POST http://localhost:3001/carriers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Airline",
    "iata": "TA",
    "icao": "TST",
    "callsign": "TEST",
    "country": "US",
    "active": true
  }'
```

### Vehicles

```bash
# Get all vehicles
curl http://localhost:3001/vehicles

# Create vehicle
curl -X POST http://localhost:3001/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "icao": "B738",
    "iata": "738",
    "title": "Boeing 737-800",
    "manufacturer": "Boeing",
    "mode": "airplane"
  }'
```

### Transit Hubs

```bash
# Get all transit hubs
curl http://localhost:3001/transit-hubs

# Create transit hub
curl -X POST http://localhost:3001/transit-hubs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John F. Kennedy International",
    "iata": "JFK",
    "icao": "KJFK",
    "city": "New York",
    "country": "US",
    "latitude": 40.6413,
    "longitude": -73.7781,
    "altitude": 13,
    "mode": "airport"
  }'
```

## Performance Tips

### 1. Use Serverless Offline for Integration Testing

While `npm run dev` is faster for rapid development, use `npm run offline` for:
- Testing Lambda behavior
- Integration testing
- Pre-deployment validation

### 2. Keep MongoDB Connection Warm

In production, consider using MongoDB Atlas with connection pooling to minimize cold start impact.

### 3. Monitor Cold Starts

Lambda functions have cold starts. The first request after deployment or idle time will be slower.

## Additional Resources

- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [Serverless Offline Plugin](https://github.com/dherault/serverless-offline)
- [Fastify AWS Lambda](https://github.com/fastify/aws-lambda-fastify)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

