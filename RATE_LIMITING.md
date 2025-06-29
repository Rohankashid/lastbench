# Rate Limiting Implementation

This document describes the rate limiting implementation for the LastBench application.

## Overview

Rate limiting has been implemented to protect API endpoints from abuse by bots or malicious users. The system uses an in-memory LRU cache to track requests per client and applies different limits based on the endpoint type.

## Configuration

### Rate Limit Configurations

Different endpoints have different rate limiting rules:

```typescript
RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  auth: {
    uniqueTokenPerInterval: 500,
    interval: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },
  // Upload endpoints - moderate limits
  upload: {
    uniqueTokenPerInterval: 1000,
    interval: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },
  // Delete endpoints - moderate limits
  delete: {
    uniqueTokenPerInterval: 1000,
    interval: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 deletes per minute
  },
  // General API endpoints - more lenient
  general: {
    uniqueTokenPerInterval: 2000,
    interval: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Test endpoints - very lenient
  test: {
    uniqueTokenPerInterval: 1000,
    interval: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 requests per minute
  },
}
```

## Implementation Details

### Client Identification

The system identifies clients using the following priority:
1. Real IP address from various headers (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`)
2. Falls back to user agent if IP is not available
3. Handles IPv6 addresses and localhost properly

### Storage

- Uses LRU cache with 10,000 item limit
- 5-minute TTL for cache entries
- In-memory storage (resets on server restart)

### Rate Limiting Logic

1. **Sliding Window**: Uses a sliding window approach where requests older than the interval are discarded
2. **Request Counting**: Tracks timestamps of requests within the window
3. **Limit Enforcement**: Blocks requests when the count exceeds the limit

## API Endpoints with Rate Limiting

### Protected Endpoints

| Endpoint | Method | Rate Limit | Purpose |
|----------|--------|------------|---------|
| `/api/upload` | POST | 10/min | File uploads |
| `/api/delete` | DELETE | 20/min | File deletions |
| `/api/test-s3` | GET | 50/min | S3 testing |
| `/api/test-s3-delete` | POST | 50/min | S3 delete testing |
| `/api/test-env` | GET | 50/min | Environment testing |
| `/api/rate-limit-status` | GET | 30/min | Rate limit monitoring |

## Response Headers

Rate-limited endpoints include the following headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when the limit resets
- `Retry-After`: Seconds to wait before retrying (when rate limited)

## Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

With HTTP status code `429 Too Many Requests`.

## Monitoring and Debugging

### Rate Limit Status Endpoint

Access `/api/rate-limit-status` to monitor rate limiting:

- **Get configurations**: `GET /api/rate-limit-status`
- **Get client info**: `GET /api/rate-limit-status?action=info&identifier=<client_id>`
- **Clear cache**: `GET /api/rate-limit-status?action=clear`

### Example Usage

```bash
# Get rate limit configurations
curl http://localhost:3000/api/rate-limit-status

# Get info for a specific client (development only)
curl "http://localhost:3000/api/rate-limit-status?action=info&identifier=ip:192.168.1.1"

# Clear rate limit cache (development only)
curl "http://localhost:3000/api/rate-limit-status?action=clear"
```

## Adding Rate Limiting to New Endpoints

### Method 1: Using the Wrapper Function

```typescript
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

async function myHandler(req: NextRequest) {
  // Your API logic here
  return NextResponse.json({ success: true });
}

// Export with rate limiting
export const POST = withRateLimit(myHandler, RATE_LIMIT_CONFIGS.general);
```

### Method 2: Manual Implementation

```typescript
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // Check rate limit
  const rateLimitResult = rateLimit(req, RATE_LIMIT_CONFIGS.general);
  
  if (rateLimitResult.isLimited) {
    return rateLimitResult.response!;
  }
  
  // Your API logic here
  const response = NextResponse.json({ success: true });
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIGS.general.maxRequests!.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
  
  return response;
}
```

## Custom Rate Limit Configuration

You can create custom rate limit configurations:

```typescript
const customConfig = {
  uniqueTokenPerInterval: 1000,
  interval: 30 * 1000, // 30 seconds
  maxRequests: 5, // 5 requests per 30 seconds
};

export const POST = withRateLimit(myHandler, customConfig);
```

## Production Considerations

### Scaling

The current implementation uses in-memory storage, which means:
- Rate limits reset when the server restarts
- Multiple server instances won't share rate limit data
- Consider using Redis or a database for production scaling

### Monitoring

- Monitor rate limit violations in production
- Set up alerts for unusual traffic patterns
- Log rate limit events for analysis

### Security

- Rate limit status endpoint is disabled in production
- Client identification uses multiple fallback methods
- Consider implementing additional security measures (CAPTCHA, etc.)

## Testing Rate Limiting

### Manual Testing

```bash
# Test upload rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/upload \
    -F "file=@test.txt"
  echo "Request $i"
  sleep 1
done
```

### Automated Testing

Create test scripts to verify rate limiting behavior:

```javascript
// test-rate-limit.js
const axios = require('axios');

async function testRateLimit() {
  const promises = [];
  
  for (let i = 0; i < 15; i++) {
    promises.push(
      axios.post('http://localhost:3000/api/upload', 
        { file: 'test' }, 
        { timeout: 5000 }
      ).catch(err => ({ status: err.response?.status, data: err.response?.data }))
    );
  }
  
  const results = await Promise.all(promises);
  console.log('Results:', results.map(r => r.status || r.data));
}

testRateLimit();
```

## Troubleshooting

### Common Issues

1. **Rate limits too strict**: Adjust the `maxRequests` value in the configuration
2. **Rate limits not working**: Check that the `withRateLimit` wrapper is properly applied
3. **Client identification issues**: Verify IP headers are being set by your proxy/load balancer

### Debug Commands

```bash
# Check rate limit status
curl http://localhost:3000/api/rate-limit-status

# Test specific endpoint
curl -X POST http://localhost:3000/api/upload -F "file=@test.txt"

# Monitor headers
curl -I -X POST http://localhost:3000/api/upload -F "file=@test.txt"
```

## Future Enhancements

1. **Redis Integration**: Use Redis for distributed rate limiting
2. **Dynamic Limits**: Adjust limits based on user roles or behavior
3. **Geographic Limits**: Different limits for different regions
4. **Whitelist/Blacklist**: Allow/block specific IPs or user agents
5. **Rate Limit Analytics**: Track and analyze rate limit patterns 