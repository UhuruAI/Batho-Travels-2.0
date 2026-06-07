"use client";

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
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge, Button, Stat, Table, ThemeToggle } from "@batho/ui";
import { ConvexStatus } from "./ConvexStatus";
import { useAdminAuth } from "./useAdminAuth";

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
  { id: "TRIP-204", traveller: "Amina D.", destination: "Cape Town", status: "active", savedCents: 920_000, totalCents: 2_500_000, stage: "Flights" },
  { id: "TRIP-203", traveller: "Neo M.", destination: "Durban", status: "paused", savedCents: 185_000, totalCents: 1_200_000, stage: "Stay" }
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
  { id: "KYC-1042", traveller: "Amina D.", requestedTier: "enhanced", amountCents: 8_400_000, documents: ["identityDocument", "proofOfAddress", "selfie"], status: "pending", severity: "normal" },
  { id: "KYC-1041", traveller: "Mpho R.", requestedTier: "standard", amountCents: 3_200_000, documents: ["identityDocument"], status: "pending", severity: "urgent" }
];

const supportCases: Array<{ id: string; traveller: string; destination: string; action: TripSupportAction; amountCents: number; age: string; }> = [
  { id: "SUP-221", traveller: "Neo M.", destination: "Durban", action: "adjust", amountCents: 185_000, age: "Grace window ended today" },
  { id: "SUP-219", traveller: "Kabelo S.", destination: "Zanzibar", action: "pause", amountCents: 420_000, age: "Requested yesterday" }
];

const destinationRequests = [
  { id: "DEST-88", traveller: "Amina D.", destinationName: "Essaouira", country: "Morocco", notes: "Beach, food, calmer shoulder-season pace, and a realistic long-haul savings plan." },
  { id: "DEST-87", traveller: "Neo M.", destinationName: "Lamu", country: "Kenya", notes: "Culture, coast, and a small-group trip outside peak season." }
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
  overview: { eyebrow: "Command centre", title: "Today's work", copy: "Role-separated queues for travel plans, verification, refunds, custom destinations, users, and audit history." },
  operations: { eyebrow: "Operations", title: "Destination and trip operations", copy: "Review live plans, destination requests, staged funding readiness, and travel operations work." },
  finance: { eyebrow: "Finance", title: "Payments and refunds", copy: "Monitor provider references, payment status, refund checks, and receipt review without storing raw payment data." },
  support: { eyebrow: "Support", title: "Traveller support", copy: "Handle grace, pause, adjust, and cancel requests with calm, supportive workflows." },
  kyc: { eyebrow: "KYC", title: "Verification reviews", copy: "Review Standard and Enhanced verification submissions before higher-value booking activity." },
  users: { eyebrow: "Users", title: "Traveller records", copy: "Scan traveller profiles, verification tiers, trip counts, and support readiness." },
  audit: { eyebrow: "Audit", title: "Traceable decisions", copy: "Review admin activity across support, finance, operations, KYC, and custom destination decisions." }
};

export function AdminDashboard({ activeTab }: { activeTab: AdminTabKey }) {
  const header = pageCopy[activeTab];
  const auth = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "unauthed") {
      router.replace("/login");
    }
  }, [auth.status, router]);

  // Only block render when the session is conclusively invalid — that's the
  // moment we're navigating away. For `loading` (e.g. brief hydration window
  // on tab nav) we render the shell so navigation feels instant.
  if (auth.status === "unauthed") {
    return null;
  }

  const initials = auth.email
    ? auth.email
        .split("@")[0]!
        .split(/[._-]/)
        .map((part) => part.charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "AD"
    : "AD";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a href="/" className="admin-sidebar__brand">
          <span className="admin-sidebar__mark">B</span>
          <span className="admin-sidebar__brand-text">
            <small>Batho Travels</small>
            <strong>Admin</strong>
          </span>
        </a>
        <nav className="admin-sidebar__nav" aria-label="Admin tabs">
          {adminTabs.map((tab) => (
            <a
              key={tab.key}
              aria-current={tab.key === activeTab ? "page" : undefined}
              href={tab.href}
            >
              {tab.label}
            </a>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          Roles active: {activeRoles.map(capitalize).join(" · ")}
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Search trips, users, KYC, audit…" aria-label="Search admin records" />
            <kbd>⌘K</kbd>
          </div>
          <div className="admin-topbar__actions">
            <ConvexStatus />
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={() => void auth.signOut()}>
              Sign out
            </Button>
            <span className="admin-avatar" title={auth.email ?? undefined} aria-label={auth.email ? `Signed in as ${auth.email}` : "Admin user"}>
              {initials}
            </span>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-header">
            <div>
              <p className="admin-page-header__eyebrow">{header.eyebrow}</p>
              <h1 className="admin-page-header__title">{header.title}</h1>
            </div>
            <p className="admin-page-header__copy">{header.copy}</p>
          </div>

          <nav className="admin-tabs" aria-label="Section tabs">
            {adminTabs.map((tab) => (
              <a key={tab.key} href={tab.href} aria-current={tab.key === activeTab ? "page" : undefined}>
                {tab.label}
              </a>
            ))}
          </nav>

          {activeTab === "overview" ? <OverviewTab /> : null}
          {activeTab === "operations" ? <OperationsTab /> : null}
          {activeTab === "finance" ? <FinanceTab /> : null}
          {activeTab === "support" ? <SupportTab /> : null}
          {activeTab === "kyc" ? <KycTab /> : null}
          {activeTab === "users" ? <UsersTab /> : null}
          {activeTab === "audit" ? <AuditTab /> : null}
        </div>
      </main>
    </div>
  );
}

function OverviewTab() {
  return (
    <>
      <div className="admin-grid-3" aria-label="Queue summary by role">
        {activeRoles.map((role) => (
          <Stat
            key={role}
            label={capitalize(role)}
            value={queueSummary[role].total}
            delta={`${queueSummary[role].urgent} urgent · ${queueSummary[role].attention} attention`}
          />
        ))}
      </div>

      <h2 className="admin-section-title">Open queues</h2>
      <div className="admin-grid-4" aria-label="Admin queue summary">
        {overviewQueues.map((queue) => (
          <article
            key={queue.label}
            className={`admin-queue-tile${queue.severity === "urgent" ? " admin-queue-tile--urgent" : ""}`}
          >
            <p className="admin-queue-tile__role">{queue.role}</p>
            <p className="admin-queue-tile__count">{queue.count}</p>
            <p className="admin-queue-tile__label">{queue.label}</p>
            <span className={`admin-queue-tile__status admin-queue-tile__status--${queue.severity}`}>
              <span className="admin-queue-tile__dot" aria-hidden="true" />
              {getAdminRiskLabel(queue.severity)}
            </span>
          </article>
        ))}
      </div>

      <h2 className="admin-section-title">Workspace access</h2>
      <div className="admin-grid-3">
        {workspaces.map((workspace) => (
          <article key={workspace.key} className="admin-workspace-card">
            <header className="admin-workspace-card__head">
              <h3 className="admin-workspace-card__title">{workspace.label}</h3>
              <Badge tone="success">Enabled</Badge>
            </header>
            <p className="admin-workspace-card__copy">
              Available to {workspace.roles.map(capitalize).join(", ")}.
            </p>
            <div className="admin-workspace-card__roles">
              {workspace.roles.map((role) => (
                <Badge key={role} tone="outline">{capitalize(role)}</Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function OperationsTab() {
  return (
    <div className="admin-grid-2">
      <Panel title="Trip oversight" pill="Live plans">
        {trips.map((trip) => (
          <DataRow key={trip.id} kicker={trip.id} title={`${trip.destination} for ${trip.traveller}`} meta={`${trip.stage} stage · ${trip.status}`}>
            <Meter value={trip.savedCents} total={trip.totalCents} />
          </DataRow>
        ))}
      </Panel>
      <Panel title="Custom destination review" pill="Pricing review">
        {destinationRequests.map((request) => (
          <DataRow key={request.id} kicker={request.id} title={request.destinationName} meta={`${request.country} · requested by ${request.traveller}`}>
            <p className="admin-row__meta">{request.notes}</p>
            <ActionRow primary="Approve for planner" secondary="Request more detail" />
          </DataRow>
        ))}
      </Panel>
    </div>
  );
}

function FinanceTab() {
  return (
    <div className="admin-grid-2">
      <Panel title="Payment provider queue" pill="References only">
        <Table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Status</th>
              <th>Trip</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {financeRows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.id}</strong><br /><span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{row.provider}</span></td>
                <td><Badge tone={row.status === "Review" ? "warning" : "neutral"}>{row.status}</Badge></td>
                <td>{row.trip}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatRand(row.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
      <Panel title="Refund policy checks" pill="R500 fee policy">
        <DataRow kicker="Policy" title="Sequential cancellation refunds" meta="Finance reviews cancellation refunds against the published tier table before provider refunds are requested.">
          <ActionRow primary="Open refund queue" secondary="View policy table" />
        </DataRow>
      </Panel>
    </div>
  );
}

function SupportTab() {
  return (
    <div className="admin-grid-2">
      <Panel title="Pause, adjust, or cancel" pill="No late fees">
        {supportCases.map((supportCase) => (
          <DataRow key={supportCase.id} kicker={supportCase.id} title={`${supportCase.traveller} · ${supportActionTitles[supportCase.action]}`} meta={`${supportCase.destination} contribution ${formatRand(supportCase.amountCents)}`}>
            <p className="admin-row__meta">{supportCase.age}</p>
            <ActionRow primary="Resolve" secondary="Message traveller" />
          </DataRow>
        ))}
      </Panel>
      <Panel title="Support principles" pill="Warm · Calm">
        <DataRow kicker="Tone" title="Grace, pause, adjust, cancel" meta="Admin copy avoids shame, penalty language, and lender-style escalation. Travellers can pause once per quarter without penalty." />
      </Panel>
    </div>
  );
}

function KycTab() {
  return (
    <div className="admin-grid-2">
      <Panel title="KYC review" pill="Oldest first">
        {submissions.map((submission) => {
          const requirements = getKycTierRequirements(submission.requestedTier);
          const missingDocuments = requirements.requiredDocuments.filter(
            (documentKind) => !submission.documents.includes(documentKind)
          );

          return (
            <DataRow key={submission.id} kicker={submission.id} title={submission.traveller} meta={`${requirements.title} · ${formatRand(submission.amountCents)}`}>
              <div className="admin-chips">
                {requirements.requiredDocuments.map((documentKind) => (
                  <Badge
                    key={documentKind}
                    tone={submission.documents.includes(documentKind) ? "success" : "warning"}
                  >
                    {documentLabels[documentKind]}
                  </Badge>
                ))}
              </div>
              <p className="admin-row__meta">
                {missingDocuments.length > 0
                  ? `Missing ${missingDocuments.map((item) => documentLabels[item]).join(", ")}`
                  : getKycStatusCopy(submission.status, submission.requestedTier)}
              </p>
              <ActionRow primary="Approve" secondary="Request clearer file" />
            </DataRow>
          );
        })}
      </Panel>
      <Panel title="Review guardrails" pill="Protective only">
        <DataRow kicker="Why" title="Protect travellers and bookings" meta="Verification is used to protect travellers and bookings. It is not a credit check and does not create debt." />
      </Panel>
    </div>
  );
}

function UsersTab() {
  return (
    <Panel title="Users" pill="KYC and trips">
      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Verification</th>
            <th>Trips</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td><strong>{user.id}</strong></td>
              <td>{user.name}</td>
              <td>{user.tier}</td>
              <td style={{ fontVariantNumeric: "tabular-nums" }}>{user.trips}</td>
              <td><Badge tone={user.status === "Active" ? "success" : "warning"}>{user.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
}

function AuditTab() {
  return (
    <Panel title="Recent audit events" pill="Immutable trail">
      <Table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          {auditRows.map((row) => (
            <tr key={row.id}>
              <td><strong>{row.id}</strong></td>
              <td>{row.actor}</td>
              <td style={{ fontFamily: "var(--font-data)", fontSize: 13 }}>{row.action}</td>
              <td>{row.entity}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
}

function Panel({ title, pill, children }: { title: string; pill: string; children: ReactNode }) {
  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <h3>{title}</h3>
        <Badge tone="outline">{pill}</Badge>
      </header>
      <div className="admin-panel__body">{children}</div>
    </section>
  );
}

function DataRow({ kicker, title, meta, children }: { kicker: string; title: string; meta: string; children?: ReactNode }) {
  return (
    <div className="admin-row">
      <div className="admin-row__head">
        <div>
          <p className="admin-row__kicker">{kicker}</p>
          <h4 className="admin-row__title">{title}</h4>
          <p className="admin-row__meta">{meta}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ActionRow({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="admin-actions">
      <Button size="sm">{primary}</Button>
      <Button size="sm" variant="secondary">{secondary}</Button>
    </div>
  );
}

function Meter({ value, total }: { value: number; total: number }) {
  const width = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="admin-meter">
      <div className="admin-meter__track">
        <div className="admin-meter__fill" style={{ width: `${width}%` }} />
      </div>
      <p className="admin-row__meta">{formatRand(value)} saved of {formatRand(total)}</p>
    </div>
  );
}

function formatRand(amountCents: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(amountCents / 100);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
