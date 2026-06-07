import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

type FieldProps = {
  label?: string;
  hint?: string;
  id: string;
};

export function Field({ label, hint, id, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className="batho-field">
      {label ? <label htmlFor={id} className="batho-field__label">{label}</label> : null}
      {children}
      {hint ? <p className="batho-field__hint">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={["batho-input", className].filter(Boolean).join(" ")} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={["batho-textarea", className].filter(Boolean).join(" ")} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={["batho-select", className].filter(Boolean).join(" ")}>
      {children}
    </select>
  );
}
