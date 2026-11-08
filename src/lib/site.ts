import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve from the module location instead of the build cwd, so the check keeps
// working when the site is built from a different working directory.
const CV_FILE = fileURLToPath(new URL('../../public/cv.pdf', import.meta.url));

export const site = {
  name: 'Zicong Yang',
  tagline:
    'Applied AI, computer vision, and biomedical signal processing — from ECG models to industrial inspection.',
  email: '402641915@qq.com',
  github: 'https://github.com/YZC0421',
  scholar: 'https://scholar.google.com/citations?user=0Ynn-awAAAAJ',
  orcid: 'https://orcid.org/0009-0001-0948-3606',
};

export function hasCvPdf(): boolean {
  return existsSync(CV_FILE);
}
