(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!url.includes('action=events')) return originalFetch(input, init);

    const controller = new AbortController();
    const upstream = init.signal;
    if (upstream) {
      if (upstream.aborted) controller.abort(upstream.reason);
      else upstream.addEventListener('abort', () => controller.abort(upstream.reason), { once: true });
    }
    const timer = setTimeout(() => controller.abort(new DOMException('Live event search timed out', 'TimeoutError')), 25000);
    return originalFetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
})();