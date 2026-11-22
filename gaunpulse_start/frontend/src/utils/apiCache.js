/**
 * GaunPulse High-Performance Client-Side In-Memory Cache with SWR
 * (Stale-While-Revalidate) & Concurrent Request Deduplication.
 *
 * Scoped by authentication token to prevent cross-session cache pollution.
 */

const cacheStore = new Map();
const inFlightRequests = new Map();

function getCacheKey(url, token) {
  const tokenScope = token ? token.slice(-16) : 'anon';
  return `${tokenScope}:${url}`;
}

/**
 * Fetch JSON with in-memory caching and request deduplication.
 *
 * @param {string} url - API endpoint URL
 * @param {RequestInit} [options={}] - Standard fetch options
 * @param {object} [config={}]
 * @param {number} [config.ttlMs=60000] - Cache validity window (default 60s)
 * @param {boolean} [config.force=false] - Bypass cache and force network request
 * @param {function} [config.onBackgroundUpdate] - Callback if stale cache served and fresh data arrives
 * @returns {Promise<any>} Parsed JSON response
 */
export async function cachedFetchJson(
  url,
  options = {},
  { ttlMs = 60000, force = false, onBackgroundUpdate = null } = {}
) {
  const method = (options.method || 'GET').toUpperCase();
  const token = typeof window !== 'undefined' ? window.localStorage?.getItem('gaunpulse_auth_token') : null;
  const effectiveHeaders = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const effectiveOptions = { ...options, headers: effectiveHeaders };

  // Mutations (POST, PUT, PATCH, DELETE) bypass cache
  if (method !== 'GET') {
    const res = await fetch(url, effectiveOptions);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const err = new Error(errBody.message || `HTTP ${res.status}: ${res.statusText}`);
      err.status = res.status;
      err.data = errBody;
      throw err;
    }
    return res.json();
  }

  const cacheKey = getCacheKey(url, token);
  const now = Date.now();
  const cached = cacheStore.get(cacheKey);

  // 1. Fresh cache hit: return immediately with 0ms delay
  if (!force && cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // 2. Stale cache hit with SWR callback: return stale data immediately and revalidate in background
  if (!force && cached && onBackgroundUpdate) {
    triggerBackgroundRevalidation(url, effectiveOptions, cacheKey, ttlMs, onBackgroundUpdate);
    return cached.data;
  }

  // 3. Request deduplication: reuse in-flight promise if identical request is already underway
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 4. Fresh network fetch
  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, effectiveOptions);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const err = new Error(errBody.message || `HTTP ${res.status}: ${res.statusText}`);
        err.status = res.status;
        err.data = errBody;
        throw err;
      }
      const data = await res.json();
      cacheStore.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Background revalidation trigger for SWR
 */
function triggerBackgroundRevalidation(url, effectiveOptions, cacheKey, ttlMs, onBackgroundUpdate) {
  if (inFlightRequests.has(cacheKey)) return;

  const bgPromise = (async () => {
    try {
      const res = await fetch(url, effectiveOptions);
      if (!res.ok) return;
      const freshData = await res.json();
      cacheStore.set(cacheKey, { data: freshData, timestamp: Date.now() });
      if (typeof onBackgroundUpdate === 'function') {
        onBackgroundUpdate(freshData);
      }
    } catch {
      // Swallowed silently so background refresh doesn't disrupt user
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, bgPromise);
}

/**
 * Get synchronously from cache if present (even if stale), else null.
 */
export function getFromCache(url) {
  const token = typeof window !== 'undefined' ? window.localStorage?.getItem('gaunpulse_auth_token') : null;
  const cacheKey = getCacheKey(url, token);
  const entry = cacheStore.get(cacheKey);
  return entry ? entry.data : null;
}

/**
 * Invalidate cache entries matching a substring or RegExp.
 * Use after mutations (e.g. creating issues, updating action plans, adding villages, switching municipality, logging in/out).
 */
export function invalidateApiCache(pattern) {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  const isRegex = pattern instanceof RegExp;
  for (const key of cacheStore.keys()) {
    if (isRegex ? pattern.test(key) : key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
}
