import { randomBytes } from 'node:crypto';

export function createCspNonce(): string {
  return randomBytes(16).toString('base64url');
}
