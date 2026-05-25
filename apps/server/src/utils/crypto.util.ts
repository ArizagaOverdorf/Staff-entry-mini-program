import * as crypto from 'crypto';

const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_HASH_KEY_LENGTH = 64;

export function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'base64'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'base64'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, PASSWORD_HASH_KEY_LENGTH).toString('hex');

  return `${PASSWORD_HASH_ALGORITHM}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, salt, hash] = storedHash.split(':');

  if (algorithm !== PASSWORD_HASH_ALGORITHM || !salt || !hash) {
    return false;
  }

  const passwordHash = crypto.scryptSync(password, salt, PASSWORD_HASH_KEY_LENGTH);
  const storedPasswordHash = Buffer.from(hash, 'hex');

  if (storedPasswordHash.length !== PASSWORD_HASH_KEY_LENGTH) {
    return false;
  }

  return crypto.timingSafeEqual(passwordHash, storedPasswordHash);
}
