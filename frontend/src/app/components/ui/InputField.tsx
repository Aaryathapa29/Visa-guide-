import { useState } from "react";
import { HelpCircle, Eye, EyeOff } from "lucide-react";

export interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  icon: React.ReactNode;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  tooltip?: string;
  trailingToggle?: { show: boolean; onToggle: () => void };
}

export default function InputField({
  id,
  label,
  type = "text",
  placeholder,
  icon,
  value,
  onChange,
  required,
  tooltip,
  trailingToggle,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={id}
          style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a3a6b" }}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {tooltip && (
          <div className="relative group">
            <HelpCircle
              className="w-3.5 h-3.5 cursor-help"
              style={{ color: "#5a6e8a" }}
              aria-label={tooltip}
            />
            <div
              className="absolute left-5 -top-1 z-10 hidden group-hover:block w-52 rounded-lg p-2.5 text-xs shadow-lg"
              style={{ background: "#0d1b3e", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}
              role="tooltip"
            >
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200"
        style={{
          background: focused ? "#eef4ff" : "#f5f7fb",
          border: `1.5px solid ${focused ? "#2563eb" : "#dce6f5"}`,
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
        }}
      >
        <span style={{ color: focused ? "#2563eb" : "#5a6e8a" }}>{icon}</span>
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
          className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
          style={{ color: "#0d1b3e", fontSize: "0.9rem" }}
        />
        {trailingToggle && (
          <button
            type="button"
            onClick={trailingToggle.onToggle}
            className="flex-shrink-0 transition-colors"
            aria-label={trailingToggle.show ? "Hide password" : "Show password"}
            style={{ color: "#5a6e8a" }}
          >
            {trailingToggle.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
