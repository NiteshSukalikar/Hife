import { ProductLink } from "@/constants/types";

function getLinkSource(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes("amazon.")) return "Amazon";
  if (normalized.includes("flipkart.")) return "Flipkart";
  if (normalized.includes("meesho.")) return "Meesho";
  if (normalized.includes("myntra.")) return "Myntra";

  return "Other";
}

export function normalizeProductUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

export function validateProductUrl(value: string) {
  const normalized = normalizeProductUrl(value);

  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    if (!parsed.hostname.includes(".")) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

export function parseProductLinks(value: string): {
  links: ProductLink[];
  invalidLinks: string[];
} {
  const rawLinks = value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const links: ProductLink[] = [];
  const invalidLinks: string[] = [];

  rawLinks.forEach((rawLink) => {
    const url = validateProductUrl(rawLink);

    if (!url) {
      invalidLinks.push(rawLink);
      return;
    }

    if (seen.has(url)) return;

    seen.add(url);
    links.push({
      url,
      source: getLinkSource(url),
    });
  });

  return { links, invalidLinks };
}
