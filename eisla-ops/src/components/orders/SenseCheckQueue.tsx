"use client";

import { useState } from "react";
import { submitSenseCheck } from "@/lib/actions/sense-check";
import { REVIEW_CHECKLIST } from "@/lib/constants";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Props {
  orders: any[];
}

export default function SenseCheckQueue({ orders }: Props) {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <SenseCheckCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function SenseCheckCard({ order }: { order: any }) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleDecision(approved: boolean) {
    setSubmitting(true);
    await submitSenseCheck(order.id, approved, notes);
    setSubmitting(false);
  }

  const checks = (order.autoReview?.checks as any[]) ?? [];

  return (
    <Section title={order.number}>
      <div className="space-y-4">
        <div className="flex gap-4 text-sm">
          <span>
            <span className="text-gray-500">Customer:</span>{" "}
            {order.customerName ?? "—"}
          </span>
          <Badge variant="copper">{order.tier}</Badge>
        </div>

        {order.description && (
          <p className="text-sm text-gray-600">{order.description}</p>
        )}

        {/* Auto Review Results */}
        {checks.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-teal mb-2">
              Auto Review Results
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {checks.map((check: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      check.result === "pass"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {check.result === "pass" ? "✓" : "✗"}
                  </span>
                  <span>{check.item ?? REVIEW_CHECKLIST[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision */}
        <div>
          <label className="block text-xs font-medium text-teal mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleDecision(true)}
            disabled={submitting}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDecision(false)}
            disabled={submitting}
          >
            Flag
          </Button>
        </div>
      </div>
    </Section>
  );
}
