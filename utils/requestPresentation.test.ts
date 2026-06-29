import { describe, expect, it } from "vitest";

import {
  getPriorityChipColor,
  getStatusChipColor,
  getStatusLabel,
} from "@/utils/requestPresentation";

describe("request presentation helpers", () => {
  it("returns readable labels for request statuses", () => {
    expect(getStatusLabel("needs_more_info")).toBe("Needs info");
    expect(getStatusLabel("buy_later")).toBe("Buy later");
  });

  it("returns semantic status chip colors", () => {
    expect(getStatusChipColor("approved")).toMatchObject({
      border: "#7A8C6E",
    });
    expect(getStatusChipColor("declined")).toMatchObject({
      border: "#A85C44",
    });
  });

  it("returns distinct priority chip colors", () => {
    expect(getPriorityChipColor("P0")).not.toEqual(getPriorityChipColor("P3"));
  });
});
