const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

function fnv1a(str: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

function hsl(h: number, s: number, l: number, alpha?: number): string {
  const hue = h % 360;
  if (alpha !== undefined) {
    return `hsl(${hue} ${s}% ${l}% / ${alpha})`;
  }
  return `hsl(${hue} ${s}% ${l}%)`;
}
export function gradientFromSeed(seed: string) {
  const normalized = seed.trim().toLowerCase();
  const h1 = fnv1a(normalized);
  const h2 = fnv1a(normalized + "\x00");
  const h3 = fnv1a(normalized + "\x01");

  const hue1 = h1 % 360;
  const hue2 = (hue1 + 90 + (h2 % 90)) % 360;  
  const hue3 = (hue2 + 90 + (h3 % 90)) % 360;   

  const saturation = 60 + (h1 % 20);
  const lightness1 = 45 + (h2 % 15);
  const lightness2 = 32 + (h3 % 15);
  const lightness3 = 50 + (h1 % 12);
  const satAccent = saturation + 8;

  const angle = 100 + (h2 % 130);
  const meshAngle = 30 + (h3 % 100);
  const spot1X = 10 + (h1 % 75);
  const spot1Y = 10 + (h2 % 75);
  const spot2X = 20 + (h3 % 65);
  const spot2Y = 15 + (h1 % 70);

  const backgroundImage = [
    `radial-gradient(ellipse at ${spot1X}% ${spot1Y}%, ${hsl(hue3, satAccent, lightness3, 0.9)} 0%, transparent 58%)`,
    `radial-gradient(ellipse at ${spot2X}% ${spot2Y}%, ${hsl(hue2, saturation + 12, lightness1 + 10, 0.55)} 0%, transparent 52%)`,
    `linear-gradient(${meshAngle}deg, ${hsl(hue2, saturation, lightness2, 0.4)} 0%, transparent 48%, ${hsl(hue1, saturation, lightness1, 0.35)} 100%)`,
    `linear-gradient(${angle}deg, ${hsl(hue1, saturation, lightness1)} 0%, ${hsl(hue2, saturation + 5, lightness2)} 42%, ${hsl(hue3, satAccent, lightness3 - 6)} 100%)`,
  ].join(", ");

  return { backgroundImage, color: "hsl(0 0% 100% / 0.92)" };
}