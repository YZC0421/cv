import test from 'node:test';
import assert from 'node:assert/strict';
import { noteBody, paperNoteSeed, projectNoteSeed } from '../src/lib/note-templates.ts';

test('paperNoteSeed carries topics, category and DOI', () => {
  const seed = paperNoteSeed(
    {
      id: 'cvidl-2024-wheat',
      title: 'Wheat disease detection',
      topics: ['industrial-defect', 'Few-Shot'],
      doi: '10.1109/cvidl62147.2024.10604082',
    },
    'zh'
  );
  assert.equal(seed.category, 'paper-reading');
  assert.equal(seed.paper, '10.1109/cvidl62147.2024.10604082');
  assert.deepEqual(seed.tags, ['industrial-defect']);
  assert.match(seed.title, /阅读笔记/);
});

test('paperNoteSeed falls back to a valid tag and id', () => {
  const seed = paperNoteSeed({ id: 'jpcs-2026-csddnet', title: 'CSDDNet' }, 'en');
  assert.deepEqual(seed.tags, ['paper-reading']);
  assert.equal(seed.paper, 'jpcs-2026-csddnet');
  assert.match(seed.title, /^Reading notes:/);
});

test('projectNoteSeed maps project categories onto blog categories', () => {
  assert.equal(projectNoteSeed({ title: 'A', category: 'enterprise-software' }, 'zh').category, 'software-engineering');
  assert.equal(projectNoteSeed({ title: 'A', category: 'data-intelligence' }, 'zh').category, 'data-science');
  assert.equal(projectNoteSeed({ title: 'A', category: 'ai-agent' }, 'zh').category, 'ai-agent');
});

test('noteBody keeps the section skeleton per kind and language', () => {
  const paper = noteBody('paper', 'zh');
  for (const section of ['## 问题', '## 方法', '## 实验', '## 局限', '## 可复现性']) {
    assert.ok(paper.includes(section), `missing ${section}`);
  }
  const project = noteBody('project', 'en');
  for (const section of ['## Context', '## Architecture', '## Trade-offs', '## Results']) {
    assert.ok(project.includes(section), `missing ${section}`);
  }
});
