"use client";

import { updateCustomer } from "@/lib/actions/customers";
import Button from "@/components/ui/Button";

export default function CustomerEditForm({ customer }: { customer: any }) {
  return (
    <form
      action={async (fd: FormData) => {
        await updateCustomer(customer.id, fd);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "name", label: "Name", value: customer.name },
          { name: "email", label: "Email", value: customer.email },
          { name: "phone", label: "Phone", value: customer.phone },
          { name: "company", label: "Company", value: customer.company },
          { name: "addr1", label: "Address Line 1", value: customer.addr1 },
          { name: "addr2", label: "Address Line 2", value: customer.addr2 },
          { name: "city", label: "City", value: customer.city },
          { name: "county", label: "County", value: customer.county },
          { name: "postcode", label: "Postcode", value: customer.postcode },
          { name: "country", label: "Country", value: customer.country },
          { name: "source", label: "Source", value: customer.source },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-xs font-medium text-teal mb-1">
              {f.label}
            </label>
            <input
              name={f.name}
              defaultValue={f.value ?? ""}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs font-medium text-teal mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          defaultValue={customer.notes ?? ""}
          rows={3}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <Button size="sm" type="submit">
        Save Changes
      </Button>
    </form>
  );
}
