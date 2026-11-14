/**
 * Encryption for private project details.
 *
 * Content is sealed at build time with AES-256-GCM and a PBKDF2-SHA-256 key derived from
 * a password. The password is never written to the repository: it is supplied when the
 * ciphertext is generated and again by the reader in the browser. Without the password
 * the site only ships ciphertext.
 */
export type PrivateLang = 'en' | 'zh';

export interface PrivateLink {
  label: string;
  url: string;
}

export interface PrivateImage {
  alt: string;
  type: string;
  /** Base64-encoded bytes; encrypted together with the rest of the bundle. */
  data: string;
}

export interface PrivateContent {
  summary?: string;
  goal?: string;
  architecture?: string;
  role?: string;
  results?: string;
  stack?: string[];
  links?: PrivateLink[];
  images?: PrivateImage[];
  /** Pre-rendered HTML from a Markdown document; encrypted and injected after unlock. */
  html?: string;
  body?: string;
}

export type PrivateBundle = Partial<Record<PrivateLang, PrivateContent>>;

export interface PrivatePayload {
  v: 1;
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

export const PBKDF2_ITERATIONS = 600_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBundle(
  bundle: PrivateBundle,
  password: string
): Promise<PrivatePayload> {
  if (!password) throw new Error('password is required');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(bundle))
  );
  return {
    v: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptBundle(
  payload: PrivatePayload,
  password: string
): Promise<PrivateBundle> {
  if (payload?.v !== 1 || payload.kdf !== 'PBKDF2-SHA-256') {
    throw new Error('unsupported payload');
  }
  const key = await deriveKey(password, fromBase64(payload.salt), payload.iterations);
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.ciphertext)
    );
  } catch {
    throw new Error('invalid password or payload');
  }
  return JSON.parse(decoder.decode(plain)) as PrivateBundle;
}
