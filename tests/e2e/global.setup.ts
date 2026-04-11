import { backupAndResetData } from "./data-store";

async function globalSetup() {
  await backupAndResetData();
}

export default globalSetup;
