import { describe, expect, it } from "vitest";

import { validateRequestDraft } from "@/utils/requestValidation";

const validDraft = {
  productName: "Air fryer",
  reason: "Useful for quick weeknight cooking.",
  expectedPrice: "4999",
  maxBudget: "5500",
  linksText: "https://amazon.in/product",
};

describe("validateRequestDraft", () => {
  it("accepts a complete request draft", () => {
    expect(validateRequestDraft(validDraft)).toEqual({
      isValid: true,
      message: "",
    });
  });

  it("requires product name, reason, expected price, and max budget", () => {
    expect(
      validateRequestDraft({ ...validDraft, productName: " " }).message
    ).toBe("Product name is required");
    expect(validateRequestDraft({ ...validDraft, reason: " " }).message).toBe(
      "Reason is required"
    );
    expect(
      validateRequestDraft({ ...validDraft, expectedPrice: "" }).message
    ).toBe("Expected price is required");
    expect(validateRequestDraft({ ...validDraft, maxBudget: "" }).message).toBe(
      "Maximum budget is required"
    );
  });

  it("enforces field length limits", () => {
    expect(
      validateRequestDraft({ ...validDraft, productName: "a".repeat(41) })
        .message
    ).toBe("Product name can be max 40 characters");
    expect(
      validateRequestDraft({ ...validDraft, reason: "a".repeat(501) }).message
    ).toBe("Reason can be max 500 characters");
  });

  it("returns the first invalid product link", () => {
    expect(
      validateRequestDraft({ ...validDraft, linksText: "amazon" }).message
    ).toBe("Check product link: amazon");
  });
});
