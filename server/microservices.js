import { spawn } from 'child_process';

const services = [
  { name: 'auth', script: 'auth-service.js' },
  { name: 'medicines', script: 'medicines-service.js' },
  { name: 'pharmacies', script: 'pharmacies-service.js' },
  { name: 'orders', script: 'orders-service.js' },
  { name: 'addresses', script: 'addresses-service.js' },
  { name: 'favorites', script: 'favorites-service.js' },
  { name: 'prescriptions', script: 'prescriptions-service.js' },
];

const children = services.map((service) => {
  const child = spawn(process.execPath, [service.script], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.warn(`[microservices] ${service.name} stopped via signal ${signal}`);
      return;
    }

    if (code !== 0) {
      console.error(`[microservices] ${service.name} exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });

  return child;
});

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(exitCode), 250);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('[microservices] Started PharmFind microservices:', services.map((service) => service.name).join(', '));
