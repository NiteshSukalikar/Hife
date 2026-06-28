export type RequestPriority = "P0" | "P1" | "P2" | "P3";

export type RequestStatus =
  | "pending"
  | "approved"
  | "declined"
  | "needs_more_info"
  | "buy_later"
  | "purchased"
  | "cancelled";

export type AiRecommendation =
  | "approve"
  | "decline"
  | "buy_later"
  | "needs_more_info";

export type ProductLink = {
  url: string;
  source: string;
};

export type CategoryBudgetMap = Record<string, number>;

export type BudgetSettings = {
  monthlyBudget: number;
  categoryBudgets: CategoryBudgetMap;
};

export type AiDecisionResult = {
  suggestedPriority: RequestPriority;
  recommendation: AiRecommendation;
  budgetImpact: string;
  reasoning: string;
  suggestedMessage: string;
  fromCache?: boolean;
  source?: "configured_ai" | "local_assistant" | "cache";
};

export type PurchaseRequest = {
  id: string;
  title: string;
  productName: string;
  info: string;
  reason: string;
  priority: RequestPriority;
  expectedPrice: number;
  maxBudget: number;
  budget: number;
  category: string;
  links: ProductLink[];
  status: RequestStatus;
  decisionReason?: string;
  decisionBy?: string | null;
  decisionAt?: any;
  image?: string | null;
  householdId?: string | null;
  createdBy?: string | null;
  createdByDisplayName?: string;
  createdByRoleLabel?: string;
  createdAt?: any;
  updatedAt?: any;
  lastActivityAt?: any;
  lastActivityType?: string;
  commentCount?: number;
  lastCommentBy?: string | null;
  lastCommentText?: string;
};
