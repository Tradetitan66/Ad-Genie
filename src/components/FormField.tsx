import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  children: ReactNode;
  required?: boolean;
  helperText?: string;
}

export default function FormField({ label, icon: Icon, error, children, required, helperText }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-[#00ffc8]">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="field">
        {Icon && (
          <Icon className="input-icon" size={20} />
        )}
        {children}
      </div>
      {error && (
        <p className="text-red-400 text-sm ml-4">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[#00ffc8]/60 ml-4">{helperText}</p>
      )}
    </div>
  );
}

