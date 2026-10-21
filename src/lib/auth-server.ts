import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TOKEN_TTL = '30d';

export type DecodedToken = { uid: string; role: string; organizationId?: string | null };

// Unlike the old Firestore user docs (which never held a password at all),
// rows from the `users` table carry `passwordHash` — every route that
// returns a user row (or an array of them) to the client MUST strip it
// first. Use this helper rather than spreading the row directly.
export function stripPassword<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...rest } = user;
  return rest;
}

export function stripPasswords<T extends { passwordHash?: string }>(users: T[]): Omit<T, 'passwordHash'>[] {
  return users.map(stripPassword);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAuthToken(payload: DecodedToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Drop-in replacement for `adminAuth.verifyIdToken(idToken)` — same shape
// (throws on an invalid/expired token, resolves to an object with `.uid`),
// so existing route handlers only need to swap the function name, nothing
// else about their control flow.
export async function verifyAuthToken(idToken: string): Promise<DecodedToken> {
  const decoded = jwt.verify(idToken, JWT_SECRET) as DecodedToken;
  return decoded;
}

// Convenience helper for NEW route handlers — extracts + verifies the
// Authorization header in one call, returning null instead of throwing so
// callers can do a plain `if (!decoded) return 401`.
export async function requireAuth(req: NextRequest): Promise<DecodedToken | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.replace('Bearer ', '');
  if (!idToken) return null;
  try {
    return await verifyAuthToken(idToken);
  } catch {
    return null;
  }
}

// Drop-in replacement for `adminAuth.createUser({ email, password, displayName })`
// — creates the user row with a hashed password and returns `{ uid }`.
export async function createUserRecord(params: {
  email: string; password: string; name?: string; role: string; organizationId?: string | null;
}): Promise<{ uid: string }> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, params.email)).limit(1);
  if (existing.length) {
    const err: any = new Error('auth/email-already-exists');
    err.code = 'auth/email-already-exists';
    throw err;
  }
  const uid = randomUUID();
  const passwordHash = await hashPassword(params.password);
  await db.insert(users).values({
    id: uid,
    email: params.email,
    passwordHash,
    name: params.name,
    displayName: params.name,
    role: params.role as any,
    organizationId: params.organizationId ?? null,
  });
  return { uid };
}

export async function deleteUserRecord(uid: string): Promise<void> {
  await db.delete(users).where(eq(users.id, uid));
}
