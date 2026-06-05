import { describe, expect, it } from "vitest";
import {
  APP_NAME,
  DEFAULT_PLAN_MONTHS,
  FUNDING_STAGE_ORDER,
  MAX_PLAN_MONTHS,
  TRIP_TYPE_MINIMUM_MONTHS
} from "./index";

describe("Batho Travels config", () => {
  it("keeps the locked app name and plan limits", () => {
    expect(APP_NAME).toBe("Batho Travels");
    expect(DEFAULT_PLAN_MONTHS).toBe(12);
    expect(MAX_PLAN_MONTHS).toBe(12);
  });

  it("keeps sequential staged funding order", () => {
    expect(FUNDING_STAGE_ORDER).toEqual(["flights", "stay", "experiences"]);
  });

  it("keeps trip type minimum planning windows", () => {
    expect(TRIP_TYPE_MINIMUM_MONTHS).toEqual({
      domestic: 3,
      africaRegional: 6,
      longHaulInternational: 12
    });
  });
});

