import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..", "..");
const runtimeDir = path.join(repoRoot, ".e2e-runtime");
const backupDir = path.join(runtimeDir, "server-data-backup");
const serverDataDir = path.join(repoRoot, "server", "data");

export const dataFiles = [
  "users.json",
  "medicines.json",
  "pharmacies.json",
  "pharmacy_inventory.json",
  "orders.json",
  "addresses.json",
  "favorites.json",
  "email_verifications.json",
  "password_resets.json",
  "prescriptions.json",
] as const;

const preservedCollections = new Set<string>(["medicines.json"]);

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function backupAndResetData() {
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });
  await fs.mkdir(serverDataDir, { recursive: true });

  for (const fileName of dataFiles) {
    const sourcePath = path.join(serverDataDir, fileName);
    const backupPath = path.join(backupDir, fileName);

    if (await fileExists(sourcePath)) {
      await fs.copyFile(sourcePath, backupPath);
    } else {
      await fs.writeFile(backupPath, "[]\n");
    }

    if (!preservedCollections.has(fileName)) {
      await fs.writeFile(sourcePath, "[]\n");
    }
  }
}

export async function restoreData() {
  for (const fileName of dataFiles) {
    const sourcePath = path.join(serverDataDir, fileName);
    const backupPath = path.join(backupDir, fileName);

    if (await fileExists(backupPath)) {
      await fs.copyFile(backupPath, sourcePath);
    }
  }

  await fs.rm(runtimeDir, { recursive: true, force: true });
}
