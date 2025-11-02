import crypto from 'crypto';

/**
 * Encryption Service for Password Management
 * Uses AES-256-GCM for authenticated encryption
 * 
 * Inspired by IT Glue and Hudu security practices
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 32 bytes = 256 bits
const IV_LENGTH = 16; // 16 bytes for GCM
const SALT_LENGTH = 32; // 32 bytes for key derivation
const TAG_LENGTH = 16; // 16 bytes for GCM auth tag

interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
}

/**
 * Derive encryption key from master key and tenant ID (PBKDF2)
 */
function deriveKey(masterKey: string, tenantId: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, `${masterKey}-${tenantId}`, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Get master encryption key from environment
 */
function getMasterKey(): string {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY || process.env.MASTER_KEY;
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY or MASTER_KEY environment variable is required');
  }
  if (masterKey.length < 32) {
    throw new Error('Master key must be at least 32 characters long');
  }
  return masterKey;
}

/**
 * Encrypt a password using AES-256-GCM
 * @param plaintext - The password to encrypt
 * @param tenantId - Optional tenant ID for key derivation
 * @returns Encrypted data with IV, tag, and salt
 */
export function encryptPassword(plaintext: string, tenantId?: string): EncryptionResult {
  try {
    const masterKey = getMasterKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = tenantId 
      ? deriveKey(masterKey, tenantId, salt)
      : crypto.createHash('sha256').update(masterKey).digest();
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
    };
  } catch (error: any) {
    console.error('[Encryption] Error encrypting password:', error);
    throw new Error(`Failed to encrypt password: ${error.message}`);
  }
}

/**
 * Decrypt a password using AES-256-GCM
 * @param encryptedData - The encryption result object
 * @param tenantId - Optional tenant ID for key derivation
 * @returns Decrypted password
 */
export function decryptPassword(encryptedData: EncryptionResult, tenantId?: string): string {
  try {
    const masterKey = getMasterKey();
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = tenantId
      ? deriveKey(masterKey, tenantId, salt)
      : crypto.createHash('sha256').update(masterKey).digest();
    
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    console.error('[Encryption] Error decrypting password:', error);
    throw new Error(`Failed to decrypt password: ${error.message}`);
  }
}

/**
 * Generate a secure random key for encryption
 * @returns Hex-encoded random key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Hash a password for storage (bcrypt alternative, simpler for dev)
 * Note: For production, consider using bcrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [saltHex, hashHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
    return computedHash.toString('hex') === hashHex;
  } catch {
    return false;
  }
}

