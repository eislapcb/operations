"use client";

import { useState } from "react";
import { submitEngineerReview } from "@/lib/actions/engineer-review";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function EngineerReviewForm({
  orderId,
}: {
  orderId: string;
}) {
  const [outcome, setOutcome] = useState("approved");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setSubmitting(true);
    await submitEngineerReview(orderId, outcome, comments);
    router.push("/reviews");
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-teal mb-1">
          Outcome
        </label>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="approved">Approved</option>
          <option value="revisions_required">Revisions Required</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-teal mb-1">
          Comments
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Review comments..."
        />
      </div>

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
}
