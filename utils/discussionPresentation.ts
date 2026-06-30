import { PurchaseRequest } from "@/constants/types";
import { formatInr, getRequestAmount } from "@/utils/budget";
import { RequestBudgetImpact } from "@/utils/requestBudgetImpact";
import { getPriorityLabel, getStatusLabel } from "@/utils/requestPresentation";

export const DISCUSSION_QUICK_REPLIES = [
  "Can we wait?",
  "Approved",
  "Need more info",
] as const;

const URL_PATTERN = /(https?:\/\/[^\s]+)/i;

export function extractFirstUrl(text = "") {
  return text.match(URL_PATTERN)?.[0] || "";
}

export function getLinkSourceLabel(url = "") {
  if (!url.trim()) return "";

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const source = hostname.split(".")[0] || hostname;
    return source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    return "Link";
  }
}

export function getCommentLinkPreview(text = "", explicitLink = "") {
  const url = explicitLink || extractFirstUrl(text);
  if (!url) return null;

  return {
    url,
    source: getLinkSourceLabel(url),
  };
}

export function getDiscussionBudgetLine(impact: RequestBudgetImpact | null) {
  if (!impact) return "Add budget settings to show safe-to-spend context.";

  if (impact.safeToSpendAfterRequest < 0) {
    return `Would be over safe-to-spend by ${formatInr(
      Math.abs(impact.safeToSpendAfterRequest)
    )}.`;
  }

  return `${formatInr(
    impact.safeToSpendAfterRequest
  )} safe-to-spend after approval.`;
}

export function buildDiscussionRequestSummary(
  request: PurchaseRequest,
  impact: RequestBudgetImpact | null
) {
  return {
    title: request.productName || request.title || "Purchase request",
    amount: formatInr(getRequestAmount(request)),
    status: getStatusLabel(request.status),
    urgency: getPriorityLabel(request.priority),
    budgetLine: getDiscussionBudgetLine(impact),
  };
}
