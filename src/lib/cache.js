/**
 * Data Cache Utility
 * 
 * Simple in-memory cache with TTL support for frequently accessed data.
 * Reduces API calls for data that doesn't change frequently (partners, resources, lookups).
 * 
 * Features:
 * - TTL-based expiration
 * - Project-scoped cache keys
 * - Manual invalidation
 * - LRU-style cleanup when max entries reached
 * 
 * @version 1.0
 * @created 6 December 2025
 */

// Cache storage
const cache = new Map();

// Default TTL: 5 minutes (in milliseconds)
const DEFAULT_TTL = 5 * 60 * 1000;

// Maximum cache entries before cleanup
const MAX_ENTRIES = 100;

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {any} data - Cached data
 * @property {number} timestamp - When the entry was created
 * @property {number} ttl - Time to live in milliseconds
 * @property {number} accessCount - Number of times accessed
 * @property {number} lastAccess - Last access timestamp
 */

/**
 * Generate a cache key from components
 * @param {string} namespace - Cache namespace (e.g., 'partners', 'resources')
 * @param {string} projectId - Project ID for scoping
 * @param {string} [subkey] - Optional sub-key for specific queries
 * @returns {string} Cache key
 */
export function getCacheKey(namespace, projectId, subkey = '') {
  return `${namespace}:${projectId}${subkey ? `:${subkey}` : ''}`;
}

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if not found/expired
 */
export function getFromCache(key) {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check if expired
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  // Update access stats
  entry.accessCount++;
  entry.lastAccess = now;
  
  return entry.data;
}

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} [ttl=DEFAULT_TTL] - Time to live in milliseconds
 */
export function setInCache(key, data, ttl = DEFAULT_TTL) {
  // Cleanup if we're at capacity
  if (cache.size >= MAX_ENTRIES) {
    cleanupCache();
  }
  
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    accessCount: 1,
    lastAccess: Date.now()
  });
}

/**
 * Invalidate a specific cache entry
 * @param {string} key - Cache key to invalidate
 */
export function invalidateCache(key) {
  cache.delete(key);
}

/**
 * Invalidate all cache entries for a namespace
 * @param {string} namespace - Namespace to invalidate (e.g., 'partners')
 */
export function invalidateNamespace(namespace) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${namespace}:`)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate all cache entries for a project
 * @param {string} projectId - Project ID to invalidate
 */
export function invalidateProject(projectId) {
  for (const key of cache.keys()) {
    if (key.includes(`:${projectId}`)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Remove least recently used entries to make room
 * Removes 20% of entries with oldest lastAccess
 */
function cleanupCache() {
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
  
  const toRemove = Math.ceil(entries.length * 0.2);
  
  for (let i = 0; i < toRemove; i++) {
    cache.delete(entries[i][0]);
  }
}

/**
 * Get cache statistics (for debugging)
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  let totalSize = 0;
  let expiredCount = 0;
  const now = Date.now();
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      expiredCount++;
    }
    // Rough size estimate
    totalSize += JSON.stringify(entry.data).length;
  }
  
  return {
    entries: cache.size,
    expired: expiredCount,
    estimatedSizeKB: Math.round(totalSize / 1024),
    maxEntries: MAX_ENTRIES
  };
}

/**
 * Higher-order function to wrap service methods with caching
 * @param {string} namespace - Cache namespace
 * @param {Function} fetchFn - Async function to fetch data
 * @param {number} [ttl=DEFAULT_TTL] - Cache TTL
 * @returns {Function} Wrapped function with caching
 */
export function withCache(namespace, fetchFn, ttl = DEFAULT_TTL) {
  return async function cachedFetch(projectId, ...args) {
    // Generate cache key from arguments
    const subkey = args.length > 0 ? JSON.stringify(args) : '';
    const cacheKey = getCacheKey(namespace, projectId, subkey);
    
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Fetch fresh data
    const data = await fetchFn(projectId, ...args);
    
    // Cache the result
    setInCache(cacheKey, data, ttl);
    
    return data;
  };
}

// Predefined TTLs for common data types
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute - frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - moderately stable data
  LONG: 15 * 60 * 1000,      // 15 minutes - stable reference data
  VERY_LONG: 60 * 60 * 1000  // 1 hour - rarely changing data
};

export default {
  getCacheKey,
  getFromCache,
  setInCache,
  invalidateCache,
  invalidateNamespace,
  invalidateProject,
  clearCache,
  getCacheStats,
  withCache,
  CACHE_TTL
};
