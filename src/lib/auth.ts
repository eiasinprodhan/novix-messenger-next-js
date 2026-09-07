import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefresh';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

// 7-day long-lived admin access token to prevent session expiry during management operations
export function generateAdminAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 30-day rolling refresh token
export function generateRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export const verifyAuthToken = verifyAccessToken;

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}

// For API route protection
export function requireAuth(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { user };
}

// Generate a short-lived password reset token (15 min)
export function generateResetToken(payload: { userId: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET + '_reset', { expiresIn: '15m' });
}

export function verifyResetToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET + '_reset') as { userId: string; email: string };
  } catch {
    return null;
  }
}
