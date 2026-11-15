import test from 'node:test';
import assert from 'node:assert/strict';
import {
  backendSections,
  backendSectionSlugs,
  backendSectionTitle,
  findBackendSection,
} from '../src/lib/backend.ts';
import { backendNoteSchema } from '../src/lib/schema.ts';

const note = {
  title: 'SSO 单点登录',
  date: '2026-11-15',
  section: '08-authentication' as const,
  summary: '一次登录、多系统访问。',
};

test('backend defines 16 numbered sections', () => {
  assert.equal(backendSections.length, 16);
  assert.deepEqual(
    backendSections.map((section) => section.index),
    Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, '0'))
  );
});

test('backend section slugs are unique', () => {
  assert.equal(new Set(backendSectionSlugs).size, 16);
});

test('backend sections resolve by slug', () => {
  assert.equal(findBackendSection('08-authentication')?.title, '身份认证与权限管理');
  assert.equal(findBackendSection('99-unknown'), undefined);
});

test('backend section titles fall back to the slug', () => {
  assert.equal(backendSectionTitle('08-authentication'), '身份认证与权限管理');
  assert.equal(backendSectionTitle('08-authentication', 'en'), 'Authentication & Authorization');
  assert.equal(backendSectionTitle('99-unknown'), '99-unknown');
});

test('backend note accepts valid frontmatter and defaults', () => {
  const result = backendNoteSchema.safeParse(note);
  assert.equal(result.success, true);
  assert.deepEqual(result.success && result.data.tags, []);
  assert.equal(result.success && result.data.draft, false);
});

test('backend note rejects an unknown section', () => {
  assert.equal(backendNoteSchema.safeParse({ ...note, section: '99-unknown' }).success, false);
});
