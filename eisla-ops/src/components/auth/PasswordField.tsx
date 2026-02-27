"use client";

import { useState } from "react";
import { passwordStrength } from "@/lib/password-utils";

const STRENGTH_COLORS = ["bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400", "bg-green-600"];

interface PasswordFieldProps {
  name: string;
  label: string;
  showStrength?: boolean;
  autoComplete?: string;
}

export default function PasswordField({
  name,
  label,
  showStrength = false,
  autoComplete = "new-password",
}: PasswordFieldProps) {
  const [value, setValue] = useState("");
  const strength = passwordStrength(value);

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-teal">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="password"
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-copper focus:ring-copper"
      />
      {showStrength && value.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded ${
                  i <= strength.score ? STRENGTH_COLORS[strength.score] : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{strength.label}</span>
            <span className="text-gray-400">
              {value.length}/64 characters
              {value.length < 15 && (
                <span className="text-red-500 ml-1">
                  (min 15)
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
