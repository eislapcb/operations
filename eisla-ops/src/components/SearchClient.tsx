"use client";

import { useState } from "react";
import Link from "next/link";
import { STAGES, STAGE_LABELS } from "@/lib/constants";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface SearchResult {
  id: string;
  number: string;
  customerName: string | null;
  stage: string;
  tier: string;
  serviceLevel: string;
  paymentStatus: string;
}

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [tier, setTier] = useState("");
  const [payment, setPayment] = useState("");
  const [serviceLevel, setServiceLevel] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    setSearching(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (stage) params.set("stage", stage);
    if (tier) params.set("tier", tier);
    if (payment) params.set("payment", payment);
    if (serviceLevel) params.set("serviceLevel", serviceLevel);

    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    setResults(data);
    setSearching(false);
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search orders, customers, comms..."
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-copper focus:ring-copper"
        />
        <Button onClick={handleSearch} disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs"
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs"
        >
          <option value="">All Tiers</option>
          <option value="T1">T1</option>
          <option value="T2">T2</option>
          <option value="T3">T3</option>
        </select>

        <select
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs"
        >
          <option value="">All Payments</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Paid">Paid</option>
        </select>

        <select
          value={serviceLevel}
          onChange={(e) => setServiceLevel(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs"
        >
          <option value="">All Service Levels</option>
          <option value="standard">Standard</option>
          <option value="priority">Priority</option>
          <option value="express">Express</option>
        </select>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-lg bg-white shadow-sm border border-light overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-light text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/ops/orders/${r.id}`}
                      className="font-medium text-copper hover:underline"
                    >
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.customerName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {STAGE_LABELS[r.stage as keyof typeof STAGE_LABELS] ?? r.stage}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="copper">{r.tier}</Badge>
                  </td>
                  <td className="px-4 py-3 capitalize">{r.serviceLevel}</td>
                  <td className="px-4 py-3">{r.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length === 0 && !searching && (
        <p className="text-sm text-gray-400 text-center py-8">
          Enter a search query or apply filters
        </p>
      )}
    </div>
  );
}
