import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorService, ErrorType, ErrorSeverity, type AppError, type ErrorRecoveryAction } from '@/services/errorService';

export interface UseErrorHandlerOptions {
  context?: string;
  onError?: (error: AppError) => void;
  defaultRecoveryActions?: ErrorRecoveryAction[];
}

export interface UseErrorHandlerReturn {
  error: AppError | null;
  isError: boolean;
  handleError: (error: unknown, customContext?: string, recoveryActions?: ErrorRecoveryAction[]) => AppError;
  clearError: () => void;
  withErrorHandling: <T>(
    operation: () => Promise<T>,
    operationContext?: string,
    options?: {
      retryCount?: number;
      retryDelay?: number;
      fallback?: () => T | Promise<T>;
      showToast?: boolean;
    }
  ) => Promise<T | null>;
  createRetryAction: (operation: () => void | Promise<void>, label?: string) => ErrorRecoveryAction;
  createNavigationAction: (path: string, label?: string) => ErrorRecoveryAction;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const { context, onError, defaultRecoveryActions = [] } = options;
  const [error, setError] = useState<AppError | null>(null);
  const navigate = useNavigate();

  const handleError = useCallback((
    error: unknown,
    customContext?: string,
    recoveryActions?: ErrorRecoveryAction[]
  ): AppError => {
    const finalContext = customContext || context;
    const finalRecoveryActions = recoveryActions || defaultRecoveryActions;
    
    const appError = ErrorService.handleError(error, finalContext, finalRecoveryActions);
    setError(appError);
    
    if (onError) {
      onError(appError);
    }
    
    return appError;
  }, [context, onError, defaultRecoveryActions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationContext?: string,
    options?: {
      retryCount?: number;
      retryDelay?: number;
      fallback?: () => T | Promise<T>;
      showToast?: boolean;
    }
  ): Promise<T | null> => {
    const { showToast = true, ...errorHandlingOptions } = options || {};
    
    try {
      const result = await ErrorService.withErrorHandling(
        operation,
        operationContext || context || 'Operation',
        {
          ...errorHandlingOptions,
          onError: showToast ? undefined : (error) => {
            setError(error);
            if (onError) {
              onError(error);
            }
          }
        }
      );
      
      // Clear error on successful operation
      if (result !== null) {
        clearError();
      }
      
      return result;
    } catch (error) {
      if (showToast) {
        return null;
      } else {
        handleError(error, operationContext);
        return null;
      }
    }
  }, [context, onError, handleError, clearError]);

  const createRetryAction = useCallback((
    operation: () => void | Promise<void>,
    label: string = 'Retry'
  ): ErrorRecoveryAction => {
    return {
      label,
      action: async () => {
        clearError();
        try {
          await operation();
        } catch (error) {
          handleError(error, 'Retry operation');
        }
      },
      primary: true
    };
  }, [clearError, handleError]);

  const createNavigationAction = useCallback((
    path: string,
    label?: string
  ): ErrorRecoveryAction => {
    const defaultLabels: Record<string, string> = {
      '/': 'Go Home',
      '/signin': 'Sign In',
      '/login': 'Sign In',
      '/profile': 'Go to Profile',
      '/gallery': 'View Gallery',
      '/create': 'Create Tattoo',
      '/analyze': 'Analyze Tattoo'
    };

    return {
      label: label || defaultLabels[path] || `Go to ${path}`,
      action: () => {
        clearError();
        navigate(path);
      }
    };
  }, [navigate, clearError]);

  return {
    error,
    isError: error !== null,
    handleError,
    clearError,
    withErrorHandling,
    createRetryAction,
    createNavigationAction
  };
};

// Specialized hooks for common scenarios
export const useApiErrorHandler = (apiName: string) => {
  return useErrorHandler({
    context: `${apiName} API`,
    defaultRecoveryActions: [
      ErrorService.createRecoveryActions.retry(() => window.location.reload(), 'Retry')
    ]
  });
};

export const useAuthErrorHandler = () => {
  const navigate = useNavigate();
  
  return useErrorHandler({
    context: 'Authentication',
    defaultRecoveryActions: [
      ErrorService.createRecoveryActions.signIn(navigate)
    ]
  });
};

export const useNetworkErrorHandler = () => {
  return useErrorHandler({
    context: 'Network',
    defaultRecoveryActions: [
      ErrorService.createRecoveryActions.retry(() => window.location.reload(), 'Retry'),
      ErrorService.createRecoveryActions.refresh()
    ]
  });
};

export const useFormErrorHandler = (formName: string) => {
  return useErrorHandler({
    context: `${formName} Form`,
    onError: (error) => {
      // Additional form-specific error handling
      if (error.type === ErrorType.VALIDATION) {
        // Could integrate with form validation libraries here
        console.log('Form validation error:', error);
      }
    }
  });
};

// Error boundary hook for React error boundaries
export const useErrorBoundary = () => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const resetError = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  const captureError = useCallback((error: unknown, errorInfo?: any) => {
    const appError = ErrorService.handleError(error, 'React Error Boundary', [
      ErrorService.createRecoveryActions.refresh('Reload Page')
    ]);
    
    setError(appError);
    setHasError(true);
    
    // Log additional React error info
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }, []);

  return {
    hasError,
    error,
    resetError,
    captureError
  };
};
