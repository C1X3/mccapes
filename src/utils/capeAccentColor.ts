const FALLBACK_CAPE_ACCENT_COLOR = "#9b6bff";

const resolvedColorCache = new Map<string, string>();
const pendingColorLoads = new Map<string, Promise<string>>();

const toAccentColorFromImageData = (data: Uint8ClampedArray): string => {
  const bins = new Map<string, number>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const a = data[i + 3] / 255;
    if (a < 0.35) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const sat = max === 0 ? 0 : delta / max;
    const val = max;
    if (sat < 0.25 || val < 0.2) continue;

    let hue = 0;
    if (delta > 0) {
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
    }
    if (hue < 0) hue += 6;

    const hBin = Math.round(hue * 10);
    const sBin = Math.round(sat * 6);
    const vBin = Math.round(val * 6);
    const key = `${hBin}:${sBin}:${vBin}`;
    bins.set(key, (bins.get(key) ?? 0) + 1);
  }

  let bestKey = "";
  let bestCount = -1;
  bins.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  });

  if (!bestKey) return FALLBACK_CAPE_ACCENT_COLOR;

  const [hRaw, sRaw, vRaw] = bestKey.split(":").map((v) => Number(v));
  const h = (hRaw / 10) * 60;
  const s = Math.min(90, Math.max(55, (sRaw / 6) * 100));
  const v = Math.min(95, Math.max(65, (vRaw / 6) * 100));
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(v * 0.55)}%)`;
};

const loadCapeAccentColorFromSrc = (src: string): Promise<string> =>
  new Promise<string>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 64;
        canvas.height = img.naturalHeight || 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(FALLBACK_CAPE_ACCENT_COLOR);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        resolve(toAccentColorFromImageData(data));
      } catch {
        resolve(FALLBACK_CAPE_ACCENT_COLOR);
      }
    };

    img.onerror = () => resolve(FALLBACK_CAPE_ACCENT_COLOR);
  });

export const getCapeAccentColor = async (slug: string): Promise<string> => {
  const cacheKey = slug;
  const cached = resolvedColorCache.get(cacheKey);
  if (cached) return cached;

  const pending = pendingColorLoads.get(cacheKey);
  if (pending) return pending;

  const request = loadCapeAccentColorFromSrc(`/cape renders/${slug}.png`).then((color) => {
    resolvedColorCache.set(cacheKey, color);
    pendingColorLoads.delete(cacheKey);
    return color;
  });

  pendingColorLoads.set(cacheKey, request);
  return request;
};

export const getCapeAccentColorFromSource = async (
  cacheKey: string,
  src: string,
): Promise<string> => {
  const cached = resolvedColorCache.get(cacheKey);
  if (cached) return cached;

  const pending = pendingColorLoads.get(cacheKey);
  if (pending) return pending;

  const request = loadCapeAccentColorFromSrc(src).then((color) => {
    resolvedColorCache.set(cacheKey, color);
    pendingColorLoads.delete(cacheKey);
    return color;
  });

  pendingColorLoads.set(cacheKey, request);
  return request;
};

export const getCachedCapeAccentColor = (slug: string): string | undefined =>
  resolvedColorCache.get(slug);

export const FALLBACK_HERO_CAPE_COLOR = FALLBACK_CAPE_ACCENT_COLOR;
