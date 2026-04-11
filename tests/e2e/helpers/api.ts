import { APIRequestContext, expect } from "@playwright/test";

export const apiBaseUrls = {
  auth: "http://127.0.0.1:4000/api",
  medicines: "http://127.0.0.1:4001/api",
  pharmacies: "http://127.0.0.1:4002/api",
  orders: "http://127.0.0.1:4003/api",
  addresses: "http://127.0.0.1:4004/api",
  favorites: "http://127.0.0.1:4005/api",
  prescriptions: "http://127.0.0.1:4006/api",
} as const;

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    role: "patient" | "pharmacist" | "driver";
  };
  message?: string;
};

export async function postJson<T>(
  request: APIRequestContext,
  url: string,
  body?: unknown,
  token?: string,
  expectedStatus = 200,
): Promise<T> {
  const response = await request.post(url, {
    data: body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  expect(response.status()).toBe(expectedStatus);
  return (await response.json()) as T;
}

export async function patchJson<T>(
  request: APIRequestContext,
  url: string,
  body?: unknown,
  token?: string,
  expectedStatus = 200,
): Promise<T> {
  const response = await request.patch(url, {
    data: body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  expect(response.status()).toBe(expectedStatus);
  return (await response.json()) as T;
}

export async function getJson<T>(
  request: APIRequestContext,
  url: string,
  token?: string,
  expectedStatus = 200,
): Promise<T> {
  const response = await request.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  expect(response.status()).toBe(expectedStatus);
  return (await response.json()) as T;
}

export function randomId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export async function registerUser(
  request: APIRequestContext,
  role: "patient" | "pharmacist" | "driver",
  suffix: string,
) {
  const numericSuffix = suffix.replace(/\D/g, "").slice(-8).padStart(8, "0");
  const phonePrefix = role === "patient" ? "71" : role === "pharmacist" ? "72" : "73";

  return postJson<AuthResponse>(
    request,
    `${apiBaseUrls.auth}/auth/register`,
    {
      email: `${role}.${suffix}@example.com`,
      password: "StrongPass123!",
      fullName: `${role[0].toUpperCase()}${role.slice(1)} ${suffix}`,
      phone: `+961${phonePrefix}${numericSuffix}`,
      role,
    },
    undefined,
    201,
  );
}
