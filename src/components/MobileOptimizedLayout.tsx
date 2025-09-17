import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMobileOptimizations, getMobileClasses } from '@/hooks/useMobileOptimizations';

export interface MobileOptimizedLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'fullscreen' | 'split' | 'stacked';
  enableSwipeGestures?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  className = '',
  variant = 'default',
  enableSwipeGestures = false,
  onSwipeLeft,
  onSwipeRight,
  padding = 'md',
  maxWidth = 'full'
}) => {
  const mobile = useMobileOptimizations();
  const mobileClasses = getMobileClasses(mobile);

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none': return '';
      case 'sm': return mobile.isMobile ? 'p-2' : 'p-3';
      case 'md': return mobile.isMobile ? 'p-4' : 'p-6';
      case 'lg': return mobile.isMobile ? 'p-6' : 'p-8';
      default: return mobileClasses.container;
    }
  };

  const getMaxWidthClasses = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-full';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'fullscreen':
        return mobile.isMobile 
          ? 'min-h-screen w-full' 
          : 'min-h-screen w-full';
      case 'split':
        return mobile.isMobile 
          ? 'flex flex-col space-y-4' 
          : 'flex flex-row space-x-6';
      case 'stacked':
        return 'flex flex-col space-y-4';
      default:
        return 'w-full';
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    const touch = e.touches[0];
    (e.currentTarget as any).touchStartX = touch.clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    const touch = e.changedTouches[0];
    const startX = (e.currentTarget as any).touchStartX;
    const deltaX = touch.clientX - startX;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  };

  return (
    <div
      className={cn(
        'mx-auto',
        getVariantClasses(),
        getPaddingClasses(),
        getMaxWidthClasses(),
        // Mobile-specific optimizations
        mobile.isMobile && 'touch-manipulation',
        mobile.isKeyboardVisible && 'pb-safe-area-inset-bottom',
        mobile.orientation === 'landscape' && mobile.isMobile && 'landscape:px-safe-area-inset-x',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        // Ensure proper viewport handling on mobile
        minHeight: mobile.isMobile ? '100dvh' : 'auto',
        // Handle safe areas on modern mobile devices
        paddingTop: mobile.isMobile ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: mobile.isMobile ? 'env(safe-area-inset-bottom)' : undefined,
        paddingLeft: mobile.isMobile ? 'env(safe-area-inset-left)' : undefined,
        paddingRight: mobile.isMobile ? 'env(safe-area-inset-right)' : undefined,
      }}
    >
      {children}
    </div>
  );
};

// Specialized layout components for common patterns
export const MobileSplitLayout: React.FC<{
  left: ReactNode;
  right: ReactNode;
  leftClassName?: string;
  rightClassName?: string;
  className?: string;
}> = ({ left, right, leftClassName = '', rightClassName = '', className = '' }) => {
  const mobile = useMobileOptimizations();

  return (
    <MobileOptimizedLayout variant="split" className={className}>
      <div className={cn(
        mobile.isMobile ? 'w-full' : 'w-1/2',
        leftClassName
      )}>
        {left}
      </div>
      <div className={cn(
        mobile.isMobile ? 'w-full' : 'w-1/2',
        rightClassName
      )}>
        {right}
      </div>
    </MobileOptimizedLayout>
  );
};

export const MobileStackedLayout: React.FC<{
  children: ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, spacing = 'md', className = '' }) => {
  const mobile = useMobileOptimizations();
  
  const getSpacingClass = () => {
    switch (spacing) {
      case 'sm': return mobile.isMobile ? 'space-y-2' : 'space-y-3';
      case 'md': return mobile.isMobile ? 'space-y-4' : 'space-y-6';
      case 'lg': return mobile.isMobile ? 'space-y-6' : 'space-y-8';
      default: return 'space-y-4';
    }
  };

  return (
    <MobileOptimizedLayout variant="stacked" className={cn(getSpacingClass(), className)}>
      {children}
    </MobileOptimizedLayout>
  );
};

export const MobileGridLayout: React.FC<{
  children: ReactNode;
  columns?: { mobile: number; tablet: number; desktop: number };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}) => {
  const mobile = useMobileOptimizations();
  
  const getGridClasses = () => {
    const gapClass = gap === 'sm' ? 'gap-2' : gap === 'lg' ? 'gap-6' : 'gap-4';
    
    if (mobile.isMobile) {
      return `grid grid-cols-${columns.mobile} ${gapClass}`;
    } else if (mobile.isTablet) {
      return `grid grid-cols-${columns.tablet} ${gapClass}`;
    } else {
      return `grid grid-cols-${columns.desktop} ${gapClass}`;
    }
  };

  return (
    <MobileOptimizedLayout className={cn(getGridClasses(), className)}>
      {children}
    </MobileOptimizedLayout>
  );
};

// Mobile-optimized card component
export const MobileCard: React.FC<{
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  border?: boolean;
}> = ({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = true,
  border = true
}) => {
  const mobile = useMobileOptimizations();
  
  const getPaddingClass = () => {
    switch (padding) {
      case 'sm': return mobile.isMobile ? 'p-3' : 'p-4';
      case 'md': return mobile.isMobile ? 'p-4' : 'p-6';
      case 'lg': return mobile.isMobile ? 'p-6' : 'p-8';
      default: return 'p-4';
    }
  };

  return (
    <div className={cn(
      'bg-card text-card-foreground rounded-lg',
      getPaddingClass(),
      shadow && 'shadow-sm',
      border && 'border',
      // Mobile-specific optimizations
      mobile.isMobile && 'touch-manipulation',
      className
    )}>
      {children}
    </div>
  );
};

export default MobileOptimizedLayout;
