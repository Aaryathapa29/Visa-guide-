import { useState } from "react";
import { Building2 } from "lucide-react";

const ORG_TYPES = [
  "Immigration Law Firm",
  "Visa Consultancy Agency",
  "HR / Relocation Services",
  "Travel & Tourism Agency",
  "Educational Institution",
  "Corporate HR Department",
  "Other",
];

export default function SelectField({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a3a6b" }}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200"
        style={{
          background: focused ? "#eef4ff" : "#f5f7fb",
          border: `1.5px solid ${focused ? "#2563eb" : "#dce6f5"}`,
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
        }}
      >
        <Building2
          className="w-4 h-4 flex-shrink-0"
          style={{ color: focused ? "#2563eb" : "#5a6e8a" }}
        />
        <select
          id={id}
          name={id}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
          className="flex-1 bg-transparent outline-none appearance-none cursor-pointer"
          style={{ color: "#0d1b3e", fontSize: "0.9rem" }}
        >
          <option value="" disabled style={{ color: "#9ca3af" }}>
            Select organisation type
          </option>
          {ORG_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
