import { loadServiceEnvironment } from './env.js';

loadServiceEnvironment();

export const loadDatabase = async (serviceName) => {
  if (process.env.DATABASE_URL) {
    const postgresModule = await import('../database/postgres.js');
    console.log(`[${serviceName}] Using PostgreSQL database`);
    return postgresModule.default;
  }

  const jsonModule = await import('../database.js');
  console.log(`[${serviceName}] Using JSON file-based database`);
  return jsonModule.default;
};
