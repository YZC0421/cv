import test from 'node:test';
import assert from 'node:assert/strict';
import { boldSelf, toBibtex } from '../src/lib/format.ts';

test('boldSelf wraps the configured name only', () => {
  assert.equal(
    boldSelf(['Zicong Yang', 'A. Other'], 'Zicong Yang'),
    '<strong>Zicong Yang</strong>, A. Other'
  );
});

test('toBibtex produces an article entry with doi and year', () => {
  const bib = toBibtex({
    title: 'A paper',
    authors: ['Zicong Yang', 'A. Other'],
    venue: 'Scientific Reports',
    year: 2024,
    doi: '10.1038/s41598-024-71700-z',
    type: 'journal',
  });
  assert.match(bib, /@article\{/);
  assert.match(bib, /doi = \{10\.1038\/s41598-024-71700-z\}/);
  assert.match(bib, /year = \{2024\}/);
});

test('toBibtex produces an inproceedings entry with booktitle', () => {
  const bib = toBibtex({
    title: 'Conference paper',
    authors: ['Zicong Yang'],
    venue: 'CVIDL 2024',
    year: 2024,
    doi: '10.1109/example',
    type: 'conference',
  });
  assert.match(bib, /@inproceedings\{/);
  assert.match(bib, /booktitle = \{CVIDL 2024\}/);
});
