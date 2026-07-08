const isProduction = process.env.NODE_ENV === 'production';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction) {
    throw new Error('JWT_SECRET is required in production.');
  }
  return 'wellsync-development-secret-key-987654321';
}

export function getAppBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (baseUrl) return baseUrl.replace(/\/$/, '');
  if (isProduction) {
    throw new Error('NEXT_PUBLIC_APP_URL (or APP_URL) is required in production.');
  }
  return 'http://localhost:3000';
}
