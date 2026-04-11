import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');

const services = [
  { name: 'auth', script: path.join('services', 'auth.js') },
  { name: 'medicines', script: path.join('services', 'medicines.js') },
  { name: 'pharmacies', script: path.join('services', 'pharmacies.js') },
  { name: 'orders', script: path.join('services', 'orders.js') },
  { name: 'addresses', script: path.join('services', 'addresses.js') },
  { name: 'favorites', script: path.join('services', 'favorites.js') },
  { name: 'prescriptions', script: path.join('services', 'prescriptions.js') },
];

const children = services.map((service) => {
  const child = spawn(process.execPath, [service.script], {
    cwd: serverRoot,
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
