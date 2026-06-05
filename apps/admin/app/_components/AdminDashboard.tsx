import {
  buildAdminQueueSummary,
  filterAdminWorkspacesForRoles,
  getAdminRiskLabel,
  getKycStatusCopy,
  getKycTierRequirements,
  type AdminQueueSeverity,
  type AdminRole,
  type KycDocumentKind,
  type KycReviewTier
} from "@batho/core";
import type { ReactNode } from "react";

type AdminTabKey = "overview" | "operations" | "finance" | "support" | "kyc" | "users" | "audit";
type TripSupportAction = "pause" | "adjust" | "cancel";

const activeRoles: AdminRole[] = ["operations", "finance", "support"];
const workspaces = filterAdminWorkspacesForRoles(activeRoles);
const queueSummary = buildAdminQueueSummary([
  { role: "support", severity: "urgent" },
  { role: "support", severity: "attention" },
  { role: "finance", severity: "attention" },
  { role: "operations", severity: "attention" },
  { role: "operations", severity: "urgent" }
]);

const adminTabs: Array<{ key: AdminTabKey; label: string; href: string }> = [
  { key: "overview", label: "Overview", href: "/" },
  { key: "operations", label: "Operations", href: "/operations" },
  { key: "finance", label: "Finance", href: "/finance" },
  { key: "support", label: "Support", href: "/support" },
  { key: "kyc", label: "KYC", href: "/kyc" },
  { key: "users", label: "Users", href: "/users" },
  { key: "audit", label: "Audit", href: "/audit" }
];

const overviewQueues = [
  { label: "KYC reviews", count: 12, role: "Support", severity: "urgent" as const },
  { label: "Refund reviews", count: 4, role: "Finance", severity: "attention" as const },
  { label: "Custom destinations", count: 9, role: "Operations", severity: "attention" as const },
  { label: "Paused plans", count: 7, role: "Support", severity: "attention" as const }
];

const trips = [
  {
    id: "TRIP-204",
    traveller: "Amina D.",
    destination: "Cape Town",
    status: "active",
    savedCents: 920_000,
    totalCents: 2_500_000,
    stage: "Flights"
  },
  {
    id: "TRIP-203",
    traveller: "Neo M.",
    destination: "Durban",
    status: "paused",
    savedCents: 185_000,
    totalCents: 1_200_000,
    stage: "Stay"
  }
];

const financeRows = [
  { id: "PAY-872", provider: "Paystack", status: "Pending", amountCents: 208_334, trip: "Cape Town" },
  { id: "REF-331", provider: "Paystack", status: "Review", amountCents: 950_000, trip: "Zanzibar" }
];

const submissions: Array<{
  id: string;
  traveller: string;
  requestedTier: Exclude<KycReviewTier, "basic">;
  amountCents: number;
  documents: KycDocumentKind[];
  status: "pending" | "rejected";
  severity: AdminQueueSeverity;
}> = [
  {
    id: "KYC-1042",
    traveller: "Amina D.",
    requestedTier: "enhanced",
    amountCents: 8_400_000,
    documents: ["identityDocument", "proofOfAddress", "selfie"],
    status: "pending",
    severity: "normal"
  },
  {
    id: "KYC-1041",
    traveller: "Mpho R.",
    requestedTier: "standard",
    amountCents: 3_200_000,
    documents: ["identityDocument"],
    status: "pending",
    severity: "urgent"
  }
];

const supportCases: Array<{
  id: string;
  traveller: string;
  destination: string;
  action: TripSupportAction;
  amountCents: number;
  age: string;
}> = [
  {
    id: "SUP-221",
    traveller: "Neo M.",
    destination: "Durban",
    action: "adjust",
    amountCents: 185_000,
    age: "Grace window ended today"
  },
  {
    id: "SUP-219",
    traveller: "Kabelo S.",
    destination: "Zanzibar",
    action: "pause",
    amountCents: 420_000,
    age: "Requested yesterday"
  }
];

const destinationRequests = [
  {
    id: "DEST-88",
    traveller: "Amina D.",
    destinationName: "Essaouira",
    country: "Morocco",
    notes: "Beach, food, calmer shoulder-season pace, and a realistic long-haul savings plan."
  },
  {
    id: "DEST-87",
    traveller: "Neo M.",
    destinationName: "Lamu",
    country: "Kenya",
    notes: "Culture, coast, and a small-group trip outside peak season."
  }
];

const users = [
  { id: "USR-41", name: "Amina D.", tier: "Enhanced", trips: 2, status: "Active" },
  { id: "USR-40", name: "Mpho R.", tier: "Basic", trips: 1, status: "Needs KYC" }
];

const auditRows = [
  { id: "AUD-901", actor: "Support", action: "kyc.submission.reviewed", entity: "KYC-1042" },
  { id: "AUD-900", actor: "Finance", action: "payment.refund.recorded", entity: "REF-331" },
  { id: "AUD-899", actor: "Operations", action: "customDestination.approved", entity: "DEST-88" }
];

const documentLabels: Record<KycDocumentKind, string> = {
  identityDocument: "Identity",
  proofOfAddress: "Address",
  selfie: "Selfie"
};

const supportActionTitles: Record<TripSupportAction, string> = {
  pause: "Pause plan",
  adjust: "Adjust monthly amount",
  cancel: "Cancel plan"
};

const pageCopy: Record<AdminTabKey, { eyebrow: string; title: string; copy: string }> = {
  overview: {
    eyebrow: "Command centre",
    title: "Today's work",
    copy: "Role-separated queues for travel plans, verification, refunds, custom destinations, users, and audit history."
  },
  operations: {
    eyebrow: "Operations",
    title: "Destination and trip operations",
    copy: "Review live plans, destination requests, staged funding readiness, and travel operations work."
  },
  finance: {
    eyebrow: "Finance",
    title: "Payments and refunds",
    copy: "Monitor provider references, payment status, refund checks, and receipt review without storing raw payment data."
  },
  support: {
    eyebrow: "Support",
    title: "Traveller support",
    copy: "Handle grace, pause, adjust, and cancel requests with calm, supportive workflows."
  },
  kyc: {
    eyebrow: "KYC",
    title: "Verification reviews",
    copy: "Review Standard and Enhanced verification submissions before higher-value booking activity."
  },
  users: {
    eyebrow: "Users",
    title: "Traveller records",
    copy: "Scan traveller profiles, verification tiers, trip counts, and support readiness."
  },
  audit: {
    eyebrow: "Audit",
    title: "Traceable decisions",
    copy: "Review admin activity across support, finance, operations, KYC, and custom destination decisions."
  }
};

export function AdminDashboard({ activeTab }: { activeTab: AdminTabKey }) {
  const header = pageCopy[activeTab];

  return (
    <main className="shell">
      <aside>
        <p className="eyebrow">Batho Travels</p>
        <h1>Admin</h1>
        <nav aria-label="Admin tabs">
          {adminTabs.map((tab) => (
            <a
              key={tab.key}
              aria-current={tab.key === activeTab ? "page" : undefined}
              className={tab.key === activeTab ? "active-tab" : undefined}
              href={tab.href}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </aside>

      <section>
        <div className="header">
          <div>
            <p className="eyebrow">{header.eyebrow}</p>
            <h2>{header.title}</h2>
          </div>
          <p className="copy">{header.copy}</p>
        </div>

        {activeTab === "overview" ? <OverviewTab /> : null}
        {activeTab === "operations" ? <OperationsTab /> : null}
        {activeTab === "finance" ? <FinanceTab /> : null}
        {activeTab === "support" ? <SupportTab /> : null}
        {activeTab === "kyc" ? <KycTab /> : null}
        {activeTab === "users" ? <UsersTab /> : null}
        {activeTab === "audit" ? <AuditTab /> : null}
      </section>
    </main>
  );
}

function OverviewTab() {
  return (
    <>
      <div className="role-summary" aria-label="Queue summary by role">
        {activeRoles.map((role) => (
          <article key={role}>
            <p>{capitalize(role)}</p>
            <strong>{queueSummary[role].total}</strong>
            <h3>
              {queueSummary[role].urgent} urgent, {queueSummary[role].attention} need care
            </h3>
          </article>
        ))}
      </div>

      <div className="grid" aria-label="Admin queue summary">
        {overviewQueues.map((queue) => (
          <article key={queue.label} className={queue.severity === "urgent" ? "active-card" : undefined}>
            <p>{queue.role}</p>
            <strong>{queue.count}</strong>
            <h3>{queue.label}</h3>
            <span className={queue.severity === "urgent" ? "risk-pill" : "soft-pill"}>
              {getAdminRiskLabel(queue.severity)}
            </span>
          </article>
        ))}
      </div>

      <div className="workspace-section">
        <div className="panel-heading support-heading">
          <div>
            <p className="eyebrow">Available workspaces</p>
            <h3>Role access</h3>
          </div>
        </div>
        <div className="workspace-grid three">
          {workspaces.map((workspace) => (
            <QueuePanel key={workspace.key} title={workspace.label} pill="Enabled">
              <p className="muted">
                Available to {workspace.roles.map((role) => capitalize(role)).join(", ")}.
              </p>
            </QueuePanel>
          ))}
        </div>
      </div>
    </>
  );
}

function OperationsTab() {
  return (
    <WorkspaceSection>
      <QueuePanel title="Trip oversight" pill="Live plans">
        {trips.map((trip) => (
          <DataRow key={trip.id} kicker={trip.id} title={`${trip.destination} for ${trip.traveller}`} meta={`${trip.stage} stage, ${trip.status}`}>
            <Meter value={trip.savedCents} total={trip.totalCents} />
          </DataRow>
        ))}
      </QueuePanel>
      <QueuePanel title="Custom destination review" pill="Pricing review">
        {destinationRequests.map((request) => (
          <DataRow key={request.id} kicker={request.id} title={request.destinationName} meta={`${request.country} requested by ${request.traveller}`}>
            <p className="muted">{request.notes}</p>
            <ActionRow primary="Approve for planner" secondary="Request more detail" />
          </DataRow>
        ))}
      </QueuePanel>
    </WorkspaceSection>
  );
}

function FinanceTab() {
  return (
    <WorkspaceSection>
      <QueuePanel title="Payment provider queue" pill="References only">
        {financeRows.map((row) => (
          <DataRow key={row.id} kicker={row.id} title={`${row.provider} ${row.status}`} meta={`${row.trip} ${formatRand(row.amountCents)}`}>
            <ActionRow primary="Review" secondary="Open receipt" />
          </DataRow>
        ))}
      </QueuePanel>
      <QueuePanel title="Refund policy checks" pill="R500 fee policy">
        <p className="muted">
          Finance reviews cancellation refunds against the published tier table before
          provider refunds are requested.
        </p>
        <ActionRow primary="Open refund queue" secondary="View policy table" />
      </QueuePanel>
    </WorkspaceSection>
  );
}

function SupportTab() {
  return (
    <WorkspaceSection>
      <QueuePanel title="Pause, adjust, or cancel" pill="No late fees">
        {supportCases.map((supportCase) => (
          <DataRow key={supportCase.id} kicker={supportCase.id} title={`${supportCase.traveller} ${supportActionTitles[supportCase.action]}`} meta={`${supportCase.destination} contribution ${formatRand(supportCase.amountCents)}`}>
            <p className="muted">{supportCase.age}</p>
            <ActionRow primary="Resolve" secondary="Message traveller" />
          </DataRow>
        ))}
      </QueuePanel>
      <QueuePanel title="Support principles" pill="Warm Calm">
        <p className="muted">
          Support flows use grace, pause, adjust, and cancel. Admin copy avoids shame,
          penalty language, and lender-style escalation.
        </p>
      </QueuePanel>
    </WorkspaceSection>
  );
}

function KycTab() {
  return (
    <WorkspaceSection>
      <QueuePanel title="KYC review" pill="Oldest first">
        {submissions.map((submission) => {
          const requirements = getKycTierRequirements(submission.requestedTier);
          const missingDocuments = requirements.requiredDocuments.filter(
            (documentKind) => !submission.documents.includes(documentKind)
          );

          return (
            <DataRow key={submission.id} kicker={submission.id} title={submission.traveller} meta={`${requirements.title} for ${formatRand(submission.amountCents)}`}>
              <ChipRow
                items={requirements.requiredDocuments.map((documentKind) => ({
                  label: documentLabels[documentKind],
                  state: submission.documents.includes(documentKind) ? "ok" : "missing"
                }))}
              />
              <p className="muted">
                {missingDocuments.length > 0
                  ? `Missing ${missingDocuments.map((item) => documentLabels[item]).join(", ")}`
                  : getKycStatusCopy(submission.status, submission.requestedTier)}
              </p>
              <ActionRow primary="Approve" secondary="Request clearer file" />
            </DataRow>
          );
        })}
      </QueuePanel>
      <QueuePanel title="Review guardrails" pill="Protective only">
        <p className="muted">
          Verification is used to protect travellers and bookings. It is not a credit check
          and does not create debt.
        </p>
      </QueuePanel>
    </WorkspaceSection>
  );
}

function UsersTab() {
  return (
    <WorkspaceSection single>
      <QueuePanel title="User overview" pill="KYC and trips">
        {users.map((user) => (
          <DataRow key={user.id} kicker={user.id} title={user.name} meta={`${user.tier} verification, ${user.trips} trip plans`}>
            <span className={user.status === "Active" ? "ok-pill" : "risk-pill"}>{user.status}</span>
          </DataRow>
        ))}
      </QueuePanel>
    </WorkspaceSection>
  );
}

function AuditTab() {
  return (
    <WorkspaceSection single>
      <QueuePanel title="Recent audit events" pill="Immutable trail">
        {auditRows.map((row) => (
          <DataRow key={row.id} kicker={row.id} title={row.action} meta={`${row.actor} on ${row.entity}`} />
        ))}
      </QueuePanel>
    </WorkspaceSection>
  );
}

function WorkspaceSection({ children, single = false }: { children: ReactNode; single?: boolean }) {
  return (
    <div className="workspace-section">
      <div className={single ? "workspace-grid single" : "workspace-grid"}>{children}</div>
    </div>
  );
}

function QueuePanel({
  title,
  pill,
  children
}: {
  title: string;
  pill: string;
  children: ReactNode;
}) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <h3>{title}</h3>
        <span className="soft-pill">{pill}</span>
      </div>
      <div className="review-list">{children}</div>
    </div>
  );
}

function DataRow({
  kicker,
  title,
  meta,
  children
}: {
  kicker: string;
  title: string;
  meta: string;
  children?: ReactNode;
}) {
  return (
    <div className="review-row">
      <div className="review-main">
        <div>
          <p className="row-kicker">{kicker}</p>
          <h4>{title}</h4>
          <p className="muted">{meta}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ActionRow({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="actions">
      <button type="button">{primary}</button>
      <button type="button" className="secondary-button">
        {secondary}
      </button>
    </div>
  );
}

function ChipRow({ items }: { items: Array<{ label: string; state: "ok" | "missing" }> }) {
  return (
    <div className="document-chips">
      {items.map((item) => (
        <span key={item.label} className={item.state === "ok" ? "doc-ok" : "doc-missing"}>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function Meter({ value, total }: { value: number; total: number }) {
  const width = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div className="meter-block">
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${width}%` }} />
      </div>
      <p className="muted">
        {formatRand(value)} saved of {formatRand(total)}
      </p>
    </div>
  );
}

function formatRand(amountCents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
