/**
 * Share one in-flight / recent request between components (e.g. the finance dashboard starts the
 * forecast and Razorpay summary requests at the same time as its own, and the cards reuse them
 * instead of asking again once the page has rendered). Short-lived: answers older than `ttlMs`
 * are fetched again; `force` skips the cache (after a save).
 */
const store = new Map(); // key -> { at, promise }

export function cachedRequest(key, fn, { ttlMs = 15000, force = false } = {}) {
  const hit = store.get(key);
  if (!force && hit && Date.now() - hit.at < ttlMs) return hit.promise;
  const promise = Promise.resolve().then(fn);
  store.set(key, { at: Date.now(), promise });
  promise.catch(() => { if (store.get(key)?.promise === promise) store.delete(key); });
  return promise;
}
