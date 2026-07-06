export function chunkText(text, maxChars = 1200, overlap = 150) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const chunks = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const end = Math.min(cursor + maxChars, normalized.length);
    chunks.push(normalized.slice(cursor, end));
    if (end === normalized.length) break;
    cursor = Math.max(end - overlap, cursor + 1);
  }
  return chunks;
}
