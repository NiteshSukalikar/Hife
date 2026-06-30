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
  increment: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
}));

import { mapCommentDoc } from "@/services/comments";

describe("comment helpers", () => {
  it("maps comment documents to display-ready comments", () => {
    const createdAt = {
      toDate: () => new Date("2026-06-28T12:00:00.000Z"),
    };

    expect(
      mapCommentDoc({
        id: "comment-1",
        data: () => ({
          text: "Looks good",
          authorId: "user-1",
          authorDisplayName: "Nitesh",
          authorRoleLabel: "Partner A",
          householdId: "home-1",
          createdAt,
        }),
      })
    ).toMatchObject({
      id: "comment-1",
      text: "Looks good",
      image: null,
      link: null,
      householdId: "home-1",
      authorId: "user-1",
      authorDisplayName: "Nitesh",
      authorRoleLabel: "Partner A",
      createdAtRaw: createdAt,
    });
  });

  it("keeps older comment documents renderable", () => {
    expect(
      mapCommentDoc({
        id: "old-comment",
        data: () => ({
          authorId: "user-1",
        }),
      })
    ).toMatchObject({
      id: "old-comment",
      text: "",
      image: null,
      link: null,
      householdId: null,
      authorId: "user-1",
      authorDisplayName: "",
      authorRoleLabel: "",
      createdAt: "",
      createdAtRaw: null,
    });
  });
});
