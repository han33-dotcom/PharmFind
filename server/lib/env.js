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

export const isProductionEnvironment = () => getEnv('NODE_ENV', 'development') === 'production';

export const getNumberEnv = (name, fallbackValue) => {
  const value = getEnv(name, fallbackValue);
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a valid number.`);
  }

  return parsed;
};

export const getAllowedOrigins = () => {
  const configuredOrigins = getEnv('ALLOWED_ORIGINS', '');
  if (configuredOrigins) {
    return configuredOrigins
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  const developmentOrigins = [
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  const frontendUrl = getEnv('FRONTEND_URL', '');
  if (isProductionEnvironment()) {
    return frontendUrl ? [frontendUrl] : [];
  }

  return frontendUrl
    ? [...new Set([frontendUrl, ...developmentOrigins])]
    : developmentOrigins;
};

export const getJwtSecret = () => {
  const configuredSecret = process.env.JWT_SECRET;
  if (configuredSecret) {
    return configuredSecret;
  }

  if (!isProductionEnvironment()) {
    const fallbackSecret = 'pharmfind-dev-insecure-jwt-secret';
    console.warn(
      'JWT_SECRET is not set. Create server/.env from server/.env.example to avoid using the insecure development fallback.'
    );
    return fallbackSecret;
  }

  throw new Error('JWT_SECRET must be set in production.');
};

const assertRequiredEnv = (name, errorMessage) => {
  if (!process.env[name]) {
    throw new Error(errorMessage ?? `${name} must be set.`);
  }
};

export const validateServiceEnvironment = (
  serviceName,
  {
    defaultPort,
    requireFrontendUrl = false,
    requireDatabaseInProduction = true,
    validateEmailSettings = false,
  } = {},
) => {
  getNumberEnv('PORT', String(defaultPort));

  if (!isProductionEnvironment()) {
    return;
  }

  getJwtSecret();

  if (requireDatabaseInProduction) {
    assertRequiredEnv('DATABASE_URL', `[${serviceName}] DATABASE_URL must be set in production.`);
  }

  if (requireFrontendUrl) {
    assertRequiredEnv('FRONTEND_URL', `[${serviceName}] FRONTEND_URL must be set in production.`);
  }

  if (getAllowedOrigins().length === 0) {
    throw new Error(`[${serviceName}] ALLOWED_ORIGINS or FRONTEND_URL must be set in production.`);
  }

  if (validateEmailSettings && getEnv('EMAIL_MODE', 'console') === 'smtp') {
    assertRequiredEnv('SMTP_HOST', `[${serviceName}] SMTP_HOST must be set when EMAIL_MODE=smtp.`);
    assertRequiredEnv('SMTP_PORT', `[${serviceName}] SMTP_PORT must be set when EMAIL_MODE=smtp.`);
    assertRequiredEnv('SMTP_USER', `[${serviceName}] SMTP_USER must be set when EMAIL_MODE=smtp.`);
    assertRequiredEnv('SMTP_PASS', `[${serviceName}] SMTP_PASS must be set when EMAIL_MODE=smtp.`);
    assertRequiredEnv('EMAIL_FROM', `[${serviceName}] EMAIL_FROM must be set when EMAIL_MODE=smtp.`);
  }
};
