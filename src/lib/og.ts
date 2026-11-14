const WIDE = /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Rough width of a character in em units: CJK is full width, Latin is narrower. */
export function charUnits(char: string): number {
  return WIDE.test(char) ? 1 : 0.56;
}

export function stringUnits(value: string): number {
  return [...value].reduce((total, char) => total + charUnits(char), 0);
}

/**
 * Splits a title into lines that fit `maxUnits` em units, breaking between
 * characters for CJK and at spaces for Latin text. Adds an ellipsis when the
 * title does not fit `maxLines`.
 */
export function wrapTitle(title: string, maxUnits = 17, maxLines = 3): string[] {
  const text = title.trim();
  if (!text) return [];

  // Balance the lines instead of filling the first line and leaving an orphan.
  const total = stringUnits(text);
  const lineCount = Math.min(maxLines, Math.max(1, Math.ceil(total / maxUnits)));
  const limit = Math.max(1, Math.min(maxUnits, (total / lineCount) * 1.08));

  const lines: string[] = [];
  let line = '';
  let units = 0;

  const push = () => {
    if (line) lines.push(line);
    line = '';
    units = 0;
  };

  for (const char of text) {
    const width = charUnits(char);
    if (line && units + width > limit) {
      push();
      if (lines.length === maxLines) break;
      if (char === ' ') continue;
    }
    line += char;
    units += width;
  }
  push();

  if (lines.length > maxLines) lines.length = maxLines;

  const consumed = lines.join('').length;
  if (consumed < text.length && lines.length > 0) {
    const last = lines[lines.length - 1]!;
    lines[lines.length - 1] = `${last.replace(/[\s,，。.:：;；-]+$/, '')}…`;
  }

  return lines;
}
