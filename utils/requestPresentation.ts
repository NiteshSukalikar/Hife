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
  pending: { bg: "#2B2108", border: "#F59E0B", text: "#FBBF24" },
  approved: { bg: "#123313", border: "#39FF14", text: "#B8FFB0" },
  declined: { bg: "#351313", border: "#EF4444", text: "#FCA5A5" },
  needs_more_info: { bg: "#10233F", border: "#60A5FA", text: "#BFDBFE" },
  buy_later: { bg: "#281B3D", border: "#A78BFA", text: "#DDD6FE" },
  purchased: { bg: "#0C302C", border: "#2DD4BF", text: "#99F6E4" },
  cancelled: { bg: "#202124", border: "#71717A", text: "#D4D4D8" },
};

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
};

export const PRIORITY_CHIP_COLORS: Record<
  RequestPriority,
  { bg: string; border: string; text: string }
> = {
  P0: { bg: "#351313", border: "#EF4444", text: "#FCA5A5" },
  P1: { bg: "#2B2108", border: "#F59E0B", text: "#FBBF24" },
  P2: { bg: "#10233F", border: "#60A5FA", text: "#BFDBFE" },
  P3: { bg: "#123313", border: "#39FF14", text: "#B8FFB0" },
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
