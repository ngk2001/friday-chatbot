interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

/**
 * Lightweight sliding-window rate limiter to protect free AI API quotas.
 * Note: In serverless environments, this protects per warm instance.
 */
export function checkRateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };

  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSec: 0 };
}

