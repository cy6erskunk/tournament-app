/**
 * Next.js Instrumentation
 * This file runs once when the server starts up.
 * Used to validate critical configuration like JWT secret strength.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { validateJwtSecretOrThrow } from './src/helpers/validateJwtSecret';

export async function register() {
  // Only run on Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs' || !process.env.NEXT_RUNTIME) {
    // Validate JWT secret at startup
    // This will throw an error and prevent server startup if the secret is weak
    validateJwtSecretOrThrow();
    
    console.log('✓ JWT_SECRET validation passed');
  }
}
