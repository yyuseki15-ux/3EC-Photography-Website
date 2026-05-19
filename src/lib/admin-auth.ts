import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "admin_session";

function getEnv(name: "ADMIN_PASSWORD" | "ADMIN_SESSION_SECRET") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSessionSignature(value: string) {
  return createHmac("sha256", getEnv("ADMIN_SESSION_SECRET")).update(value).digest("hex");
}

export async function hasValidAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return false;
  }

  const [value, signature] = sessionCookie.split(".");

  if (!value || !signature) {
    return false;
  }

  const expectedSignature = createSessionSignature(value);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer) && value === "authenticated";
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  const value = "authenticated";
  const signature = createSessionSignature(value);

  cookieStore.set(ADMIN_SESSION_COOKIE, `${value}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function validateAdminPassword(password: string) {
  const expectedPassword = Buffer.from(getEnv("ADMIN_PASSWORD"));
  const suppliedPassword = Buffer.from(password);

  if (expectedPassword.length !== suppliedPassword.length) {
    return false;
  }

  return timingSafeEqual(expectedPassword, suppliedPassword);
}
