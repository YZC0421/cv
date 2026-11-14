#!/usr/bin/env tsx
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { encryptBundle, type PrivateBundle } from '../src/lib/private.ts';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_DIR = path.join('private');
const TARGET_DIR = path.join('public', 'private');

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function assertBundle(value: unknown): asserts value is PrivateBundle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('source must be a JSON object keyed by "en" and/or "zh"');
  }
  const languages = Object.keys(value as Record<string, unknown>);
  if (languages.length === 0) fail('source must contain at least one language block');
  for (const language of languages) {
    if (language !== 'en' && language !== 'zh') {
      fail(`unknown language "${language}"; use "en" or "zh"`);
    }
    const content = (value as Record<string, unknown>)[language];
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      fail(`"${language}" must be an object`);
    }
  }
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
assertBundle(bundle);

const password = (await readPassword()).trim();
if (password.length < 8) fail('password must be at least 8 characters');

const payload = await encryptBundle(bundle, password);
const targetPath = path.join(TARGET_DIR, `${slug}.json`);
await mkdir(TARGET_DIR, { recursive: true });
await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`wrote ${targetPath} (PBKDF2 iterations: ${payload.iterations})`);
