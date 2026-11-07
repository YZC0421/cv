import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CV_FILE = fileURLToPath(new URL('../../public/cv.pdf', import.meta.url));

export const site = {
  name: 'Zicong Yang',
  tagline:
    'Software engineer and researcher working on medical signal processing and computer vision — ECG arrhythmia detection, industrial defect inspection, and applied deep learning.',
  email: '402641915@qq.com',
  github: 'https://github.com/YZC0421',
  scholar: 'https://scholar.google.com/citations?user=0Ynn-awAAAAJ',
  orcid: 'https://orcid.org/0009-0001-0948-3606',
};

export function hasCvPdf(): boolean {
  return existsSync(CV_FILE);
}
