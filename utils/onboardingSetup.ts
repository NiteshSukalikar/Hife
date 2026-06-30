export type HouseholdSetupMode = "create" | "join";

type ValidateSetupInput = {
  mode: HouseholdSetupMode;
  displayName: string;
  roleLabel: string;
  householdName: string;
  inviteCode: string;
  roomPassword: string;
  monthlyBudgetInput?: string;
  categoryNamesInput?: string;
};

export type SetupValidationResult =
  | { isValid: true }
  | { isValid: false; message: string };

const DEFAULT_ONBOARDING_CATEGORIES = ["Home", "Groceries", "Other"];

export function normalizeInviteCode(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 12);
}

export function cleanMoneyInput(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function parseMoneyInput(value: string) {
  return Number(cleanMoneyInput(value) || 0);
}

export function getSetupCategoryNames(value: string) {
  const categories = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return categories.length ? Array.from(new Set(categories)) : DEFAULT_ONBOARDING_CATEGORIES;
}

export function splitBudgetAcrossCategories(
  monthlyBudget: number,
  categoryNames: string[]
) {
  const cleanCategories = categoryNames.map((item) => item.trim()).filter(Boolean);
  const targetCategories = cleanCategories.length
    ? cleanCategories
    : DEFAULT_ONBOARDING_CATEGORIES;
  const total = Math.max(0, Math.round(monthlyBudget || 0));
  const base = Math.floor(total / targetCategories.length);
  const remainder = total % targetCategories.length;

  return targetCategories.reduce(
    (budgets, category, index) => ({
      ...budgets,
      [category]: base + (index < remainder ? 1 : 0),
    }),
    {} as Record<string, number>
  );
}

export function validateHouseholdSetup(
  input: ValidateSetupInput
): SetupValidationResult {
  if (!input.displayName.trim()) {
    return { isValid: false, message: "Add your display name" };
  }

  if (!input.roleLabel.trim()) {
    return { isValid: false, message: "Add a role label your partner will understand" };
  }

  if (input.mode === "create" && !input.householdName.trim()) {
    return { isValid: false, message: "Name the room before creating it" };
  }

  if (input.mode === "join" && normalizeInviteCode(input.inviteCode).length < 4) {
    return { isValid: false, message: "Enter the room invite code" };
  }

  if (input.roomPassword.trim().length < 4) {
    return { isValid: false, message: "Room password must be at least 4 characters" };
  }

  if (
    input.monthlyBudgetInput &&
    parseMoneyInput(input.monthlyBudgetInput) > 0 &&
    getSetupCategoryNames(input.categoryNamesInput || "").length === 0
  ) {
    return { isValid: false, message: "Add at least one spending category" };
  }

  return { isValid: true };
}

export function buildInviteGuidance(inviteCode: string, hasPassword: boolean) {
  if (!inviteCode) {
    return {
      title: "Invite a partner when the room is ready",
      body: "Hife will create a short invite code. Share it with the room password so only trusted people can join.",
    };
  }

  return {
    title: "Share this with your partner",
    body: hasPassword
      ? "Send the invite code and room password together. They can join the same room, see requests, and help decide what fits the budget."
      : "Send the invite code to a trusted partner. Keep the room password somewhere private if you created one.",
  };
}
