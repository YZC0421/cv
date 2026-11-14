#!/usr/bin/env tsx
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
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
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

interface SourceImage {
  alt?: unknown;
  file?: unknown;
}
type SourceContent = Omit<PrivateContent, 'images' | 'html'> & { images?: SourceImage[] };
type SourceBundle = Partial<Record<(typeof LANGUAGES)[number], SourceContent>> & {
  document?: string;
};
interface Budget {
  total: number;
  images: number;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function assertSource(value: unknown): asserts value is SourceBundle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('source must be a JSON object keyed by "en" and/or "zh"');
  }
  const record = value as Record<string, unknown>;
  if (record.document !== undefined && typeof record.document !== 'string') {
    fail('"document" must be a .md file name inside private/');
  }
  const languages = Object.keys(record).filter((key) => key !== 'document');
  if (languages.length === 0) fail('source must contain at least one language block');
  for (const language of languages) {
    if (!(LANGUAGES as readonly string[]).includes(language)) {
      fail(`unknown language "${language}"; use "en" or "zh"`);
    }
    const content = record[language];
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
  budget: Budget
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
    budget.images += 1;
    if (budget.total > MAX_TOTAL_BYTES) {
      fail('images total more than 6 MB; compress them before encrypting');
    }
    resolved.push({ alt, type, data: bytes.toString('base64') });
  }
  return resolved;
}

function slugifyHeading(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g, (entity) => ENTITIES[entity] ?? entity);
  let slug = '';
  for (const char of text.trim().toLowerCase()) {
    if (/[a-z0-9\u4e00-\u9fff-]/.test(char)) slug += char;
    else if (/\s/.test(char)) slug += '-';
  }
  return slug;
}

function addHeadingIds(html: string): string {
  const used = new Map<string, number>();
  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (_match, level: string, inner: string) => {
    const base = slugifyHeading(inner);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
}

async function inlineDocumentImages(html: string, budget: Budget): Promise<string> {
  const sources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
  const resolved = new Map<string, string>();
  for (const src of new Set(sources)) {
    if (src.startsWith('data:')) continue;
    const file = path.basename(decodeURIComponent(src));
    const type = IMAGE_TYPES[path.extname(file).toLowerCase()];
    if (!type) fail(`document image "${file}" must be png, jpg, jpeg, webp or gif`);

    let bytes: Buffer | undefined;
    try {
      bytes = await readFile(path.join(MEDIA_DIR, file));
    } catch {
      fail(`missing ${path.join(MEDIA_DIR, file)}`);
    }
    if (!bytes) fail(`could not read ${file}`);
    if (bytes.length > MAX_IMAGE_BYTES) fail(`document image "${file}" is larger than 2 MB`);
    budget.total += bytes.length;
    budget.images += 1;
    if (budget.total > MAX_TOTAL_BYTES) {
      fail('images total more than 6 MB; compress them before encrypting');
    }
    resolved.set(src, `data:${type};base64,${bytes.toString('base64')}`);
  }
  return html.replace(
    /(<img\b[^>]*\bsrc=")([^"]+)(")/g,
    (match, before: string, src: string, after: string) => {
      const data = resolved.get(src);
      return data ? `${before}${data}${after}` : match;
    }
  );
}

async function renderDocument(fileName: string, budget: Budget): Promise<string> {
  if (path.basename(fileName) !== fileName || !fileName.endsWith('.md')) {
    fail('"document" must be a .md file name inside private/');
  }
  const filePath = path.join(SOURCE_DIR, fileName);
  let markdown: string | undefined;
  try {
    markdown = await readFile(filePath, 'utf8');
  } catch {
    fail(`missing ${filePath}`);
  }
  if (!markdown) fail(`could not read ${filePath}`);
  const html = marked.parse(markdown, { async: false, gfm: true }) as string;
  return inlineDocumentImages(addHeadingIds(html), budget);
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

const budget: Budget = { total: 0, images: 0 };
const resolved: PrivateBundle = {};
for (const language of LANGUAGES) {
  const content = bundle[language];
  if (!content) continue;
  const { images, ...rest } = content;
  const resolvedImages = images ? await resolveImages(language, images, budget) : undefined;
  resolved[language] = resolvedImages ? { ...rest, images: resolvedImages } : { ...rest };
}

if (bundle.document) {
  const html = await renderDocument(bundle.document, budget);
  for (const language of LANGUAGES) {
    const content = resolved[language];
    if (content) content.html = html;
  }
}

const password = (await readPassword()).trim();
if (password.length < 8) fail('password must be at least 8 characters');

const payload = await encryptBundle(resolved, password);
const targetPath = path.join(TARGET_DIR, `${slug}.json`);
await mkdir(TARGET_DIR, { recursive: true });
await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(
  `wrote ${targetPath} (${budget.images} image(s), PBKDF2 iterations: ${payload.iterations})`
);
