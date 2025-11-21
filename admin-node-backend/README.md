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

```bash
npm run dev
```

### Production Mode

First, build the TypeScript code:

```bash
npm run build
```

Then start the server:

```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check
```
GET /health
```

### Hello World
```
GET /api/hello
```

### Example POST
```
POST /api/data
Content-Type: application/json

{
  "key": "value"
}
```

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment mode (development/production)

## Deployment

### AWS Lambda

This project is configured to deploy as an AWS Lambda function using Serverless Framework.

#### Deploy to AWS:

```bash
npm run build
serverless deploy --stage prod
```

#### Test locally with serverless-offline:

```bash
serverless offline
```

## Project Structure

```
admin-node-backend/
├── src/
│   ├── app.ts          # Fastify app configuration
│   ├── server.ts       # Local development server
│   └── main.ts         # Lambda handler
├── dist/               # Compiled JavaScript (generated)
├── tsconfig.json       # TypeScript configuration
├── serverless.yml      # Serverless Framework config
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

## License

ISC

