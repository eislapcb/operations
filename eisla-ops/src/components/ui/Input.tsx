import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-teal mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-copper focus:ring-copper ${className}`}
        {...props}
      />
    </div>
  );
}
