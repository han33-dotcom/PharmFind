const stores = new Map();

const getStore = (key) => {
  if (!stores.has(key)) {
    stores.set(key, new Map());
  }

  return stores.get(key);
};

export const createRateLimiter = ({
  key,
  windowMs,
  max,
  message = 'Too many requests. Please try again later.',
}) => {
  const store = getStore(key);

  return (req, res, next) => {
    const now = Date.now();
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const current = store.get(clientKey);

    if (!current || current.resetAt <= now) {
      store.set(clientKey, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;

    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      res.status(429).json({ error: { message, status: 429 } });
      return;
    }

    next();
  };
};
