import type { Span } from "./aboutContent";

export type WordToken = {
  parts: { text: string; italic: boolean }[];
  spaceAfter: boolean;
};

/**
 * Tokenises mixed roman/italic spans into words.
 * Punctuation that directly follows a word (",", ".") is glued to that word
 * so it can never wrap onto its own line.
 */
export function buildWords(spans: Span[]): WordToken[] {
  const words: WordToken[] = [];
  for (const span of spans) {
    const italic = !!span.italic;
    for (const piece of span.text.split(/(\s+)/).filter(Boolean)) {
      const last = words[words.length - 1];
      if (/^\s+$/.test(piece)) {
        if (last) last.spaceAfter = true;
      } else if (last && !last.spaceAfter) {
        // Glue punctuation / continuation to the previous word
        last.parts.push({ text: piece, italic });
      } else {
        words.push({ parts: [{ text: piece, italic }], spaceAfter: false });
      }
    }
  }
  return words;
}

/**
 * Groups word elements into visual lines by comparing offsetTop.
 * Must be called after layout; re-call after font load and resize.
 */
export function groupByLine(words: HTMLElement[]): HTMLElement[][] {
  const lines: HTMLElement[][] = [];
  let lastTop = -9999;
  for (const w of words) {
    if (Math.abs(w.offsetTop - lastTop) > 4) {
      lines.push([]);
      lastTop = w.offsetTop;
    }
    lines[lines.length - 1].push(w);
  }
  return lines;
}
