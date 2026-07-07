import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <label className={`field ${className}`}>
      {label && <span>{label}</span>}
      <textarea {...props} />
    </label>
  );
}
