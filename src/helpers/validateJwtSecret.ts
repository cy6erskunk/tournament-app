/**
 * Validates JWT secret strength to prevent weak secrets in production
 */

const MINIMUM_SECRET_LENGTH = 32;
const WEAK_SECRETS = [
  'secret',
  'password',
  'test',
  'development',
  'dev',
  '123456',
  'changeme',
  'default',
];

export interface JwtSecretValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates that the JWT secret is strong enough for production use
 * @param secret - The JWT secret to validate
 * @returns Validation result with isValid flag and error messages
 */
export function validateJwtSecret(secret: string | undefined): JwtSecretValidationResult {
  const errors: string[] = [];

  if (!secret) {
    errors.push('JWT_SECRET environment variable is not set');
    return { isValid: false, errors };
  }

  // Check minimum length
  if (secret.length < MINIMUM_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET is too short (${secret.length} characters). Minimum length is ${MINIMUM_SECRET_LENGTH} characters.`
    );
  }

  // Check for weak/common secrets (case-insensitive)
  // Note: Empty strings are already handled above by the !secret check
  if (secret.length > 0) {
    const lowerSecret = secret.toLowerCase();
    for (const weakSecret of WEAK_SECRETS) {
      if (lowerSecret === weakSecret) {
        errors.push(
          `JWT_SECRET is a weak or common value ("${weakSecret}"). Use a cryptographically secure random string.`
        );
        break; // Only report the first match
      } else if (lowerSecret.includes(weakSecret)) {
        errors.push(
          `JWT_SECRET contains a weak or common substring ("${weakSecret}"). Use a cryptographically secure random string.`
        );
        break; // Only report the first match
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates JWT secret and throws an error if validation fails
 * Use this at application startup to prevent running with weak secrets
 */
export function validateJwtSecretOrThrow(): void {
  const secret = process.env.JWT_SECRET;
  const result = validateJwtSecret(secret);

  if (!result.isValid) {
    const errorMessage = [
      '┌─────────────────────────────────────────────────────────────────┐',
      '│ CRITICAL SECURITY ERROR: Weak or Invalid JWT Secret            │',
      '└─────────────────────────────────────────────────────────────────┘',
      '',
      ...result.errors.map(err => `  ❌ ${err}`),
      '',
      'To generate a strong JWT secret, run:',
      '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      '',
      'Then set it in your environment:',
      '  - Development: Add to .env file',
      '  - Production: Set in your deployment platform (e.g., Vercel)',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }
}
