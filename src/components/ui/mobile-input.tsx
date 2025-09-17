import * as React from "react";
import { cn } from "@/lib/utils";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

export interface MobileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  autoResize?: boolean;
  mobileKeyboard?: 'default' | 'numeric' | 'email' | 'tel' | 'url' | 'search';
}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({
    className,
    type,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    clearable = false,
    onClear,
    autoResize = false,
    mobileKeyboard = 'default',
    value,
    onChange,
    onFocus,
    onBlur,
    disabled,
    ...props
  }, ref) => {
    const mobile = useMobileOptimizations();
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(Boolean(value));

    // Update hasValue when value prop changes
    React.useEffect(() => {
      setHasValue(Boolean(value));
    }, [value]);

    // Mobile keyboard optimization
    const getInputMode = () => {
      switch (mobileKeyboard) {
        case 'numeric': return 'numeric';
        case 'email': return 'email';
        case 'tel': return 'tel';
        case 'url': return 'url';
        case 'search': return 'search';
        default: return 'text';
      }
    };

    const getInputType = () => {
      if (type) return type;
      switch (mobileKeyboard) {
        case 'numeric': return 'number';
        case 'email': return 'email';
        case 'tel': return 'tel';
        case 'url': return 'url';
        case 'search': return 'search';
        default: return 'text';
      }
    };

    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    }, [onBlur]);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value));
      onChange?.(e);
    }, [onChange]);

    const handleClear = React.useCallback(() => {
      setHasValue(false);
      onClear?.();
    }, [onClear]);

    const inputClasses = cn(
      // Base styles
      "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      // Mobile optimizations
      mobile.isMobile && [
        "h-12 text-base", // Larger touch target and text
        "touch-manipulation", // Optimize for touch
        "-webkit-appearance-none", // Remove iOS styling
        "appearance-none",
      ],
      // Icon spacing
      leftIcon && (mobile.isMobile ? "pl-12" : "pl-10"),
      (rightIcon || clearable) && (mobile.isMobile ? "pr-12" : "pr-10"),
      // Error state
      error && "border-destructive focus-visible:ring-destructive",
      // Focus state
      isFocused && "ring-2 ring-ring ring-offset-2",
      className
    );

    const containerClasses = cn(
      "relative w-full",
      mobile.isKeyboardVisible && "mb-4" // Extra margin when keyboard is visible
    );

    return (
      <div className={containerClasses}>
        {label && (
          <label className={cn(
            "block text-sm font-medium mb-2",
            mobile.isMobile && "text-base",
            error && "text-destructive",
            disabled && "opacity-50"
          )}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
              mobile.isMobile && "left-4"
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            type={getInputType()}
            inputMode={mobile.isMobile ? getInputMode() : undefined}
            className={inputClasses}
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            // Mobile-specific attributes
            autoComplete={mobile.isMobile ? "off" : props.autoComplete}
            autoCorrect={mobile.isMobile ? "off" : undefined}
            autoCapitalize={mobile.isMobile ? "off" : undefined}
            spellCheck={mobile.isMobile ? false : props.spellCheck}
            {...props}
          />
          
          {(rightIcon || (clearable && hasValue && !disabled)) && (
            <div className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2",
              mobile.isMobile && "right-4"
            )}>
              {clearable && hasValue && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    mobile.isMobile && "p-1 -m-1" // Larger touch target
                  )}
                  tabIndex={-1}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 9-6 6" />
                    <path d="m9 9 6 6" />
                  </svg>
                </button>
              )}
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className={cn(
            "mt-2 text-sm",
            mobile.isMobile && "text-base",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

MobileInput.displayName = "MobileInput";

// Mobile-optimized textarea
export interface MobileTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
  maxRows?: number;
  minRows?: number;
}

export const MobileTextarea = React.forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({
    className,
    label,
    error,
    helperText,
    autoResize = false,
    maxRows = 10,
    minRows = 3,
    value,
    onChange,
    onFocus,
    onBlur,
    disabled,
    ...props
  }, ref) => {
    const mobile = useMobileOptimizations();
    const [isFocused, setIsFocused] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-resize functionality
    const adjustHeight = React.useCallback(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;
        
        const scrollHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
        textarea.style.height = `${scrollHeight}px`;
      }
    }, [autoResize, minRows, maxRows]);

    React.useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    }, [onBlur]);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      if (autoResize) {
        adjustHeight();
      }
    }, [onChange, autoResize, adjustHeight]);

    const textareaClasses = cn(
      // Base styles
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      // Mobile optimizations
      mobile.isMobile && [
        "text-base", // Larger text on mobile
        "touch-manipulation",
        "-webkit-appearance-none",
        "appearance-none",
        "resize-none", // Disable manual resize on mobile
      ],
      // Auto-resize
      autoResize && "resize-none overflow-hidden",
      // Error state
      error && "border-destructive focus-visible:ring-destructive",
      // Focus state
      isFocused && "ring-2 ring-ring ring-offset-2",
      className
    );

    return (
      <div className={cn(
        "w-full",
        mobile.isKeyboardVisible && "mb-4"
      )}>
        {label && (
          <label className={cn(
            "block text-sm font-medium mb-2",
            mobile.isMobile && "text-base",
            error && "text-destructive",
            disabled && "opacity-50"
          )}>
            {label}
          </label>
        )}
        
        <textarea
          className={textareaClasses}
          ref={(node) => {
            textareaRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          rows={autoResize ? minRows : props.rows}
          // Mobile-specific attributes
          autoComplete={mobile.isMobile ? "off" : props.autoComplete}
          autoCorrect={mobile.isMobile ? "off" : undefined}
          spellCheck={mobile.isMobile ? false : props.spellCheck}
          {...props}
        />
        
        {(error || helperText) && (
          <div className={cn(
            "mt-2 text-sm",
            mobile.isMobile && "text-base",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

MobileTextarea.displayName = "MobileTextarea";

export default MobileInput;
