import type { ReactNode } from "react";

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};


let _lastQuery: string | undefined;
let _lastRegex: RegExp | undefined;
let _lastLower: string | undefined;

const getQueryRegex = (trimmed: string): [RegExp, string] => {
  if (trimmed !== _lastQuery) {
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    _lastRegex = new RegExp(`(${escaped})`, "i");
    _lastLower = trimmed.toLowerCase();
    _lastQuery = trimmed;
  }
  return [_lastRegex!, _lastLower!];
};

export const highlightMatch = (
  text: string,
  query: string | undefined,
): ReactNode => {
  if (!query) return text;
  const trimmed = query.trim();
  if (!trimmed) return text;

  const [re, lowerTrimmed] = getQueryRegex(trimmed);

  if (!text.toLowerCase().includes(lowerTrimmed)) return text;

  const parts = text.split(re);
  return parts.map((part, i) =>
    part.toLowerCase() === lowerTrimmed ? (
      <mark key={i} className="bg-yellow-200 text-black">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};
