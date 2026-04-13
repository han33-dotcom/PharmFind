import cors from 'cors';
import express from 'express';
import { getAllowedOrigins, getEnv, isProductionEnvironment } from './env.js';

const buildCorsOptions = () => {
  const allowedOrigins = new Set(getAllowedOrigins());

  if (allowedOrigins.size === 0) {
    return { origin: true };
  }

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.has(origin));
    },
  };
};

export const applyCommonMiddleware = (app, { jsonLimit = '1mb' } = {}) => {
  app.disable('x-powered-by');

  if (getEnv('TRUST_PROXY', isProductionEnvironment() ? 'true' : 'false') === 'true') {
    app.set('trust proxy', 1);
  }

  const corsOptions = buildCorsOptions();
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json({ limit: jsonLimit }));
  app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
};

export const sendHealthResponse = (res, service) => {
  res.json({
    status: 'ok',
    service,
    environment: getEnv('NODE_ENV', 'development'),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
