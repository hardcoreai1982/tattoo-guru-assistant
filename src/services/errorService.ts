import { toast } from 'sonner';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  API = 'API',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  timestamp: Date;
  context?: string;
  recoverable: boolean;
  retryable: boolean;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export class ErrorService {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 100;

  /**
   * Create a standardized error object
   */
  static createError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    userMessage: string,
    options?: {
      code?: string;
      details?: any;
      context?: string;
      recoverable?: boolean;
      retryable?: boolean;
    }
  ): AppError {
    const error: AppError = {
      type,
      severity,
      message,
      userMessage,
      code: options?.code,
      details: options?.details,
      timestamp: new Date(),
      context: options?.context,
      recoverable: options?.recoverable ?? true,
      retryable: options?.retryable ?? false
    };

    this.logError(error);
    return error;
  }

  /**
   * Handle and display errors to users
   */
  static handleError(
    error: AppError | Error | unknown,
    context?: string,
    recoveryActions?: ErrorRecoveryAction[]
  ): AppError {
    let appError: AppError;

    if (error instanceof Error) {
      appError = this.parseError(error, context);
    } else if (this.isAppError(error)) {
      appError = error;
    } else {
      appError = this.createError(
        ErrorType.UNKNOWN,
        ErrorSeverity.MEDIUM,
        'Unknown error occurred',
        'An unexpected error occurred. Please try again.',
        { context, details: error }
      );
    }

    this.displayError(appError, recoveryActions);
    return appError;
  }

  /**
   * Parse different types of errors into AppError format
   */
  private static parseError(error: Error, context?: string): AppError {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return this.createError(
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        error.message,
        'Network connection issue. Please check your internet connection and try again.',
        { context, retryable: true }
      );
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication') || message.includes('token')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        ErrorSeverity.HIGH,
        error.message,
        'Authentication required. Please sign in to continue.',
        { context, recoverable: true }
      );
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return this.createError(
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        error.message,
        'Please check your input and try again.',
        { context, recoverable: true }
      );
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return this.createError(
        ErrorType.RATE_LIMIT,
        ErrorSeverity.MEDIUM,
        error.message,
        'Too many requests. Please wait a moment before trying again.',
        { context, retryable: true }
      );
    }

    // API errors
    if (message.includes('api') || message.includes('server') || message.includes('service')) {
      return this.createError(
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        error.message,
        'Service temporarily unavailable. Please try again in a few moments.',
        { context, retryable: true }
      );
    }

    // Default unknown error
    return this.createError(
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      error.message,
      'An unexpected error occurred. Please try again.',
      { context }
    );
  }

  /**
   * Display error to user with appropriate UI feedback
   */
  private static displayError(error: AppError, recoveryActions?: ErrorRecoveryAction[]) {
    const toastOptions: any = {
      description: error.context ? `Context: ${error.context}` : undefined,
      duration: this.getToastDuration(error.severity),
    };

    // Add recovery actions if provided
    if (recoveryActions && recoveryActions.length > 0) {
      toastOptions.action = {
        label: recoveryActions[0].label,
        onClick: recoveryActions[0].action
      };
    }

    switch (error.severity) {
      case ErrorSeverity.LOW:
        toast.info(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        toast.error(error.userMessage, toastOptions);
        break;
    }

    // Log to console for debugging
    console.error(`[${error.type}] ${error.message}`, {
      severity: error.severity,
      context: error.context,
      details: error.details,
      timestamp: error.timestamp
    });
  }

  /**
   * Get appropriate toast duration based on severity
   */
  private static getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 3000;
      case ErrorSeverity.MEDIUM:
        return 5000;
      case ErrorSeverity.HIGH:
        return 8000;
      case ErrorSeverity.CRITICAL:
        return 10000;
      default:
        return 5000;
    }
  }

  /**
   * Check if an object is an AppError
   */
  private static isAppError(obj: any): obj is AppError {
    return obj && typeof obj === 'object' && 'type' in obj && 'severity' in obj && 'userMessage' in obj;
  }

  /**
   * Log error for debugging and analytics
   */
  private static logError(error: AppError) {
    this.errorLog.unshift(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  /**
   * Get recent errors for debugging
   */
  static getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clear error log
   */
  static clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Handle async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    options?: {
      retryCount?: number;
      retryDelay?: number;
      fallback?: () => T | Promise<T>;
      onError?: (error: AppError) => void;
    }
  ): Promise<T | null> {
    const { retryCount = 0, retryDelay = 1000, fallback, onError } = options || {};
    
    let lastError: AppError | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handleError(error, `${context} (attempt ${attempt + 1})`);
        
        if (onError) {
          onError(lastError);
        }
        
        // If this is the last attempt or error is not retryable, break
        if (attempt === retryCount || !lastError.retryable) {
          break;
        }
        
        // Wait before retry
        if (retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // Try fallback if available
    if (fallback) {
      try {
        return await fallback();
      } catch (fallbackError) {
        this.handleError(fallbackError, `${context} (fallback)`);
      }
    }
    
    return null;
  }

  /**
   * Create recovery actions for common scenarios
   */
  static createRecoveryActions = {
    retry: (operation: () => void | Promise<void>, label: string = 'Retry'): ErrorRecoveryAction => ({
      label,
      action: operation,
      primary: true
    }),

    refresh: (label: string = 'Refresh Page'): ErrorRecoveryAction => ({
      label,
      action: () => window.location.reload()
    }),

    goHome: (navigate: (path: string) => void, label: string = 'Go Home'): ErrorRecoveryAction => ({
      label,
      action: () => navigate('/')
    }),

    signIn: (navigate: (path: string) => void, label: string = 'Sign In'): ErrorRecoveryAction => ({
      label,
      action: () => navigate('/signin'),
      primary: true
    }),

    contact: (label: string = 'Contact Support'): ErrorRecoveryAction => ({
      label,
      action: () => window.open('mailto:support@tattooguruassistant.com', '_blank')
    })
  };

  /**
   * Handle specific error types with predefined responses
   */
  static handleSpecificError = {
    networkError: (context?: string) => {
      return this.createError(
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        'Network request failed',
        'Unable to connect to our servers. Please check your internet connection.',
        { context, retryable: true }
      );
    },

    authenticationError: (context?: string) => {
      return this.createError(
        ErrorType.AUTHENTICATION,
        ErrorSeverity.HIGH,
        'Authentication failed',
        'Please sign in to access this feature.',
        { context, recoverable: true }
      );
    },

    validationError: (field: string, context?: string) => {
      return this.createError(
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        `Validation failed for ${field}`,
        `Please check the ${field} field and try again.`,
        { context, recoverable: true }
      );
    },

    rateLimitError: (context?: string) => {
      return this.createError(
        ErrorType.RATE_LIMIT,
        ErrorSeverity.MEDIUM,
        'Rate limit exceeded',
        'You\'re making requests too quickly. Please wait a moment before trying again.',
        { context, retryable: true }
      );
    },

    storageError: (context?: string) => {
      return this.createError(
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        'Storage operation failed',
        'Unable to save your data. Please try again.',
        { context, retryable: true }
      );
    }
  };
}
