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
  disabled?: boolean;
  trailingToggle?: { show: boolean; onToggle: () => void };
  trailingAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
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
  disabled = false,
  trailingToggle,
  trailingAction,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={id}
          style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0a1f44" }}
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
        className="flex items-center gap-3 rounded-[16px] px-4 py-3.5 transition-all duration-200"
        style={{
          background: disabled ? "#f5f7fb" : focused ? "#ffffff" : "#fbfdff",
          border: `1.5px solid ${focused ? "#0a1f44" : "#dce6f5"}`,
          boxShadow: focused ? "0 0 0 4px rgba(10,31,68,0.08)" : "0 8px 24px -14px rgba(10,31,68,0.16)",
        }}
      >
        <span style={{ color: focused ? "#0a1f44" : "#5a6e8a" }}>{icon}</span>
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
          className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
          style={{
            color: disabled ? "#94a3b8" : "#0d1b3e",
            fontSize: "0.9rem",
          }}
        />
        {trailingAction && (
          <button
            type="button"
            onClick={trailingAction.onClick}
            disabled={trailingAction.disabled}
            className="ml-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#0a1f44] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {trailingAction.label}
          </button>
        )}
        {trailingToggle && (
          <button
            type="button"
            onClick={trailingToggle.onToggle}
            className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-slate-100"
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
