import { parseProductLinks } from "@/utils/productLinks";

export type RequestDraftInput = {
  productName: string;
  reason: string;
  expectedPrice: string | number;
  maxBudget: string | number;
  linksText?: string;
};

export type RequestDraftValidationResult = {
  isValid: boolean;
  message: string;
};

function hasValue(value: string | number) {
  return String(value).trim().length > 0;
}

export function validateRequestDraft(
  draft: RequestDraftInput
): RequestDraftValidationResult {
  if (!draft.productName.trim()) {
    return { isValid: false, message: "Product name is required" };
  }

  if (draft.productName.length > 40) {
    return {
      isValid: false,
      message: "Product name can be max 40 characters",
    };
  }

  if (!draft.reason.trim()) {
    return { isValid: false, message: "Reason is required" };
  }

  if (draft.reason.length > 500) {
    return { isValid: false, message: "Reason can be max 500 characters" };
  }

  if (!hasValue(draft.expectedPrice)) {
    return { isValid: false, message: "Expected price is required" };
  }

  if (!hasValue(draft.maxBudget)) {
    return { isValid: false, message: "Maximum budget is required" };
  }

  const { invalidLinks } = parseProductLinks(draft.linksText || "");

  if (invalidLinks.length > 0) {
    return {
      isValid: false,
      message: `Check product link: ${invalidLinks[0]}`,
    };
  }

  return { isValid: true, message: "" };
}
