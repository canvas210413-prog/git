import crypto from "crypto";

export type MallSessionUser = {
  id: string;
  email: string;
  name: string;
};

type SessionPayload = {
  v: 1;
  sub: string;
  email: string;
  name: string;
  exp: number;
};

const COOKIE_NAME = "mall_session";

function getSecret(): Buffer {
  const secret = process.env.MALL_SESSION_SECRET || "default-mall-secret-change-in-production";
  return Buffer.from(secret, "utf-8");
}

function base64url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function unbase64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(data: string): string {
  return base64url(crypto.createHmac("sha256", getSecret()).update(data).digest());
}

export function createSessionToken(user: MallSessionUser, maxAgeSeconds: number): string {
  const payload: SessionPayload = {
    v: 1,
    sub: user.id,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };

  const body = base64url(Buffer.from(JSON.stringify(payload), "utf-8"));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): MallSessionUser | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(unbase64url(body).toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }

  if (payload.v !== 1) return null;
  if (!payload.sub || !payload.email || !payload.name) return null;
  if (typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return { id: payload.sub, email: payload.email, name: payload.name };
}

export async function getSessionUserFromCookies(): Promise<MallSessionUser | null> {
  // next/headers cookies() is only available in Server Components/Route Handlers
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cookies } = require("next/headers") as typeof import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionUserFromRequestCookies(getCookie: (name: string) => string | undefined): MallSessionUser | null {
  const token = getCookie(COOKIE_NAME);
  if (!token) return null;
  return verifySessionToken(token);
}

export function buildSessionCookie(token: string, maxAgeSeconds: number) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
