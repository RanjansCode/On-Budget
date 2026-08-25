import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#FF5A00] text-white hover:bg-[#E04F00] active:scale-[0.98] border border-transparent shadow-xs font-bold',
  secondary:
    'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-[#FF5A00] hover:text-white dark:hover:bg-[#FF5A00] dark:hover:text-white active:scale-[0.98] border border-slate-200/80 dark:border-slate-700/80 shadow-xs font-bold',
  outline:
    'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-[#FF5A00] hover:text-[#FF5A00] dark:hover:border-[#FF5A00] dark:hover:text-[#FF5A00] active:scale-[0.98] font-semibold',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:scale-[0.98] border border-transparent font-semibold',
  destructive:
    'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white active:scale-[0.98] border border-rose-200 dark:border-rose-900/50 font-bold',
  icon:
    'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:text-[#FF5A00] dark:hover:text-[#FF5A00] hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.95] shadow-xs',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm sm:text-base rounded-xl gap-2.5',
  icon: 'w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-xl justify-center items-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClass =
      'inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseClass} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
