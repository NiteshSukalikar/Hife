import { describe, expect, it } from "vitest";

import {
  getPriorityChipColor,
  getPriorityLabel,
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

  it("maps stored priority codes to human urgency labels", () => {
    expect(getPriorityLabel("P0")).toBe("Need today");
    expect(getPriorityLabel("P3")).toBe("Someday");
  });
});
