import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  },
}));
vi.mock("@/services/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/services/firebase", () => ({ db: {} }));
vi.mock("@/services/usageMonitoring", () => ({ recordUsage: vi.fn() }));
vi.mock("nanoid/non-secure", () => ({ nanoid: () => "ABC123" }));
vi.mock("firebase/firestore", () => ({
  arrayUnion: vi.fn((value) => ({ arrayUnion: value })),
  collection: vi.fn((db, path) => ({ db, path })),
  doc: vi.fn((...path) => ({ path })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn((count) => ({ limit: count })),
  query: vi.fn((...parts) => ({ parts })),
  serverTimestamp: vi.fn(() => "server-timestamp"),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn((field, op, value) => ({ field, op, value })),
  writeBatch: vi.fn(() => ({
    commit: vi.fn(),
    set: vi.fn(),
  })),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "@/services/auth";
import { recordUsage } from "@/services/usageMonitoring";
import { getActiveHousehold } from "@/services/households";
import { getDoc, getDocs } from "firebase/firestore";

function householdSnapshot(data: Record<string, unknown>) {
  return {
    id: "room-1",
    data: () => data,
    exists: () => true,
  };
}

describe("household lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ uid: "user-1" });
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
  });

  it("returns null instead of blocking startup when membership lookup is denied", async () => {
    vi.mocked(getDocs).mockRejectedValue({ code: "permission-denied" });

    await expect(getActiveHousehold()).resolves.toBeNull();
  });

  it("forgets a stale remembered room and falls back to a membership lookup", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue("old-room");
    vi.mocked(getDoc).mockRejectedValueOnce({ code: "permission-denied" });
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        householdSnapshot({
          inviteCode: "ABC123",
          memberIds: ["user-1"],
          members: { "user-1": { displayName: "Nitesh", roleLabel: "Partner A" } },
        }),
      ],
      empty: false,
      size: 1,
    });

    await expect(getActiveHousehold()).resolves.toMatchObject({
      id: "room-1",
      inviteCode: "ABC123",
      memberIds: ["user-1"],
    });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("HIFE_ACTIVE_HOUSEHOLD_ID");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "HIFE_ACTIVE_HOUSEHOLD_ID",
      "room-1"
    );
    expect(recordUsage).toHaveBeenCalledWith("households.membershipLookup", {
      reads: 1,
    });
  });
});
