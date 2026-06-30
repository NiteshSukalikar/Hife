import { describe, expect, it } from "vitest";

import { PurchaseRequest } from "@/constants/types";
import {
  buildDiscussionRequestSummary,
  DISCUSSION_QUICK_REPLIES,
  extractFirstUrl,
  getCommentLinkPreview,
  getDiscussionBudgetLine,
  getLinkSourceLabel,
} from "@/utils/discussionPresentation";

const request: PurchaseRequest = {
  id: "request-1",
  title: "Quiet Air Purifier",
  productName: "Quiet Air Purifier",
  info: "Better sleep",
  reason: "Better sleep",
  priority: "P1",
  expectedPrice: 3500,
  maxBudget: 4000,
  budget: 4000,
  category: "Home",
  links: [],
  status: "pending",
};

describe("discussion presentation helpers", () => {
  it("keeps quick replies focused on purchase decisions", () => {
    expect(DISCUSSION_QUICK_REPLIES).toEqual([
      "Can we wait?",
      "Approved",
      "Need more info",
    ]);
  });

  it("extracts a link from comment text", () => {
    expect(extractFirstUrl("Compare this https://example.com/item today")).toBe(
      "https://example.com/item"
    );
  });

  it("builds a simple source label for comment links", () => {
    expect(getLinkSourceLabel("https://www.amazon.in/product")).toBe("Amazon");
    expect(getLinkSourceLabel("not a url")).toBe("Link");
  });

  it("prefers explicit comment links over text links", () => {
    expect(
      getCommentLinkPreview(
        "See https://example.com/old",
        "https://shop.example/new"
      )
    ).toMatchObject({
      url: "https://shop.example/new",
      source: "Shop",
    });
  });

  it("summarizes safe-to-spend after approval", () => {
    expect(
      getDiscussionBudgetLine({
        safeToSpendNow: 5000,
        safeToSpendAfterRequest: 1500,
        categoryBudget: 5000,
        categoryProjectedRemaining: 5000,
        categoryRemainingAfterRequest: 1500,
        exceedsSafeToSpend: false,
        exceedsCategoryBudget: false,
        consumesLargeCategoryShare: true,
      })
    ).toBe("INR 1,500 safe-to-spend after approval.");
  });

  it("builds a compact request summary with human labels", () => {
    expect(
      buildDiscussionRequestSummary(request, {
        safeToSpendNow: 5000,
        safeToSpendAfterRequest: 1500,
        categoryBudget: 5000,
        categoryProjectedRemaining: 5000,
        categoryRemainingAfterRequest: 1500,
        exceedsSafeToSpend: false,
        exceedsCategoryBudget: false,
        consumesLargeCategoryShare: true,
      })
    ).toMatchObject({
      title: "Quiet Air Purifier",
      amount: "INR 3,500",
      status: "Pending",
      urgency: "Soon",
      budgetLine: "INR 1,500 safe-to-spend after approval.",
    });
  });
});
