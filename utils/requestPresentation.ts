import { RequestPriority, RequestStatus } from "@/constants/types";

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  needs_more_info: "Needs info",
  buy_later: "Buy later",
  purchased: "Purchased",
  cancelled: "Cancelled",
};

export const STATUS_CHIP_COLORS: Record<
  RequestStatus,
  { bg: string; border: string; text: string }
> = {
  pending: { bg: "#FFF6D9", border: "#C4943A", text: "#7A5A12" },
  approved: { bg: "#E9F1E4", border: "#7A8C6E", text: "#4F6848" },
  declined: { bg: "#FBEDE8", border: "#A85C44", text: "#873926" },
  needs_more_info: { bg: "#EAF0EC", border: "#7A8C6E", text: "#4F6848" },
  buy_later: { bg: "#F0EAF8", border: "#8A77A8", text: "#5E4A7A" },
  purchased: { bg: "#E5F4EA", border: "#5F9077", text: "#3D6C57" },
  cancelled: { bg: "#EFEAE1", border: "#8F867A", text: "#665E54" },
};

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  P0: "Need today",
  P1: "Soon",
  P2: "This week",
  P3: "Someday",
};

export const PRIORITY_CHIP_COLORS: Record<
  RequestPriority,
  { bg: string; border: string; text: string }
> = {
  P0: { bg: "#FBEDE8", border: "#A85C44", text: "#873926" },
  P1: { bg: "#FFF6D9", border: "#C4943A", text: "#7A5A12" },
  P2: { bg: "#E9F1E4", border: "#7A8C6E", text: "#4F6848" },
  P3: { bg: "#EFEAE1", border: "#8F867A", text: "#665E54" },
};

export function getStatusLabel(status: RequestStatus) {
  return STATUS_LABELS[status] || STATUS_LABELS.pending;
}

export function getStatusChipColor(status: RequestStatus) {
  return STATUS_CHIP_COLORS[status] || STATUS_CHIP_COLORS.pending;
}

export function getPriorityChipColor(priority: RequestPriority) {
  return PRIORITY_CHIP_COLORS[priority] || PRIORITY_CHIP_COLORS.P1;
}

export function getPriorityLabel(priority: RequestPriority) {
  return PRIORITY_LABELS[priority] || PRIORITY_LABELS.P1;
}
