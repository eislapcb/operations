"use client";

import { toggleConsent } from "@/lib/actions/customers";

interface Props {
  customerId: string;
  field: string;
  label: string;
  value: boolean;
  date: string | null;
  readOnly: boolean;
}

export default function ConsentToggle({
  customerId,
  field,
  label,
  value,
  date,
  readOnly,
}: Props) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-teal">{label}</span>
        {date && (
          <span className="ml-2 text-xs text-gray-400">
            ({new Date(date).toLocaleDateString("en-GB")})
          </span>
        )}
      </div>
      <button
        type="button"
        disabled={readOnly}
        onClick={async () => {
          if (!readOnly) {
            await toggleConsent(customerId, field, !value);
          }
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-green-500" : "bg-gray-300"
        } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
