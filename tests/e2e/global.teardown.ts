import { restoreData } from "./data-store";

async function globalTeardown() {
  await restoreData();
}

export default globalTeardown;
