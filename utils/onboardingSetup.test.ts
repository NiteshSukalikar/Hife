import { describe, expect, it } from "vitest";
import {
  buildInviteGuidance,
  cleanMoneyInput,
  getSetupCategoryNames,
  normalizeInviteCode,
  parseMoneyInput,
  splitBudgetAcrossCategories,
  validateHouseholdSetup,
} from "@/utils/onboardingSetup";

describe("onboarding setup helpers", () => {
  it("normalizes invite codes and money inputs", () => {
    expect(normalizeInviteCode(" ab-c 123! ")).toBe("ABC123");
    expect(cleanMoneyInput("INR 12,500")).toBe("12500");
    expect(parseMoneyInput("INR 12,500")).toBe(12500);
  });

  it("uses practical default categories when none are entered", () => {
    expect(getSetupCategoryNames("")).toEqual(["Home", "Groceries", "Other"]);
    expect(getSetupCategoryNames("Home, Fun, Home")).toEqual(["Home", "Fun"]);
  });

  it("splits the first monthly budget across setup categories", () => {
    expect(splitBudgetAcrossCategories(1000, ["Home", "Fun", "Other"])).toEqual({
      Home: 334,
      Fun: 333,
      Other: 333,
    });
  });

  it("validates setup without exposing internal priority codes", () => {
    const result = validateHouseholdSetup({
      mode: "join",
      displayName: "Nitesh",
      roleLabel: "Partner",
      householdName: "",
      inviteCode: "",
      roomPassword: "safe",
    });

    expect(result).toEqual({
      isValid: false,
      message: "Enter the room invite code",
    });
    expect(result.message).not.toMatch(/\bP[0-3]\b/);
  });

  it("explains partner invite guidance in plain language", () => {
    expect(buildInviteGuidance("", false).body).toContain("short invite code");
    expect(buildInviteGuidance("ABC123", true).body).toContain("room password");
  });
});
