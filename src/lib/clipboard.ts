import { looksLikeItem } from "./poe/parse-item";

export async function readItemClipboard(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText();
    if (looksLikeItem(text)) return text;
    return null;
  } catch {
    return null;
  }
}
