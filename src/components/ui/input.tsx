import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={generatedId} className="block text-xs font-medium text-[#172B22]">
            {label}
          </label>
        )}
        <input
          id={generatedId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border border-[#D1E2D7] bg-white px-3 py-2 text-sm text-[#172B22] placeholder:text-[#5C7567]/60 focus:border-[#176B45] focus:outline-none focus:ring-1 focus:ring-[#176B45] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-[#D94B4B] focus:border-[#D94B4B] focus:ring-[#D94B4B]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#D94B4B]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
