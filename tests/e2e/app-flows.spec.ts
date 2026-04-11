import { expect, test } from "@playwright/test";
import {
  apiBaseUrls,
  getJson,
  patchJson,
  postJson,
  randomId,
  registerUser,
} from "./helpers/api";
import { loginViaUi } from "./helpers/ui";

const prescriptionUpload = {
  name: "prescription.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=",
    "base64",
  ),
};

test("patient can place a prescription checkout order in the browser", async ({ page, request }) => {
  const suffix = randomId("patient-checkout");
  const pharmacist = await registerUser(request, "pharmacist", suffix);
  const patient = await registerUser(request, "patient", suffix);

  const pharmacy = await postJson<{ id: number; name: string }>(
    request,
    `${apiBaseUrls.pharmacies}/pharmacies/register`,
    {
      name: `E2E Pharmacy ${suffix}`,
      address: "E2E Street, Beirut",
      phone: "+96115550000",
      hours: { open: "08:00", close: "22:00" },
    },
    pharmacist.token,
    201,
  );

  await postJson(
    request,
    `${apiBaseUrls.pharmacies}/pharmacies/me/inventory`,
    {
      medicineId: 2,
      price: 95,
      quantity: 8,
    },
    pharmacist.token,
    201,
  );

  await postJson(
    request,
    `${apiBaseUrls.addresses}/users/me/addresses`,
    {
      nickname: "Home",
      fullName: "Patient E2E",
      address: "123 Test Street",
      building: "Block B",
      floor: "4",
      phoneNumber: "+96170001111",
      additionalDetails: "Use side entrance",
    },
    patient.token,
    201,
  );

  await loginViaUi(page, patient.user.email, "StrongPass123!", "/dashboard");

  await page.goto(`/pharmacy/${pharmacy.id}`);
  const medicineCard = page.getByTestId("medicine-card-2");
  await expect(medicineCard).toBeVisible();
  await page.getByTestId("open-add-to-cart-2").click();
  await page.getByTestId("confirm-add-to-cart-2").click();

  await page.goto("/cart");
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();

  await page.locator('input[type="file"]').setInputFiles(prescriptionUpload);
  await page.getByLabel("Cash on Delivery").click();
  await page.getByRole("button", { name: "Place Order" }).click();

  await expect(page).toHaveURL(/\/order-confirmation\?orderId=/);
  await expect(page.getByRole("heading", { name: "Order Placed Successfully!" })).toBeVisible();
  await expect(page.getByText("Augmentin 1g x 1")).toBeVisible();
  await page.getByRole("button", { name: "Track Order" }).click();
  await expect(page).toHaveURL(/\/orders\/ORD-/);
});

test("pharmacist can accept a pending order in the browser", async ({ page, request }) => {
  const suffix = randomId("pharmacist-review");
  const pharmacist = await registerUser(request, "pharmacist", suffix);
  const patient = await registerUser(request, "patient", suffix);

  const pharmacy = await postJson<{ id: number; name: string }>(
    request,
    `${apiBaseUrls.pharmacies}/pharmacies/register`,
    {
      name: `Review Pharmacy ${suffix}`,
      address: "Review Street, Beirut",
      phone: "+96116660000",
      hours: { open: "08:00", close: "22:00" },
    },
    pharmacist.token,
    201,
  );

  await postJson(
    request,
    `${apiBaseUrls.pharmacies}/pharmacies/me/inventory`,
    {
      medicineId: 2,
      price: 88,
      quantity: 10,
    },
    pharmacist.token,
    201,
  );

  const uploadedPrescription = await postJson<{ id: string }>(
    request,
    `${apiBaseUrls.prescriptions}/prescriptions/upload`,
    {
      fileUrl: `data:${prescriptionUpload.mimeType};base64,${prescriptionUpload.buffer.toString("base64")}`,
      fileName: prescriptionUpload.name,
      fileType: prescriptionUpload.mimeType,
      fileSize: prescriptionUpload.buffer.length,
    },
    patient.token,
    201,
  );

  const orderId = `ORD-E2E-${suffix}`;
  await postJson(
    request,
    `${apiBaseUrls.orders}/orders`,
    {
      orderId,
      items: [
        {
          medicineId: 2,
          medicineName: "Augmentin 1g",
          pharmacyId: pharmacy.id,
          pharmacyName: pharmacy.name,
          quantity: 1,
          price: 88,
          type: "delivery",
          requiresPrescription: true,
        },
      ],
      subtotal: 88,
      deliveryFees: 1,
      total: 89,
      deliveryAddress: "Review Address",
      phoneNumber: "+96170001111",
      paymentMethod: "cash_delivery",
      prescriptionId: uploadedPrescription.id,
    },
    patient.token,
    201,
  );

  await patchJson(
    request,
    `${apiBaseUrls.prescriptions}/prescriptions/${uploadedPrescription.id}`,
    { orderId },
    patient.token,
  );

  await loginViaUi(page, pharmacist.user.email, "StrongPass123!", "/pharmacist/dashboard");
  await page.goto("/pharmacist/orders");
  await expect(page.getByTestId(`pharmacist-order-${orderId}`)).toBeVisible();
  await page.getByTestId(`review-order-${orderId}`).click();
  await expect(page).toHaveURL(new RegExp(`/pharmacist/orders/${orderId}$`));
  await page.getByRole("button", { name: "Accept Order" }).first().click();
  await page.getByRole("button", { name: "Accept Order" }).last().click();
  await expect(page).toHaveURL(/\/pharmacist\/orders$/);

  const updatedOrder = await getJson<{ status: string }>(
    request,
    `${apiBaseUrls.orders}/orders/pharmacist/${orderId}`,
    pharmacist.token,
  );
  expect(updatedOrder.status).toBe("Confirmed");
});

test("driver can accept and complete a delivery in the browser", async ({ page, request }) => {
  const suffix = randomId("driver-lifecycle");
  const pharmacist = await registerUser(request, "pharmacist", suffix);
  const patient = await registerUser(request, "patient", suffix);
  const driver = await registerUser(request, "driver", suffix);

  const pharmacy = await postJson<{ id: number; name: string }>(
    request,
    `${apiBaseUrls.pharmacies}/pharmacies/register`,
    {
      name: `Driver Pharmacy ${suffix}`,
      address: "Driver Street, Beirut",
      phone: "+96117770000",
      hours: { open: "08:00", close: "22:00" },
    },
    pharmacist.token,
    201,
  );

  await postJson(
    request,
    `${apiBaseUrls.pharmacies}/pharmacies/me/inventory`,
    {
      medicineId: 1,
      price: 25,
      quantity: 10,
    },
    pharmacist.token,
    201,
  );

  const orderId = `ORD-DRV-${suffix}`;
  await postJson(
    request,
    `${apiBaseUrls.orders}/orders`,
    {
      orderId,
      items: [
        {
          medicineId: 1,
          medicineName: "Panadol Extra",
          pharmacyId: pharmacy.id,
          pharmacyName: pharmacy.name,
          quantity: 1,
          price: 25,
          type: "delivery",
          requiresPrescription: false,
        },
      ],
      subtotal: 25,
      deliveryFees: 1,
      total: 26,
      deliveryAddress: "Driver Address",
      phoneNumber: "+96170001111",
      paymentMethod: "cash_delivery",
    },
    patient.token,
    201,
  );

  await patchJson(
    request,
    `${apiBaseUrls.orders}/orders/pharmacist/${orderId}/status`,
    {
      status: "Confirmed",
      note: "Ready for driver pickup",
    },
    pharmacist.token,
  );

  await loginViaUi(page, driver.user.email, "StrongPass123!", "/driver/dashboard");
  await page.goto("/driver/available");
  await expect(page.getByTestId(`delivery-order-${orderId}`)).toBeVisible();
  await page.getByTestId(`accept-delivery-${orderId}`).click();
  await expect(page).toHaveURL(/\/driver\/active$/);

  await page.getByRole("button", { name: "Picked Up from Pharmacy" }).click();
  await expect(page.getByText("PICKED UP", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "In Transit to Customer" }).click();
  await expect(page.getByText("IN TRANSIT", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark as Delivered" }).click();
  await expect(page.getByText("Delivery Completed!")).toBeVisible();

  const deliveredOrder = await getJson<{ status: string }>(
    request,
    `${apiBaseUrls.orders}/orders/${orderId}`,
    patient.token,
  );
  expect(deliveredOrder.status).toBe("Delivered");
});
