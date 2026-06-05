export type AdminRole = "operations" | "finance" | "support";
export type AdminWorkspaceKey =
  | "operations"
  | "trips"
  | "finance"
  | "refunds"
  | "support"
  | "kyc"
  | "users"
  | "audit";
export type AdminQueueSeverity = "normal" | "attention" | "urgent";

export type AdminWorkspaceDefinition = {
  key: AdminWorkspaceKey;
  label: string;
  roles: AdminRole[];
};

export type AdminQueueItem = {
  role: AdminRole;
  severity: Exclude<AdminQueueSeverity, "normal">;
};

export type AdminQueueSummary = Record<
  AdminRole,
  {
    total: number;
    urgent: number;
    attention: number;
  }
>;

const WORKSPACES: AdminWorkspaceDefinition[] = [
  { key: "operations", label: "Operations", roles: ["operations"] },
  { key: "trips", label: "Trips", roles: ["operations", "support"] },
  { key: "finance", label: "Finance", roles: ["finance"] },
  { key: "refunds", label: "Refunds", roles: ["finance"] },
  { key: "support", label: "Support", roles: ["support"] },
  { key: "kyc", label: "KYC", roles: ["support"] },
  { key: "users", label: "Users", roles: ["operations", "support"] },
  { key: "audit", label: "Audit", roles: ["operations", "finance", "support"] }
];

export function filterAdminWorkspacesForRoles(
  roles: AdminRole[]
): AdminWorkspaceDefinition[] {
  return WORKSPACES.filter((workspace) =>
    workspace.roles.some((role) => roles.includes(role))
  );
}

export function buildAdminQueueSummary(items: AdminQueueItem[]): AdminQueueSummary {
  const summary: AdminQueueSummary = {
    operations: { total: 0, urgent: 0, attention: 0 },
    finance: { total: 0, urgent: 0, attention: 0 },
    support: { total: 0, urgent: 0, attention: 0 }
  };

  for (const item of items) {
    summary[item.role].total += 1;
    summary[item.role][item.severity] += 1;
  }

  return summary;
}

export function getAdminRiskLabel(severity: AdminQueueSeverity): string {
  if (severity === "urgent") {
    return "Needs review today";
  }
  if (severity === "attention") {
    return "Needs care";
  }

  return "On track";
}
