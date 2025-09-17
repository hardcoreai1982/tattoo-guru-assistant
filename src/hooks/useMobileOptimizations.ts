import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface MobileOptimizations {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenHeight: number;
  screenWidth: number;
  isSmallScreen: boolean;
  isTouchDevice: boolean;
  hasHover: boolean;
  prefersReducedMotion: boolean;
  isKeyboardVisible: boolean;
}

export interface TouchGestures {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onPinch: (scale: number) => void;
  onDoubleTap: () => void;
}

const TABLET_BREAKPOINT = 1024;
const SMALL_SCREEN_BREAKPOINT = 480;
const SWIPE_THRESHOLD = 50;
const PINCH_THRESHOLD = 0.1;

export const useMobileOptimizations = (): MobileOptimizations => {
  const isMobile = useIsMobile();
  const [optimizations, setOptimizations] = useState<MobileOptimizations>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    screenHeight: 0,
    screenWidth: 0,
    isSmallScreen: false,
    isTouchDevice: false,
    hasHover: true,
    prefersReducedMotion: false,
    isKeyboardVisible: false
  });

  const updateOptimizations = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTablet = width >= 768 && width < TABLET_BREAKPOINT;
    const isDesktop = width >= TABLET_BREAKPOINT;
    const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const orientation = height > width ? 'portrait' : 'landscape';

    // Detect virtual keyboard on mobile
    const isKeyboardVisible = isMobile && height < window.screen.height * 0.75;

    setOptimizations({
      isMobile,
      isTablet,
      isDesktop,
      orientation,
      screenHeight: height,
      screenWidth: width,
      isSmallScreen,
      isTouchDevice,
      hasHover,
      prefersReducedMotion,
      isKeyboardVisible
    });
  }, [isMobile]);

  useEffect(() => {
    updateOptimizations();

    const handleResize = () => updateOptimizations();
    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(updateOptimizations, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Listen for media query changes
    const hoverQuery = window.matchMedia('(hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleHoverChange = () => updateOptimizations();
    const handleMotionChange = () => updateOptimizations();

    hoverQuery.addEventListener('change', handleHoverChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      hoverQuery.removeEventListener('change', handleHoverChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [updateOptimizations]);

  return optimizations;
};

export const useTouchGestures = (
  callbacks: Partial<{
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onSwipeUp: () => void;
    onSwipeDown: () => void;
    onPinch: (scale: number) => void;
    onDoubleTap: () => void;
  }> = {}
): TouchGestures => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [initialDistance, setInitialDistance] = useState<number>(0);

  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      });
    } else if (e.touches.length === 2) {
      setInitialDistance(getTouchDistance(e.touches));
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && initialDistance > 0) {
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / initialDistance;
      
      if (Math.abs(scale - 1) > PINCH_THRESHOLD) {
        callbacks.onPinch?.(scale);
      }
    }
  }, [initialDistance, callbacks]);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Check for double tap
    if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      const now = Date.now();
      if (now - lastTap < 300) {
        callbacks.onDoubleTap?.();
      }
      setLastTap(now);
    }

    // Check for swipe gestures
    if (deltaTime < 500) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          callbacks.onSwipeRight?.();
        } else {
          callbacks.onSwipeLeft?.();
        }
      } else if (Math.abs(deltaY) > SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
          callbacks.onSwipeDown?.();
        } else {
          callbacks.onSwipeUp?.();
        }
      }
    }

    setTouchStart(null);
    setInitialDistance(0);
  }, [touchStart, lastTap, callbacks]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onSwipeLeft: callbacks.onSwipeLeft || (() => {}),
    onSwipeRight: callbacks.onSwipeRight || (() => {}),
    onSwipeUp: callbacks.onSwipeUp || (() => {}),
    onSwipeDown: callbacks.onSwipeDown || (() => {}),
    onPinch: callbacks.onPinch || (() => {}),
    onDoubleTap: callbacks.onDoubleTap || (() => {})
  };
};

// Utility functions for mobile-specific styling
export const getMobileClasses = (mobile: MobileOptimizations) => ({
  container: mobile.isMobile ? 'px-4 py-2' : 'px-6 py-4',
  text: mobile.isSmallScreen ? 'text-sm' : 'text-base',
  spacing: mobile.isMobile ? 'space-y-3' : 'space-y-4',
  button: mobile.isMobile ? 'h-12 text-base' : 'h-10 text-sm',
  card: mobile.isMobile ? 'p-4' : 'p-6',
  grid: mobile.isMobile ? 'grid-cols-1' : mobile.isTablet ? 'grid-cols-2' : 'grid-cols-3',
  gap: mobile.isMobile ? 'gap-3' : 'gap-6'
});

export const getResponsiveValue = <T>(
  mobile: T,
  tablet: T,
  desktop: T,
  optimizations: MobileOptimizations
): T => {
  if (optimizations.isMobile) return mobile;
  if (optimizations.isTablet) return tablet;
  return desktop;
};
