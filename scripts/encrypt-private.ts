#!/usr/bin/env tsx
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  encryptBundle,
  type PrivateBundle,
  type PrivateContent,
  type PrivateImage,
} from '../src/lib/private.ts';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_DIR = path.join('private');
const MEDIA_DIR = path.join(SOURCE_DIR, 'media');
const TARGET_DIR = path.join('public', 'private');
const LANGUAGES = ['en', 'zh'] as const;
const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 6 * 1024 * 1024;

interface SourceImage {
  alt?: unknown;
  file?: unknown;
}
type SourceContent = Omit<PrivateContent, 'images'> & { images?: SourceImage[] };
type SourceBundle = Partial<Record<(typeof LANGUAGES)[number], SourceContent>>;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function assertSource(value: unknown): asserts value is SourceBundle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('source must be a JSON object keyed by "en" and/or "zh"');
  }
  const languages = Object.keys(value as Record<string, unknown>);
  if (languages.length === 0) fail('source must contain at least one language block');
  for (const language of languages) {
    if (!(LANGUAGES as readonly string[]).includes(language)) {
      fail(`unknown language "${language}"; use "en" or "zh"`);
    }
    const content = (value as Record<string, unknown>)[language];
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      fail(`"${language}" must be an object`);
    }
    const images = (content as Record<string, unknown>).images;
    if (images !== undefined && !Array.isArray(images)) {
      fail(`"${language}.images" must be an array`);
    }
  }
}

async function resolveImages(
  language: string,
  images: SourceImage[],
  budget: { total: number }
): Promise<PrivateImage[]> {
  const resolved: PrivateImage[] = [];
  for (const [index, image] of images.entries()) {
    const label = `${language}.images[${index}]`;
    if (!image || typeof image !== 'object' || Array.isArray(image)) {
      fail(`${label} must be an object with "alt" and "file"`);
    }
    const alt = typeof image.alt === 'string' ? image.alt.trim() : '';
    const file = typeof image.file === 'string' ? image.file : '';
    if (!alt) fail(`${label}.alt must be a non-empty string`);
    if (!file || path.basename(file) !== file) {
      fail(`${label}.file must be a plain file name inside private/media`);
    }
    const type = IMAGE_TYPES[path.extname(file).toLowerCase()];
    if (!type) fail(`${label}.file "${file}" must be png, jpg, jpeg, webp or gif`);

    let bytes: Buffer | undefined;
    try {
      bytes = await readFile(path.join(MEDIA_DIR, file));
    } catch {
      fail(`missing ${path.join(MEDIA_DIR, file)}`);
    }
    if (!bytes) fail(`could not read ${file}`);
    if (bytes.length > MAX_IMAGE_BYTES) fail(`${label}.file "${file}" is larger than 2 MB`);
    budget.total += bytes.length;
    if (budget.total > MAX_TOTAL_BYTES) {
      fail('images total more than 6 MB; compress them before encrypting');
    }
    resolved.push({ alt, type, data: bytes.toString('base64') });
  }
  return resolved;
}

async function readPassword(): Promise<string> {
  const fromEnv = process.env.PRIVATE_PASSWORD;
  if (fromEnv) return fromEnv;

  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString('utf8').split(/\r?\n/)[0] ?? '';
  }

  process.stdout.write('Password: ');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  return new Promise<string>((resolve) => {
    let value = '';
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          process.stdout.write('\n');
          process.exit(130);
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };
    process.stdin.on('data', onData);
  });
}

const slug = process.argv[2];
if (!slug || !SLUG_PATTERN.test(slug)) {
  fail('usage: npm run private:encrypt -- <slug>   (slug must be kebab-case)');
}

const sourcePath = path.join(SOURCE_DIR, `${slug}.json`);
let source: string;
try {
  source = await readFile(sourcePath, 'utf8');
} catch {
  fail(`missing ${sourcePath}; keep the plaintext there (it is git-ignored)`);
}

let bundle: unknown;
try {
  bundle = JSON.parse(source);
} catch {
  fail(`${sourcePath} is not valid JSON`);
}
assertSource(bundle);

const budget = { total: 0 };
const resolved: PrivateBundle = {};
let imageCount = 0;
for (const language of LANGUAGES) {
  const content = bundle[language];
  if (!content) continue;
  const { images, ...rest } = content;
  const resolvedImages = images ? await resolveImages(language, images, budget) : undefined;
  imageCount += resolvedImages?.length ?? 0;
  resolved[language] = resolvedImages ? { ...rest, images: resolvedImages } : { ...rest };
}

const password = (await readPassword()).trim();
if (password.length < 8) fail('password must be at least 8 characters');

const payload = await encryptBundle(resolved, password);
const targetPath = path.join(TARGET_DIR, `${slug}.json`);
await mkdir(TARGET_DIR, { recursive: true });
await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(
  `wrote ${targetPath} (${imageCount} image(s), PBKDF2 iterations: ${payload.iterations})`
);
