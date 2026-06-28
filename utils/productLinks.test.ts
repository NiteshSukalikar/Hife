import { describe, expect, it } from "vitest";

import {
  normalizeProductUrl,
  parseProductLinks,
  validateProductUrl,
} from "@/utils/productLinks";

describe("product link helpers", () => {
  it("normalizes missing schemes to https", () => {
    expect(normalizeProductUrl(" amazon.in/item ")).toBe(
      "https://amazon.in/item"
    );
  });

  it("rejects unsupported or hostless URLs", () => {
    expect(validateProductUrl("ftp://example.com/item")).toBeNull();
    expect(validateProductUrl("localhost")).toBeNull();
  });

  it("parses, labels, and de-duplicates links", () => {
    const result = parseProductLinks(
      "amazon.in/a, https://flipkart.com/b\nnot-a-url\namazon.in/a"
    );

    expect(result.links).toEqual([
      { url: "https://amazon.in/a", source: "Amazon" },
      { url: "https://flipkart.com/b", source: "Flipkart" },
    ]);
    expect(result.invalidLinks).toEqual(["not-a-url"]);
  });
});
