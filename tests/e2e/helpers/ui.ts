import { expect, Page } from "@playwright/test";

export async function loginViaUi(page: Page, email: string, password: string, expectedPath: string) {
  await page.goto("/");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(new RegExp(`${expectedPath.replace("/", "\\/")}$`));
}
