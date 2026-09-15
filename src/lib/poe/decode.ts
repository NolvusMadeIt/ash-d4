/** Decode HTML/XML entities, including double-encoded PoB names like Ra's. */

const AMP = ["&", "amp", ";"].join("");
const LT = ["&", "lt", ";"].join("");
const GT = ["&", "gt", ";"].join("");
const QUOT = ["&", "quot", ";"].join("");
const APOS = ["&", "apos", ";"].join("");
const NBSP = ["&", "nbsp", ";"].join("");

function decodeOnce(text: string): string {
  return text
    .replace(new RegExp(LT, "gi"), "<")
    .replace(new RegExp(GT, "gi"), ">")
    .replace(new RegExp(QUOT, "gi"), '"')
    .replace(new RegExp(APOS, "gi"), "'")
    .replace(new RegExp(NBSP, "gi"), " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const code = Number.parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number.parseInt(n, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(new RegExp(AMP, "gi"), "&");
}

export function decodeHtmlEntities(text: string): string {
  if (!text || !text.includes("&")) return text;
  let cur = text;
  for (let i = 0; i < 4; i++) {
    const next = decodeOnce(cur);
    if (next === cur) return next;
    cur = next;
  }
  return cur;
}
