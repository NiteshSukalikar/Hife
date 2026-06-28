export type RequestPriority = "P0" | "P1" | "P2" | "P3";

export type RequestStatus =
  | "pending"
  | "approved"
  | "declined"
  | "needs_more_info"
  | "buy_later"
  | "purchased"
  | "cancelled";

export type ProductLink = {
  url: string;
  source: string;
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
  createdBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
};
