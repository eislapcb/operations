"use client";

import { useState } from "react";
import { createNcr, updateNcrStatus } from "@/lib/actions/ncr";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function NCRList({ ncrs }: { ncrs: any[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Raise NCR"}
      </Button>

      {showForm && (
        <form
          action={async (fd) => {
            await createNcr(fd);
            setShowForm(false);
          }}
          className="rounded-lg bg-white p-4 shadow-sm border border-light space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-teal mb-1">Date</label>
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-teal mb-1">Severity</label>
              <select name="severity" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-teal mb-1">Description</label>
            <textarea
              name="description"
              required
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" size="sm">Submit NCR</Button>
        </form>
      )}

      {ncrs.length === 0 ? (
        <p className="text-sm text-gray-400">No NCRs recorded</p>
      ) : (
        <div className="rounded-lg bg-white shadow-sm border border-light overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-light text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Raised By</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ncrs.map((n) => (
                <tr key={n.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium">{n.number}</td>
                  <td className="px-4 py-3">{n.date}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        n.severity === "Critical" || n.severity === "High"
                          ? "overdue"
                          : n.severity === "Medium"
                            ? "at_risk"
                            : "on_track"
                      }
                    >
                      {n.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{n.description}</td>
                  <td className="px-4 py-3">
                    <Badge variant={n.status === "Open" ? "overdue" : "on_track"}>
                      {n.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{n.raisedBy}</td>
                  <td className="px-4 py-3">
                    {n.status === "Open" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await updateNcrStatus(n.id, "Closed");
                        }}
                      >
                        Close
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
