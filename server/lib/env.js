import dotenv from 'dotenv';

let environmentLoaded = false;

export const loadServiceEnvironment = () => {
  if (!environmentLoaded) {
    dotenv.config();
    environmentLoaded = true;
  }
};

export const getEnv = (name, fallbackValue) => {
  const value = process.env[name];
  return value === undefined || value === '' ? fallbackValue : value;
};

export const getJwtSecret = () => {
  const configuredSecret = process.env.JWT_SECRET;
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== 'production') {
    const fallbackSecret = 'pharmfind-dev-insecure-jwt-secret';
    console.warn('JWT_SECRET is not set. Falling back to an insecure development secret.');
    return fallbackSecret;
  }

  throw new Error('JWT_SECRET must be set in production.');
};
