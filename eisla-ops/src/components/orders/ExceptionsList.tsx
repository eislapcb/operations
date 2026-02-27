"use client";

import { resolveException } from "@/lib/actions/sense-check";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface Props {
  exceptions: any[];
}

export default function ExceptionsList({ exceptions }: Props) {
  if (exceptions.length === 0) {
    return <p className="text-sm text-gray-400">No exceptions</p>;
  }

  return (
    <div className="space-y-3">
      {exceptions.map((exc) => (
        <div
          key={exc.id}
          className="rounded-lg bg-white p-4 shadow-sm border border-light"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {exc.orderNumber && (
                <Link
                  href={`/ops/orders/${exc.orderId}`}
                  className="font-medium text-copper hover:underline text-sm"
                >
                  {exc.orderNumber}
                </Link>
              )}
              <Badge variant={exc.resolved ? "on_track" : "overdue"}>
                {exc.resolved ? "Resolved" : "Open"}
              </Badge>
              {exc.type && <Badge variant="copper">{exc.type}</Badge>}
            </div>
            <span className="text-xs text-gray-400">
              {exc.createdAt
                ? new Date(exc.createdAt).toLocaleString("en-GB")
                : ""}
            </span>
          </div>
          <p className="text-sm text-gray-600">{exc.description}</p>
          {exc.resolved && exc.resolvedBy && (
            <p className="mt-1 text-xs text-gray-400">
              Resolved by {exc.resolvedBy} on{" "}
              {exc.resolvedAt
                ? new Date(exc.resolvedAt).toLocaleString("en-GB")
                : ""}
            </p>
          )}
          {!exc.resolved && (
            <form action={async () => { await resolveException(exc.id); }} className="mt-2">
              <Button size="sm" type="submit">
                Resolve
              </Button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
