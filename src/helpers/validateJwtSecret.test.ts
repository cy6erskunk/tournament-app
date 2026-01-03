import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateJwtSecret, validateJwtSecretOrThrow } from './validateJwtSecret';

describe('validateJwtSecret', () => {
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    originalJwtSecret = process.env.JWT_SECRET;
  });

  afterEach(() => {
    if (originalJwtSecret !== undefined) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  describe('with undefined secret', () => {
    it('should return invalid with appropriate error', () => {
      const result = validateJwtSecret(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('not set');
    });
  });

  describe('with weak secrets', () => {
    it('should reject "secret"', () => {
      const result = validateJwtSecret('secret');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(err => err.toLowerCase().includes('weak'))).toBe(true);
    });

    it('should reject "password"', () => {
      const result = validateJwtSecret('password');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.toLowerCase().includes('weak'))).toBe(true);
    });

    it('should reject "test"', () => {
      const result = validateJwtSecret('test');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.toLowerCase().includes('weak'))).toBe(true);
    });

    it('should reject case-insensitive weak secrets', () => {
      const result = validateJwtSecret('SECRET');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.toLowerCase().includes('weak'))).toBe(true);
    });

    it('should reject secrets containing weak values', () => {
      const result = validateJwtSecret('mysecret123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.toLowerCase().includes('weak') || err.includes('substring'))).toBe(true);
    });
  });

  describe('with short secrets', () => {
    it('should reject secrets shorter than 32 characters', () => {
      const result = validateJwtSecret('a'.repeat(31));
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('too short'))).toBe(true);
    });

    it('should reject empty string', () => {
      const result = validateJwtSecret('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Empty string is treated as "not set" which is semantically correct
      expect(result.errors[0]).toContain('not set');
    });
  });

  describe('with strong secrets', () => {
    it('should accept a 32-character random hex string', () => {
      const strongSecret = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b';
      const result = validateJwtSecret(strongSecret);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept a 64-character random hex string', () => {
      const strongSecret = 'a'.repeat(64);
      const result = validateJwtSecret(strongSecret);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept base64-encoded random bytes', () => {
      const strongSecret = 'Tm90QVdlYWtTZWNyZXRUaGlzSXNTdHJvbmdFbm91Z2hGb3JQcm9kdWN0aW9uVXNl';
      const result = validateJwtSecret(strongSecret);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('with multiple validation errors', () => {
    it('should report all errors for weak and short secret', () => {
      const result = validateJwtSecret('secret');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors.some(err => err.includes('too short'))).toBe(true);
      expect(result.errors.some(err => err.toLowerCase().includes('weak'))).toBe(true);
    });
  });
});

describe('validateJwtSecretOrThrow', () => {
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    originalJwtSecret = process.env.JWT_SECRET;
  });

  afterEach(() => {
    if (originalJwtSecret !== undefined) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  it('should throw error when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    
    expect(() => validateJwtSecretOrThrow()).toThrow();
  });

  it('should throw error with weak secret', () => {
    process.env.JWT_SECRET = 'secret';
    
    expect(() => validateJwtSecretOrThrow()).toThrow();
  });

  it('should throw error with helpful message', () => {
    process.env.JWT_SECRET = 'secret';
    
    try {
      validateJwtSecretOrThrow();
      expect.fail('Should have thrown an error');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain('CRITICAL SECURITY ERROR');
        expect(error.message).toContain('node -e');
        expect(error.message).toContain('randomBytes');
      }
    }
  });

  it('should not throw with strong secret', () => {
    process.env.JWT_SECRET = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b';
    
    expect(() => validateJwtSecretOrThrow()).not.toThrow();
  });
});
