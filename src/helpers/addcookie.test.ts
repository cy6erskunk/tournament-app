import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('addCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'production';
  });

  it('should set cookie with secure flags in production', async () => {
    const result = await addCookie('testuser', 'admin');

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('token', 'mock-jwt-token', {
      httpOnly: true,
      secure: true, // should be true in production
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/',
    });
  });

  it('should set cookie with secure=false in development', async () => {
    process.env.NODE_ENV = 'development';
    
    const result = await addCookie('testuser', 'user');

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('token', 'mock-jwt-token', {
      httpOnly: true,
      secure: false, // should be false in development
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
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
    delete process.env.JWT_SECRET;

    const result = await addCookie('testuser', 'admin');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Error creating token/cookie');
    }
  });
});
