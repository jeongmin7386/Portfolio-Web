import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, id, className = '', ...props }: InputProps) {
  return (
    <label className={`field ${className}`}>
      {label && <span>{label}</span>}
      <input id={id} {...props} />
    </label>
  );
}
