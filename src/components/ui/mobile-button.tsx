import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Mobile-specific sizes
        mobile: "h-12 px-6 py-3 text-base",
        "mobile-sm": "h-10 px-4 py-2 text-sm",
        "mobile-lg": "h-14 px-8 py-4 text-lg",
        "mobile-icon": "h-12 w-12",
        "touch-target": "min-h-[44px] min-w-[44px] px-4",
      },
      touchOptimized: {
        true: "touch-manipulation select-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      touchOptimized: false,
    },
  }
);

export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mobileButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  longPressDelay?: number;
  onLongPress?: () => void;
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    touchOptimized,
    asChild = false, 
    loading = false,
    hapticFeedback = false,
    longPressDelay = 500,
    onLongPress,
    children,
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    onMouseUp,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const mobile = useMobileOptimizations();
    const longPressTimer = React.useRef<NodeJS.Timeout>();
    const [isPressed, setIsPressed] = React.useState(false);

    // Auto-detect mobile optimizations
    const shouldUseMobileSize = mobile.isMobile && !size;
    const shouldUseTouchOptimization = mobile.isTouchDevice || touchOptimized;
    
    const finalSize = shouldUseMobileSize ? "mobile" : size;
    const finalTouchOptimized = shouldUseTouchOptimization;

    // Haptic feedback (if supported)
    const triggerHapticFeedback = React.useCallback(() => {
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10); // Short vibration
      }
    }, [hapticFeedback]);

    // Long press handling
    const startLongPress = React.useCallback(() => {
      if (onLongPress && !disabled) {
        longPressTimer.current = setTimeout(() => {
          onLongPress();
          triggerHapticFeedback();
        }, longPressDelay);
      }
    }, [onLongPress, disabled, longPressDelay, triggerHapticFeedback]);

    const cancelLongPress = React.useCallback(() => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = undefined;
      }
    }, []);

    // Enhanced touch handlers
    const handleTouchStart = React.useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
      setIsPressed(true);
      startLongPress();
      onTouchStart?.(e);
    }, [startLongPress, onTouchStart]);

    const handleTouchEnd = React.useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      cancelLongPress();
      onTouchEnd?.(e);
    }, [cancelLongPress, onTouchEnd]);

    const handleMouseDown = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!mobile.isTouchDevice) {
        setIsPressed(true);
        startLongPress();
      }
      onMouseDown?.(e);
    }, [mobile.isTouchDevice, startLongPress, onMouseDown]);

    const handleMouseUp = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!mobile.isTouchDevice) {
        setIsPressed(false);
        cancelLongPress();
      }
      onMouseUp?.(e);
    }, [mobile.isTouchDevice, cancelLongPress, onMouseUp]);

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticFeedback) {
        triggerHapticFeedback();
      }
      onClick?.(e);
    }, [hapticFeedback, triggerHapticFeedback, onClick]);

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
      };
    }, []);

    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(
          mobileButtonVariants({ variant, size: finalSize, touchOptimized: finalTouchOptimized }),
          // Mobile-specific styles
          mobile.isMobile && "active:scale-95 transition-transform",
          isPressed && mobile.isTouchDevice && "scale-95",
          loading && "opacity-70 cursor-wait",
          // Ensure proper touch targets on mobile
          mobile.isTouchDevice && "min-h-[44px]",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </Comp>
    );
  }
);

MobileButton.displayName = "MobileButton";

// Specialized mobile button variants
export const MobileFAB = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, children, ...props }, ref) => {
    const mobile = useMobileOptimizations();
    
    return (
      <MobileButton
        ref={ref}
        size="mobile-icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
          mobile.isMobile && "bottom-safe-area-inset-bottom right-safe-area-inset-right",
          className
        )}
        hapticFeedback
        {...props}
      >
        {children}
      </MobileButton>
    );
  }
);

MobileFAB.displayName = "MobileFAB";

export const MobileIconButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ size, ...props }, ref) => {
    const mobile = useMobileOptimizations();
    
    return (
      <MobileButton
        ref={ref}
        size={mobile.isMobile ? "mobile-icon" : "icon"}
        variant="ghost"
        touchOptimized
        {...props}
      />
    );
  }
);

MobileIconButton.displayName = "MobileIconButton";

export const MobileSubmitButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, ...props }, ref) => {
    const mobile = useMobileOptimizations();
    
    return (
      <MobileButton
        ref={ref}
        size={mobile.isMobile ? "mobile-lg" : "lg"}
        className={cn(
          "w-full",
          mobile.isMobile && "sticky bottom-0 rounded-t-none border-t",
          className
        )}
        hapticFeedback
        {...props}
      />
    );
  }
);

MobileSubmitButton.displayName = "MobileSubmitButton";

export { mobileButtonVariants };
export default MobileButton;
