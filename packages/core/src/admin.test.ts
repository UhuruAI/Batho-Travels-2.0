import { describe, expect, it } from "vitest";
import {
  buildAdminQueueSummary,
  filterAdminWorkspacesForRoles,
  getAdminRiskLabel
} from "./admin";

describe("filterAdminWorkspacesForRoles", () => {
  it("returns only the workspaces available to the admin role set", () => {
    expect(filterAdminWorkspacesForRoles(["finance"]).map((workspace) => workspace.key)).toEqual([
      "finance",
      "refunds",
      "audit"
    ]);
  });

  it("keeps multi-role admins in the intended workspace order", () => {
    expect(
      filterAdminWorkspacesForRoles(["support", "operations"]).map((workspace) => workspace.key)
    ).toEqual(["operations", "trips", "support", "kyc", "users", "audit"]);
  });
});

describe("buildAdminQueueSummary", () => {
  it("groups queue counts by role and severity", () => {
    expect(
      buildAdminQueueSummary([
        { role: "support", severity: "attention" },
        { role: "support", severity: "urgent" },
        { role: "finance", severity: "attention" }
      ])
    ).toEqual({
      support: { total: 2, urgent: 1, attention: 1 },
      finance: { total: 1, urgent: 0, attention: 1 },
      operations: { total: 0, urgent: 0, attention: 0 }
    });
  });
});

describe("getAdminRiskLabel", () => {
  it("keeps risk labels operational and non-punitive", () => {
    expect(getAdminRiskLabel("urgent")).toBe("Needs review today");
    expect(getAdminRiskLabel("attention")).toBe("Needs care");
    expect(getAdminRiskLabel("normal")).toBe("On track");
  });
});
