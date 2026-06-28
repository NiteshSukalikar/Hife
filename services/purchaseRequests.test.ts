import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/firebase", () => ({ db: {} }));
vi.mock("@/services/households", () => ({
  getCurrentMember: vi.fn(),
  requireActiveHousehold: vi.fn(),
}));
vi.mock("@/services/usageMonitoring", () => ({ recordUsage: vi.fn() }));
vi.mock("@/utils/deviceUser", () => ({ getDeviceUserId: vi.fn() }));
vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
}));

import { mapRequestDoc, normalizeStatus } from "@/services/purchaseRequests";

function docSnapshot(data: Record<string, unknown>) {
  return {
    id: "request-1",
    data: () => data,
  };
}

describe("purchase request helpers", () => {
  it("normalizes legacy and unknown statuses to pending", () => {
    expect(normalizeStatus()).toBe("pending");
    expect(normalizeStatus("open")).toBe("pending");
    expect(normalizeStatus("unexpected")).toBe("pending");
    expect(normalizeStatus("approved")).toBe("approved");
  });

  it("maps legacy request documents to the current request shape", () => {
    expect(
      mapRequestDoc(
        docSnapshot({
          productName: "Mixer",
          info: "Old reason",
          budget: "3000",
          status: "open",
        })
      )
    ).toMatchObject({
      id: "request-1",
      title: "Mixer",
      productName: "Mixer",
      reason: "Old reason",
      expectedPrice: 3000,
      maxBudget: 3000,
      budget: 3000,
      category: "Other",
      links: [],
      status: "pending",
      commentCount: 0,
      lastActivityType: "created",
    });
  });

  it("keeps current request fields when present", () => {
    expect(
      mapRequestDoc(
        docSnapshot({
          title: "Chair",
          productName: "Office chair",
          reason: "Back support",
          expectedPrice: 7200,
          maxBudget: 8000,
          category: "Household",
          links: [{ url: "https://example.com", source: "Other" }],
          status: "buy_later",
          commentCount: 2,
        })
      )
    ).toMatchObject({
      title: "Chair",
      productName: "Office chair",
      reason: "Back support",
      expectedPrice: 7200,
      maxBudget: 8000,
      category: "Household",
      status: "buy_later",
      commentCount: 2,
    });
  });
});
