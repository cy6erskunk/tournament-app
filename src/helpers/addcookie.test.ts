import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/headers
const mockSet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: mockSet,
  })),
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
  },
}));

import { addCookie } from './addcookie';

const COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

describe('addCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set test values. `next` augments ProcessEnv to declare NODE_ENV as a
    // readonly property, so stub the environment through vitest rather than
    // assigning to it directly.
    vi.stubEnv('JWT_SECRET', 'test-secret');
    vi.stubEnv('NODE_ENV', 'production');
    // Clear VERCEL_ENV by default
    vi.stubEnv('VERCEL_ENV', undefined);
  });

  afterEach(() => {
    // Restore every environment variable stubbed during the test
    vi.unstubAllEnvs();
  });

  it('should set cookie with secure flags in production', async () => {
    const result = await addCookie('testuser', 'admin');

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('token', 'mock-jwt-token', {
      httpOnly: true,
      secure: true, // should be true in production
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  });

  it('should set cookie with secure=false in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const result = await addCookie('testuser', 'user');

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('token', 'mock-jwt-token', {
      httpOnly: true,
      secure: false, // should be false in development
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  });

  it('should set cookie with secure=true when VERCEL_ENV is production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NODE_ENV', 'production'); // NODE_ENV is always production on Vercel

    const result = await addCookie('testuser', 'admin');

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('token', 'mock-jwt-token', {
      httpOnly: true,
      secure: true, // should be true for Vercel production
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  });

  it('should set cookie with secure=false when VERCEL_ENV is preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('NODE_ENV', 'production'); // NODE_ENV is always production on Vercel

    const result = await addCookie('testuser', 'user');

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('token', 'mock-jwt-token', {
      httpOnly: true,
      secure: false, // should be false for Vercel preview
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  });

  it('should set cookie with secure=false when VERCEL_ENV is development', async () => {
    vi.stubEnv('VERCEL_ENV', 'development');
    vi.stubEnv('NODE_ENV', 'production'); // NODE_ENV is always production on Vercel

    const result = await addCookie('testuser', 'user');

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('token', 'mock-jwt-token', {
      httpOnly: true,
      secure: false, // should be false for Vercel development
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  });

  it('should return success with token value', async () => {
    const result = await addCookie('testuser', 'admin');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('mock-jwt-token');
    }
  });

  it('should return error if JWT_SECRET is not set', async () => {
    vi.stubEnv('JWT_SECRET', undefined);

    const result = await addCookie('testuser', 'admin');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Error creating token/cookie');
    }
  });
});
