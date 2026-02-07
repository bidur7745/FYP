// Cache utility with expiration support
const CACHE_PREFIX = 'fyp_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached data if it exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {Object|null} - Cached data or null if expired/missing
 */
export const getCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp, ttl } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache has expired
    if (now - timestamp > (ttl || DEFAULT_TTL)) {
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

/**
 * Store data in cache with expiration
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export const setCache = (key, data, ttl = DEFAULT_TTL) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cache:', error);
    // If storage is full, try to clear old caches
    if (error.name === 'QuotaExceededError') {
      clearExpiredCaches();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error('Failed to set cache after cleanup:', retryError);
      }
    }
  }
};

/**
 * Remove specific cache entry
 * @param {string} key - Cache key to remove
 */
export const removeCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error removing cache:', error);
  }
};

/**
 * Clear all expired caches
 */
export const clearExpiredCaches = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp, ttl } = JSON.parse(cached);
            if (now - timestamp > (ttl || DEFAULT_TTL)) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error clearing expired caches:', error);
  }
};

/**
 * Clear all caches (useful for logout)
 */
export const clearAllCaches = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all caches:', error);
  }
};

/**
 * Get cache info (for debugging)
 */
export const getCacheInfo = () => {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
  return cacheKeys.map((key) => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { timestamp, ttl } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        const expiresIn = (ttl || DEFAULT_TTL) - age;
        return {
          key: key.replace(CACHE_PREFIX, ''),
          age: Math.round(age / 1000), // seconds
          expiresIn: Math.round(expiresIn / 1000), // seconds
          expired: expiresIn < 0,
        };
      }
    } catch (error) {
      return { key: key.replace(CACHE_PREFIX, ''), error: true };
    }
  });
};

