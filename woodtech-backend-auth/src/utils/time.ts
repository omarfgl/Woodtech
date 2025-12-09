const unitMap: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000
};

export const ttlToMilliseconds = (ttl: string): number => {
  const trimmed = ttl.trim();
  const match = trimmed.match(/^(\d+)([smhdw])$/i);
  if (match) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = unitMap[unit];
    if (!multiplier) {
      throw new Error(`Unsupported TTL unit: ${unit}`);
    }
    return value * multiplier;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  throw new Error(`Invalid TTL value: ${ttl}`);
};
