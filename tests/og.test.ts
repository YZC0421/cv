import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeXml, stringUnits, wrapTitle } from '../src/lib/og.ts';

test('escapeXml escapes markup characters', () => {
  assert.equal(escapeXml('a & b <c> "d"'), 'a &amp; b &lt;c&gt; &quot;d&quot;');
});

test('stringUnits counts CJK as one em and Latin as less', () => {
  assert.equal(stringUnits('中文'), 2);
  assert.ok(stringUnits('abcd') > 2 && stringUnits('abcd') < 2.5);
});

test('wrapTitle breaks Chinese titles into full-width lines', () => {
  const lines = wrapTitle('从一份单页简历到 Astro 站点的迁移记录与取舍', 8, 3);
  assert.ok(lines.length > 1);
  assert.ok(lines.every((line) => stringUnits(line) <= 8));
});

test('wrapTitle keeps short titles on one line', () => {
  assert.deepEqual(wrapTitle('Astro 构建'), ['Astro 构建']);
});

test('wrapTitle truncates with an ellipsis past the last allowed line', () => {
  const lines = wrapTitle('这是一个非常非常非常非常非常非常长的标题', 4, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines[1]!.endsWith('…'));
});
