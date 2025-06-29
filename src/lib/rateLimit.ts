import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';


export interface RateLimitConfig {
  uniqueTokenPerInterval?: number; 
  interval?: number; 
  maxRequests?: number;
}

export const RATE_LIMIT_CONFIGS = {
  
  auth: {
    uniqueTokenPerInterval: 500,
    interval: 60 * 1000,
    maxRequests: 5, 
  },
  upload: {
    uniqueTokenPerInterval: 1000,
    interval: 60 * 1000, 
    maxRequests: 10,
  },
 
  delete: {
    uniqueTokenPerInterval: 1000,
    interval: 60 * 1000,
    maxRequests: 20,
  },
  general: {
    uniqueTokenPerInterval: 2000,
    interval: 60 * 1000,
    maxRequests: 100, 
  },
  test: {
    uniqueTokenPerInterval: 1000,
    interval: 60 * 1000,
    maxRequests: 50,
  },
} as const;

const tokenCache = new LRUCache<string, number[]>({
  max: 10000,
  ttl: 1000 * 60 * 5,
});


function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  let ip = req.ip || 
           (forwarded && forwarded.split(',')[0]) ||
           realIp ||
           cfConnectingIp ||
           'unknown';
  
  ip = ip.replace(/^::ffff:/, ''); // Remove IPv6 prefix
  
  if (ip === 'unknown' || ip === '127.0.0.1') {
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `ua:${userAgent.substring(0, 50)}`;
  }
  
  return `ip:${ip}`;
}


function isRateLimited(
  identifier: string,
  config: RateLimitConfig
): { isLimited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - config.interval!;
  
  // Get existing requests for this identifier
  const existingRequests = tokenCache.get(identifier) || [];
  
  // Filter requests within the current window
  const validRequests = existingRequests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  const isLimited = validRequests.length >= config.maxRequests!;
  
  // Calculate remaining requests
  const remaining = Math.max(0, config.maxRequests! - validRequests.length);
  

  const resetTime = now + config.interval!;
  
 
  if (!isLimited) {
    validRequests.push(now);
    tokenCache.set(identifier, validRequests);
  }
  
  return { isLimited, remaining, resetTime };
}


export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.general
): { isLimited: boolean; response?: NextResponse; remaining: number; resetTime: number } {
  const identifier = getClientIdentifier(req);
  const { isLimited, remaining, resetTime } = isRateLimited(identifier, config);
  
  if (isLimited) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      },
      { status: 429 }
    );
    
    response.headers.set('X-RateLimit-Limit', config.maxRequests!.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
    
    return { isLimited: true, response, remaining, resetTime };
  }
  
  return { isLimited: false, remaining, resetTime };
}


export function withRateLimit<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.general
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const rateLimitResult = rateLimit(req, config);
    
    if (rateLimitResult.isLimited) {
      return rateLimitResult.response!;
    }
    
    const response = await handler(req, ...args);
    response.headers.set('X-RateLimit-Limit', config.maxRequests!.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;
  };
}


export function getRateLimitInfo(identifier: string): {
  requests: number[];
  config: RateLimitConfig;
} {
  const requests = tokenCache.get(identifier) || [];
  return {
    requests,
    config: RATE_LIMIT_CONFIGS.general,
  };
}


export function clearRateLimitData(): void {
  tokenCache.clear();
} 