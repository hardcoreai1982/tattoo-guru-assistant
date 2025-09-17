import { useState, useCallback, useRef, useEffect } from 'react';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  weight?: number; // Relative weight for progress calculation (default: 1)
  estimatedDuration?: number; // Estimated duration in milliseconds
}

export interface ProgressState {
  currentStep: number;
  totalSteps: number;
  progress: number; // 0-100
  isComplete: boolean;
  currentStepInfo?: ProgressStep;
  elapsedTime: number;
  estimatedTimeRemaining?: number;
  status: 'idle' | 'running' | 'paused' | 'complete' | 'error';
  message?: string;
}

export interface UseProgressOptions {
  steps: ProgressStep[];
  autoStart?: boolean;
  onComplete?: () => void;
  onStepChange?: (step: ProgressStep, stepIndex: number) => void;
  onError?: (error: Error) => void;
}

export const useProgress = (options: UseProgressOptions) => {
  const { steps, autoStart = false, onComplete, onStepChange, onError } = options;
  const [state, setState] = useState<ProgressState>({
    currentStep: 0,
    totalSteps: steps.length,
    progress: 0,
    isComplete: false,
    currentStepInfo: steps[0],
    elapsedTime: 0,
    status: 'idle'
  });

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepStartTimeRef = useRef<number | null>(null);

  // Calculate total weight for progress calculation
  const totalWeight = steps.reduce((sum, step) => sum + (step.weight || 1), 0);

  // Calculate progress based on completed steps and their weights
  const calculateProgress = useCallback((currentStepIndex: number, stepProgress = 0) => {
    const completedWeight = steps
      .slice(0, currentStepIndex)
      .reduce((sum, step) => sum + (step.weight || 1), 0);
    
    const currentStepWeight = steps[currentStepIndex]?.weight || 1;
    const currentStepContribution = (currentStepWeight * stepProgress) / 100;
    
    return Math.min(100, ((completedWeight + currentStepContribution) / totalWeight) * 100);
  }, [steps, totalWeight]);

  // Calculate estimated time remaining
  const calculateEstimatedTimeRemaining = useCallback((currentStepIndex: number) => {
    if (!startTimeRef.current) return undefined;
    
    const elapsedTime = Date.now() - startTimeRef.current;
    const completedWeight = steps
      .slice(0, currentStepIndex)
      .reduce((sum, step) => sum + (step.weight || 1), 0);
    
    if (completedWeight === 0) return undefined;
    
    const remainingWeight = totalWeight - completedWeight;
    const timePerWeight = elapsedTime / completedWeight;
    
    return Math.round(timePerWeight * remainingWeight);
  }, [steps, totalWeight]);

  // Start progress tracking
  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    stepStartTimeRef.current = Date.now();
    
    setState(prev => ({
      ...prev,
      status: 'running',
      elapsedTime: 0
    }));

    // Start elapsed time tracking
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsedTime = Date.now() - startTimeRef.current;
        setState(prev => ({
          ...prev,
          elapsedTime,
          estimatedTimeRemaining: calculateEstimatedTimeRemaining(prev.currentStep)
        }));
      }
    }, 1000);
  }, [calculateEstimatedTimeRemaining]);

  // Move to next step
  const nextStep = useCallback((message?: string) => {
    setState(prev => {
      const nextStepIndex = prev.currentStep + 1;
      const isComplete = nextStepIndex >= steps.length;
      
      if (isComplete) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onComplete?.();
        return {
          ...prev,
          currentStep: nextStepIndex,
          progress: 100,
          isComplete: true,
          status: 'complete' as const,
          message
        };
      }

      const newStep = steps[nextStepIndex];
      stepStartTimeRef.current = Date.now();
      onStepChange?.(newStep, nextStepIndex);
      
      return {
        ...prev,
        currentStep: nextStepIndex,
        currentStepInfo: newStep,
        progress: calculateProgress(nextStepIndex),
        message
      };
    });
  }, [steps, calculateProgress, onComplete, onStepChange]);

  // Update current step progress
  const updateStepProgress = useCallback((stepProgress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: calculateProgress(prev.currentStep, stepProgress),
      message
    }));
  }, [calculateProgress]);

  // Set error state
  const setError = useCallback((error: Error) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      status: 'error',
      message: error.message
    }));
    
    onError?.(error);
  }, [onError]);

  // Pause progress
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  // Resume progress
  const resume = useCallback(() => {
    if (state.status === 'paused') {
      setState(prev => ({ ...prev, status: 'running' }));
      
      // Restart elapsed time tracking
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsedTime = Date.now() - startTimeRef.current;
          setState(prev => ({
            ...prev,
            elapsedTime,
            estimatedTimeRemaining: calculateEstimatedTimeRemaining(prev.currentStep)
          }));
        }
      }, 1000);
    }
  }, [state.status, calculateEstimatedTimeRemaining]);

  // Reset progress
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    startTimeRef.current = null;
    stepStartTimeRef.current = null;
    
    setState({
      currentStep: 0,
      totalSteps: steps.length,
      progress: 0,
      isComplete: false,
      currentStepInfo: steps[0],
      elapsedTime: 0,
      estimatedTimeRemaining: undefined,
      status: 'idle',
      message: undefined
    });
  }, [steps]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && state.status === 'idle') {
      start();
    }
  }, [autoStart, start, state.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    start,
    nextStep,
    updateStepProgress,
    setError,
    pause,
    resume,
    reset,
    // Utility functions
    formatElapsedTime: (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
      } else if (minutes > 0) {
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
      } else {
        return `${seconds}s`;
      }
    },
    getProgressPercentage: () => Math.round(state.progress),
    getCurrentStepProgress: () => {
      const stepWeight = state.currentStepInfo?.weight || 1;
      const totalProgress = state.progress;
      const completedWeight = steps
        .slice(0, state.currentStep)
        .reduce((sum, step) => sum + (step.weight || 1), 0);
      
      const currentStepContribution = (totalProgress / 100) * totalWeight - completedWeight;
      return Math.min(100, Math.max(0, (currentStepContribution / stepWeight) * 100));
    }
  };
};
