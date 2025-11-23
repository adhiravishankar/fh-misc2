# Authentication Guide

This backend uses simple token-based authentication. All routes (except `/health`) require a valid 64-character authentication token.

## Setup

### 1. Generate a Secure Token

Generate a 64-character hexadecimal token using one of these methods:

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Example output:**
```
a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890
```

### 2. Add Token to .env File

Add the generated token to your `.env` file:

```env
AUTH_TOKEN=a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890
MONGODB_URL=mongodb://localhost:27017/travel-admin
```

### 3. Restart Your Server

If the server is running, restart it to load the new token:

```bash
# Development mode
npm run dev

# Or serverless offline
npm run offline
```

## Using the Authentication Token

### Making Authenticated Requests

Include the token in the `Authorization` header with the `Bearer` prefix:

```bash
curl http://localhost:3000/carriers \
  -H "Authorization: Bearer a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890"
```

### JavaScript/TypeScript Example

```typescript
const AUTH_TOKEN = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

const response = await fetch('http://localhost:3000/carriers', {
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### Python Example

```python
import requests

AUTH_TOKEN = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890'

headers = {
    'Authorization': f'Bearer {AUTH_TOKEN}',
    'Content-Type': 'application/json'
}

response = requests.get('http://localhost:3000/carriers', headers=headers)
data = response.json()
```

### Ky Example

```typescript
import ky from 'ky';

const AUTH_TOKEN = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

const api = ky.create({
  prefixUrl: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Make requests
const carriers = await api.get('carriers').json();
const vehicles = await api.get('vehicles').json();
```

## Routes That Require Authentication

All routes require the authentication token **EXCEPT**:

- `GET /health` - Health check endpoint (no auth required)

## Error Responses

### Missing Authorization Header

```json
{
  "error": "Authorization required"
}
```
Status: `401 Unauthorized`

### Invalid Format

```json
{
  "error": "Invalid authorization format. Use: Bearer <token>"
}
```
Status: `401 Unauthorized`

### Invalid Token Length

```json
{
  "error": "Invalid token length. Token must be 64 characters."
}
```
Status: `401 Unauthorized`

### Wrong Token

```json
{
  "error": "Invalid token"
}
```
Status: `401 Unauthorized`

### Server Not Configured

```json
{
  "error": "Server configuration error: AUTH_TOKEN not set"
}
```
Status: `500 Internal Server Error`

## Security Features

### Constant-Time Comparison

The authentication middleware uses constant-time string comparison to prevent timing attacks. This ensures that an attacker cannot determine if they're getting closer to the correct token by measuring response times.

### Token Requirements

- **Length**: Exactly 64 characters
- **Format**: Hexadecimal (0-9, a-f)
- **Entropy**: 256 bits (32 bytes)

### Best Practices

1. **Never commit tokens to version control**
   - Add `.env` to `.gitignore` ✅ (already done)
   - Use environment variables in CI/CD

2. **Use different tokens for different environments**
   ```env
   # Development
   AUTH_TOKEN=dev_token_here...

   # Production
   AUTH_TOKEN=prod_token_here...
   ```

3. **Rotate tokens periodically**
   - Generate a new token
   - Update `.env` file
   - Restart the server
   - Update all clients

4. **Store tokens securely in production**
   - Use AWS Secrets Manager
   - Use AWS Systems Manager Parameter Store
   - Use environment variables in Lambda

5. **Use HTTPS in production**
   - Never send tokens over unencrypted HTTP
   - API Gateway provides HTTPS automatically

## Testing Authentication

### Test with Valid Token

```bash
# Set your token
export AUTH_TOKEN="a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890"

# Make request
curl http://localhost:3000/carriers \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

Expected: `200 OK` with carrier data

### Test without Token

```bash
curl http://localhost:3000/carriers
```

Expected: `401 Unauthorized` with error message

### Test with Wrong Token

```bash
curl http://localhost:3000/carriers \
  -H "Authorization: Bearer wrong_token_here"
```

Expected: `401 Unauthorized` with "Invalid token length" or "Invalid token"

### Test Health Endpoint (No Auth Required)

```bash
curl http://localhost:3000/health
```

Expected: `200 OK` with health status (no token needed)

## Deployment Considerations

### AWS Lambda

When deploying to AWS Lambda, set the `AUTH_TOKEN` as an environment variable:

**Option 1: Using serverless.yml**
```yaml
environment:
  AUTH_TOKEN: ${env:AUTH_TOKEN}
```

**Option 2: Using AWS Console**
1. Go to Lambda function
2. Configuration → Environment variables
3. Add `AUTH_TOKEN` key with your token value

**Option 3: Using AWS Secrets Manager (Recommended for Production)**
```yaml
environment:
  AUTH_TOKEN: ${ssm:/myapp/auth-token}
```

### API Gateway

If using API Gateway, you can also implement authentication at the API Gateway level:
- API Keys
- Custom authorizers
- Cognito user pools

However, the application-level token check provides an additional security layer.

## Migrating from JWT

If you previously used JWT authentication:

1. Generate a new 64-character token
2. Replace `JWT_SECRET` with `AUTH_TOKEN` in `.env`
3. Update client code to send the token directly (no JWT generation needed)
4. Remove JWT-related dependencies if no longer needed

## Troubleshooting

### "Server configuration error: AUTH_TOKEN not set"

**Solution**: Add `AUTH_TOKEN` to your `.env` file and restart the server.

### "AUTH_TOKEN must be exactly 64 characters long"

**Solution**: Regenerate your token using the commands above. It must be exactly 64 hex characters.

### Token works locally but not in Lambda

**Solution**: Ensure the `AUTH_TOKEN` environment variable is set in Lambda:
```bash
serverless deploy
```

Check that serverless.yml includes:
```yaml
environment:
  AUTH_TOKEN: ${env:AUTH_TOKEN}
```

### CORS issues with Authorization header

**Solution**: The server already includes CORS with `origin: true`. If you have specific origins, update `src/config.ts`:
```typescript
corsOrigins: ['https://your-frontend.com']
```


