import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'sage';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg select-none';

    const variants = {
      primary: 'bg-[#176B45] hover:bg-[#104C34] text-white shadow-sm focus-visible:ring-[#176B45]',
      secondary: 'bg-[#EAF5EE] text-[#104C34] hover:bg-[#D5EBDD] focus-visible:ring-[#176B45]',
      outline: 'border border-[#D1E2D7] bg-white hover:bg-[#F7F9F8] text-[#172B22] focus-visible:ring-[#176B45]',
      ghost: 'hover:bg-[#EAF5EE] text-[#172B22]',
      danger: 'bg-[#D94B4B] hover:bg-[#B83838] text-white focus-visible:ring-[#D94B4B]',
      sage: 'bg-[#5C7567] hover:bg-[#43594D] text-white focus-visible:ring-[#5C7567]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base font-semibold',
      icon: 'h-10 w-10 p-2',
    };

    return (
      <button ref={ref} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
