"use client";

import { useState } from "react";
import {
  advanceStage,
  updateOrder,
  linkCustomer,
  addComms,
  generateQuote,
} from "@/lib/actions/orders";
import { STAGE_LABELS, COMMS_TYPES, FILE_LABELS, REVIEW_CHECKLIST } from "@/lib/constants";
import type { OrderSla } from "@/lib/queries";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SLABadge from "@/components/orders/SLABadge";
import SLABar from "@/components/orders/SLABar";

interface Props {
  order: any;
  autoReview: any;
  senseCheck: any;
  engReview: any;
  custApproval: any;
  files: any[];
  comms: any[];
  timeline: any[];
  feedback: any;
  sla: OrderSla | null;
  perms: any;
  user: { id: string; name: string; role: string };
  allCustomers: any[];
}

export default function OrderDetailClient({
  order,
  autoReview,
  senseCheck,
  engReview,
  custApproval,
  files,
  comms,
  timeline,
  feedback,
  sla,
  perms,
  user,
  allCustomers,
}: Props) {
  const [saving, setSaving] = useState(false);
  const canEdit = perms.canDo?.editOrder;
  const canAdvance = perms.canDo?.advanceOrder;

  const stageLabel =
    STAGE_LABELS[order.stage as keyof typeof STAGE_LABELS] ?? order.stage;

  function formatPence(p: number | null) {
    if (!p) return "—";
    return `£${(p / 100).toFixed(2)}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal">{order.number}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="copper">{stageLabel}</Badge>
            <Badge>{order.tier}</Badge>
            <Badge>{order.serviceLevel}</Badge>
            {sla && <SLABadge status={sla.status} />}
          </div>
        </div>
        {canAdvance && order.stage !== "complete" && (
          <form
            action={async () => {
              setSaving(true);
              await advanceStage(order.id);
              setSaving(false);
            }}
          >
            <Button type="submit" disabled={saving}>
              {saving ? "Advancing..." : "Advance Stage"}
            </Button>
          </form>
        )}
      </div>

      {/* SLA Progress */}
      {sla && (
        <Section title="SLA Progress">
          <SLABar
            percent={sla.percent}
            status={sla.status}
            targetHours={sla.targetHours}
            elapsedHours={sla.elapsedHours}
          />
        </Section>
      )}

      {/* Customer Section */}
      {perms.canSee?.customer && (
        <Section
          title="Customer"
          actions={
            canEdit && !order.customerId ? (
              <form
                action={async (fd: FormData) => {
                  const cid = fd.get("customerId") as string;
                  if (cid) await linkCustomer(order.id, cid);
                }}
                className="flex gap-2"
              >
                <select
                  name="customerId"
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                >
                  <option value="">Link customer...</option>
                  {allCustomers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.accountNumber} — {c.name ?? c.company}
                    </option>
                  ))}
                </select>
                <Button size="sm" type="submit">
                  Link
                </Button>
              </form>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>{" "}
              {order.customerName ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Email:</span>{" "}
              {order.email ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>{" "}
              {order.phone ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Company:</span>{" "}
              {order.company ?? "—"}
            </div>
          </div>
        </Section>
      )}

      {/* Service & Payment */}
      {perms.canSee?.finance && (
        <Section title="Service & Payment">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Tier:</span> {order.tier}
            </div>
            <div>
              <span className="text-gray-500">Service:</span>{" "}
              {order.serviceLevel}
            </div>
            <div>
              <span className="text-gray-500">Fee:</span>{" "}
              {formatPence(order.fee)}
            </div>
            <div>
              <span className="text-gray-500">Mfg Estimate:</span>{" "}
              {formatPence(order.mfgEstimate)}
            </div>
            <div>
              <span className="text-gray-500">Payment:</span>{" "}
              {order.paymentStatus}
            </div>
            {order.quoteRef && (
              <div>
                <span className="text-gray-500">Quote:</span> {order.quoteRef}
              </div>
            )}
          </div>
          {canEdit && !order.quoteRef && (
            <form action={async () => { await generateQuote(order.id); }} className="mt-4">
              <Button size="sm" variant="secondary" type="submit">
                Generate Quote
              </Button>
            </form>
          )}
        </Section>
      )}

      {/* Delivery */}
      {perms.canSee?.delivery && (
        <Section title="Delivery">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Address:</span>{" "}
              {[
                order.delAddr1,
                order.delAddr2,
                order.delCity,
                order.delCounty,
                order.delPostcode,
                order.delCountry,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </div>
            <div>
              <span className="text-gray-500">Instructions:</span>{" "}
              {order.delInstructions ?? "—"}
            </div>
            {order.tracking && (
              <div>
                <span className="text-gray-500">Tracking:</span>{" "}
                {order.tracking}
              </div>
            )}
            {order.carrier && (
              <div>
                <span className="text-gray-500">Carrier:</span>{" "}
                {order.carrier}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Description & Notes */}
      <Section title="Description">
        <p className="text-sm text-gray-600">{order.description || "—"}</p>
      </Section>

      {perms.canSee?.notes && (
        <Section title="Notes">
          {canEdit ? (
            <form
              action={async (fd: FormData) => {
                await updateOrder(order.id, fd);
              }}
              className="space-y-2"
            >
              <textarea
                name="notes"
                defaultValue={order.notes ?? ""}
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <Button size="sm" type="submit">
                Save Notes
              </Button>
            </form>
          ) : (
            <p className="text-sm text-gray-600">{order.notes || "—"}</p>
          )}
        </Section>
      )}

      {/* Files */}
      {perms.canSee?.files && (
        <Section title="Files">
          {files.length === 0 ? (
            <p className="text-sm text-gray-400">No files uploaded</p>
          ) : (
            <div className="space-y-2">
              {files.map((f: any) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-md bg-light px-3 py-2 text-sm"
                >
                  <span>
                    {FILE_LABELS[f.fileKey] ?? f.fileKey}{" "}
                    <span className="text-gray-400">v{f.version}</span>
                  </span>
                  {f.url && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-copper hover:underline text-xs"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Auto Review */}
      {perms.canSee?.autoReview && autoReview && (
        <Section title="Auto Review">
          <div className="mb-2">
            <Badge variant={autoReview.result === "pass" ? "on_track" : "overdue"}>
              {autoReview.result?.toUpperCase()}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(autoReview.checks as any[])?.map((check: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={
                    check.result === "pass" ? "text-green-600" : "text-red-600"
                  }
                >
                  {check.result === "pass" ? "✓" : "✗"}
                </span>
                <span>{check.item ?? REVIEW_CHECKLIST[i]}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Sense Check */}
      {perms.canSee?.senseCheck && senseCheck && (
        <Section title="Sense Check">
          <div className="text-sm">
            <p>
              <Badge variant={senseCheck.approved ? "on_track" : "overdue"}>
                {senseCheck.approved ? "Approved" : "Flagged"}
              </Badge>
            </p>
            {senseCheck.notes && (
              <p className="mt-2 text-gray-600">{senseCheck.notes}</p>
            )}
          </div>
        </Section>
      )}

      {/* Engineer Review */}
      {perms.canSee?.engReview && engReview && (
        <Section title="Engineer Review">
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-500">Outcome:</span>{" "}
              {engReview.outcome ?? "Pending"}
            </p>
            {engReview.comments && (
              <p>
                <span className="text-gray-500">Comments:</span>{" "}
                {engReview.comments}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Customer Approval */}
      {perms.canSee?.custApproval && custApproval && (
        <Section title="Customer Approval">
          <div className="text-sm">
            <Badge variant={custApproval.approved ? "on_track" : "overdue"}>
              {custApproval.approved ? "Approved" : "Pending"}
            </Badge>
            {custApproval.method && (
              <p className="mt-1 text-gray-600">Method: {custApproval.method}</p>
            )}
          </div>
        </Section>
      )}

      {/* Manufacturing */}
      {perms.canSee?.mfg && (
        <Section title="Manufacturing">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Fabricator:</span>{" "}
              {order.fab ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Fab Ref:</span>{" "}
              {order.fabRef ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Fab Cost:</span>{" "}
              {formatPence(order.fabCost)}
            </div>
          </div>
        </Section>
      )}

      {/* Communications */}
      <Section
        title="Communications"
        actions={
          canEdit && (
            <CommsForm orderId={order.id} />
          )
        }
      >
        {comms.length === 0 ? (
          <p className="text-sm text-gray-400">No communications logged</p>
        ) : (
          <div className="space-y-3">
            {comms.map((c: any) => (
              <div
                key={c.id}
                className="rounded-md bg-light p-3 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="copper">{c.type}</Badge>
                  <span className="font-medium">{c.subject}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(c.createdAt).toLocaleString("en-GB")}
                  </span>
                </div>
                {c.body && <p className="text-gray-600">{c.body}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Timeline */}
      {perms.canSee?.timeline && (
        <Section title="Timeline">
          {timeline.length === 0 ? (
            <p className="text-sm text-gray-400">No timeline events</p>
          ) : (
            <div className="space-y-2">
              {timeline.map((t: any) => (
                <div key={t.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-teal" />
                  <div>
                    <p className="text-gray-700">{t.event}</p>
                    <p className="text-xs text-gray-400">
                      {t.actor && `${t.actor} · `}
                      {new Date(t.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Feedback */}
      {perms.canSee?.feedback && feedback && (
        <Section title="Customer Feedback">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Overall:</span>{" "}
              {feedback.overall ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Quality:</span>{" "}
              {feedback.quality ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Comms:</span>{" "}
              {feedback.comms ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Time:</span>{" "}
              {feedback.time ?? "—"}
            </div>
            <div>
              <span className="text-gray-500">Use Again:</span>{" "}
              {feedback.useAgain ?? "—"}
            </div>
          </div>
          {feedback.comments && (
            <p className="mt-2 text-sm text-gray-600">{feedback.comments}</p>
          )}
        </Section>
      )}

      {/* T&Cs */}
      {perms.canSee?.tos && (
        <Section title="Terms & Conditions">
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-500">Version:</span>{" "}
              {order.tosVersion ?? "—"}
            </p>
            <p>
              <span className="text-gray-500">Accepted:</span>{" "}
              {order.tosAccepted ? "Yes" : "No"}
              {order.tosAcceptedAt &&
                ` (${new Date(order.tosAcceptedAt).toLocaleString("en-GB")})`}
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Inline Comms Form ──────────────────────────────────────────────
function CommsForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Log Communication
      </Button>
    );
  }

  return (
    <form
      action={async (fd: FormData) => {
        await addComms(orderId, fd);
        setOpen(false);
      }}
      className="space-y-3 rounded-md bg-light p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-teal mb-1">
            Type
          </label>
          <select
            name="type"
            required
            className="block w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
          >
            {COMMS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-teal mb-1">
            Subject
          </label>
          <input
            name="subject"
            required
            className="block w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-teal mb-1">
          Body
        </label>
        <textarea
          name="body"
          rows={3}
          className="block w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit">
          Save
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
