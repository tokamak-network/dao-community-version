# Fetch Caching Best Practices

## Problem Statement

When building frontend applications, it's common to encounter scenarios where:

- Multiple components request the same data simultaneously
- Failed requests (404, network errors) are retried repeatedly
- Console logs become cluttered with redundant error messages
- Network requests are unnecessarily duplicated

This leads to poor performance, excessive server load, and degraded developer experience.

## Solution: Dual-Layer Promise Caching

Implement a dual-layer caching strategy that prevents both redundant requests and excessive error logging.

### Implementation Pattern

```typescript
// Dual cache system
const promiseCache = new Map<string, Promise<DataType | null>>();
const resultCache = new Map<string, { result: DataType | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchData(id: number): Promise<DataType | null> {
  const cacheKey = `${id}-${networkName}`;
  const now = Date.now();

  // 1. Check completed results cache
  const cached = resultCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  // 2. Check ongoing requests
  if (promiseCache.has(cacheKey)) {
    return promiseCache.get(cacheKey)!;
  }

  // 3. Start new request and cache the promise
  const promise = fetchDataInternal(id, cacheKey, now);
  promiseCache.set(cacheKey, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    // Clean up promise cache after completion
    promiseCache.delete(cacheKey);
  }
}

async function fetchDataInternal(
  id: number,
  cacheKey: string,
  timestamp: number
): Promise<DataType | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const result = null;
      resultCache.set(cacheKey, { result, timestamp });

      // Log errors only once per cache key
      if (response.status !== 404) {
        const errorCached = resultCache.get(cacheKey);
        if (!errorCached || errorCached.timestamp !== timestamp) {
          console.error(`Error fetching data for ${id}:`, response.status);
        }
      }
      return result;
    }

    const data = await response.json();
    resultCache.set(cacheKey, { result: data, timestamp });
    return data;
  } catch (error) {
    const result = null;
    resultCache.set(cacheKey, { result, timestamp });

    // Log errors only once per cache key
    const errorCached = resultCache.get(cacheKey);
    if (!errorCached || errorCached.timestamp !== timestamp) {
      console.error(`Network error fetching data for ${id}:`, error);
    }
    return result;
  }
}
```

### How It Works

#### Layer 1: Result Cache

- Stores completed results (success or failure) for 5 minutes
- Prevents any network requests for cached items
- Includes both successful data and null results from errors

#### Layer 2: Promise Cache

- Stores ongoing Promise objects
- Multiple simultaneous calls return the same Promise
- Automatically cleaned up after Promise resolves

### Benefits

1. **Eliminates Redundant Requests**

   - Before: 5 components calling same API = 5 HTTP requests
   - After: 5 components calling same API = 1 HTTP request

2. **Reduces Error Log Noise**

   - Before: Every failed request logs an error
   - After: Only first failure per cache key logs an error

3. **Improves Performance**

   - Faster response times for cached results
   - Reduced server load
   - Better user experience

4. **Handles Edge Cases**
   - Network failures are cached to prevent retry storms
   - 404 responses are silently cached (often expected)
   - Successful requests override previous error caches

### Usage Examples

#### Before: Multiple Network Requests

```javascript
// Component A
const metadata1 = await getAgendaMetadata(123); // HTTP request

// Component B (simultaneous)
const metadata2 = await getAgendaMetadata(123); // Another HTTP request

// Component C (simultaneous)
const metadata3 = await getAgendaMetadata(123); // Yet another HTTP request
```

#### After: Single Network Request

```javascript
// Component A
const metadata1 = await getAgendaMetadata(123); // HTTP request

// Component B (simultaneous)
const metadata2 = await getAgendaMetadata(123); // Returns same Promise

// Component C (simultaneous)
const metadata3 = await getAgendaMetadata(123); // Returns same Promise

// All three get the same result, but only one HTTP request is made
```

### Configuration Options

```typescript
// Adjust cache duration based on data volatility
const CACHE_DURATION = {
  STATIC_DATA: 30 * 60 * 1000,      // 30 minutes
  DYNAMIC_DATA: 5 * 60 * 1000,      // 5 minutes
  REAL_TIME_DATA: 30 * 1000,        // 30 seconds
};

// Optional: Clear cache on specific events
function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of resultCache.keys()) {
      if (key.includes(pattern)) {
        resultCache.delete(key);
      }
    }
  } else {
    resultCache.clear();
    promiseCache.clear();
  }
}
```

### When to Use This Pattern

✅ **Good for:**

- API calls with high probability of duplication
- Data that doesn't change frequently
- Error-prone external services
- Development environments with frequent refetching

❌ **Avoid for:**

- Real-time data that must always be fresh
- User-specific data that shouldn't be shared
- One-time operations (file uploads, mutations)

### Testing Considerations

```typescript
// Clear caches between tests
beforeEach(() => {
  promiseCache.clear();
  resultCache.clear();
});

// Test cache behavior
test('should cache successful results', async () => {
  const result1 = await fetchData(123);
  const result2 = await fetchData(123);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(result1).toBe(result2);
});
```

### Migration Guide

1. **Identify problematic fetch functions**

   - Look for functions called multiple times with same parameters
   - Check network tab for duplicate requests
   - Review console for repeated error messages

2. **Apply caching pattern**

   - Extract internal fetch logic
   - Add dual-layer caching
   - Update error logging

3. **Test thoroughly**

   - Verify single requests for duplicate calls
   - Check error logging frequency
   - Confirm cache expiration works

4. **Monitor performance**
   - Measure reduction in network requests
   - Verify improved response times
   - Check memory usage of caches

This pattern significantly improves application performance and developer experience by eliminating redundant network requests and reducing log noise.
