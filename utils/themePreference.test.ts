import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: {
    select: (values: Record<string, unknown>) => values.default,
  },
}));

import { getHifeTheme, getNextHifeTheme } from "@/constants/theme";

describe("theme preference helpers", () => {
  it("returns warm theme as the readable default", () => {
    expect(getHifeTheme("warm").name).toBe("Warm light");
  });

  it("toggles between warm and espresso modes", () => {
    expect(getNextHifeTheme("warm")).toBe("espresso");
    expect(getNextHifeTheme("espresso")).toBe("warm");
  });
});
