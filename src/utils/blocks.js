function normalizeHeadline(text, fallback) {
  const value = (text || '').trim();
  if (value) {
    return value;
  }
  return fallback;
}

function normalizeItem(text, marker = '→') {
  if (!text) {
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  if (/^[✔❌→•\-]/.test(trimmed)) {
    return trimmed;
  }
  if (!marker) {
    return trimmed;
  }
  return `${marker} ${trimmed}`;
}

function createBlock({ headline, items = [], footer = 'Use --full for detailed logs.' }) {
  const normalizedHeadline = normalizeHeadline(headline, '✔ Command completed successfully.');
  const normalizedItems = items
    .map((item) => normalizeItem(item))
    .filter(Boolean);
  const lines = [normalizedHeadline];
  if (normalizedItems.length) {
    lines.push(...normalizedItems);
  }
  if (footer) {
    lines.push('', footer);
  }
  return lines.join('\n');
}

function bullets(values = [], marker = '→') {
  return values
    .map((value) => normalizeItem(value, marker))
    .filter(Boolean);
}

module.exports = {
  createBlock,
  bullets,
  normalizeItem
};
