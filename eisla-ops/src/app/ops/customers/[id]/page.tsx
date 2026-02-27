import { db } from "@/db";
import { customers, consentLog, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { logAccess } from "@/lib/access-log";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import ConsentToggle from "@/components/customers/ConsentToggle";
import CustomerEditForm from "@/components/customers/CustomerEditForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const perms = ROLES[user.role];

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  if (!customer) notFound();

  await logAccess(user.id, "view_customer", "customer", id);

  const [consentHistory, customerOrders] = await Promise.all([
    db
      .select()
      .from(consentLog)
      .where(eq(consentLog.customerId, id))
      .orderBy(desc(consentLog.createdAt)),
    db
      .select({
        id: orders.id,
        number: orders.number,
        stage: orders.stage,
        tier: orders.tier,
      })
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt)),
  ]);

  const canEdit = !!perms.canDo && "manageCustomers" in perms.canDo;
  const canSeeGdpr = !!perms.canSee && "gdpr" in perms.canSee;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal">
            {customer.name ?? customer.accountNumber}
          </h1>
          <p className="text-sm text-gray-500">
            {customer.accountNumber} · {customer.company ?? ""}
          </p>
        </div>
        <Badge variant={customer.status === "Active" ? "on_track" : "default"}>
          {customer.status}
        </Badge>
      </div>

      {/* Contact Details */}
      <Section title="Contact Details">
        {canEdit ? (
          <CustomerEditForm customer={customer} />
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Email:</span>{" "}
              {customer.email ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>{" "}
              {customer.phone ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Company:</span>{" "}
              {customer.company ?? "—"}
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Address:</span>{" "}
              {[
                customer.addr1,
                customer.addr2,
                customer.city,
                customer.county,
                customer.postcode,
                customer.country,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </div>
          </div>
        )}
      </Section>

      {/* GDPR Consent */}
      {canSeeGdpr && (
        <Section title="GDPR Consent">
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500">Lawful Basis:</span>{" "}
                {customer.lawfulBasis}
              </div>
              <div>
                <span className="text-gray-500">Retention:</span>{" "}
                {customer.retentionPeriod}
              </div>
              <div>
                <span className="text-gray-500">Privacy Notice:</span>{" "}
                {customer.privacyNoticeVersion ?? "—"}
              </div>
              <div>
                <span className="text-gray-500">Privacy Accepted:</span>{" "}
                {customer.privacyAccepted ? "Yes" : "No"}
              </div>
            </div>

            <h3 className="text-sm font-medium text-teal mb-2">
              Marketing Consent
            </h3>
            <ConsentToggle
              customerId={id}
              field="mktEmail"
              label="Email Marketing"
              value={customer.mktEmail ?? false}
              date={customer.mktEmailDate?.toISOString() ?? null}
              readOnly={!canEdit}
            />
            <ConsentToggle
              customerId={id}
              field="mktSms"
              label="SMS Marketing"
              value={customer.mktSms ?? false}
              date={customer.mktSmsDate?.toISOString() ?? null}
              readOnly={!canEdit}
            />
            <ConsentToggle
              customerId={id}
              field="mktPhone"
              label="Phone Marketing"
              value={customer.mktPhone ?? false}
              date={customer.mktPhoneDate?.toISOString() ?? null}
              readOnly={!canEdit}
            />
            <ConsentToggle
              customerId={id}
              field="mktPost"
              label="Post Marketing"
              value={customer.mktPost ?? false}
              date={customer.mktPostDate?.toISOString() ?? null}
              readOnly={!canEdit}
            />
            <ConsentToggle
              customerId={id}
              field="mktThirdParty"
              label="Third Party"
              value={customer.mktThirdParty ?? false}
              date={customer.mktThirdPartyDate?.toISOString() ?? null}
              readOnly={!canEdit}
            />
          </div>
        </Section>
      )}

      {/* Consent Log */}
      {canSeeGdpr && consentHistory.length > 0 && (
        <Section title="Consent History">
          <div className="space-y-2">
            {consentHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm rounded-md bg-light p-2"
              >
                <span>
                  <span className="font-medium">{entry.field}</span>: {entry.oldValue} → {entry.newValue}
                </span>
                <span className="text-xs text-gray-400">
                  {entry.actor} ·{" "}
                  {entry.createdAt
                    ? new Date(entry.createdAt).toLocaleString("en-GB")
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Orders */}
      {customerOrders.length > 0 && (
        <Section title="Orders">
          <div className="space-y-2">
            {customerOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-md bg-light p-3"
              >
                <Link
                  href={`/ops/orders/${o.id}`}
                  className="font-medium text-copper hover:underline text-sm"
                >
                  {o.number}
                </Link>
                <div className="flex gap-2">
                  <Badge variant="copper">{o.tier}</Badge>
                  <Badge>{o.stage}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
