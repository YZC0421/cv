import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b1120"/>
  <text x="80" y="290" font-family="Georgia, serif" font-size="92" fill="#e5e7eb">Zicong Yang</text>
  <text x="80" y="360" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#94a3b8">Medical Signal Processing · Industrial Visual Inspection</text>
  <rect x="80" y="420" width="120" height="4" fill="#60a5fa"/>
</svg>`;

await mkdir('public', { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('wrote public/og.png');
