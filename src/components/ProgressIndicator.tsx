import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, Pause, Play, RotateCcw, AlertCircle } from 'lucide-react';
import { type ProgressState, type ProgressStep } from '@/hooks/useProgress';

export interface ProgressIndicatorProps {
  progress: ProgressState;
  steps: ProgressStep[];
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  showSteps?: boolean;
  showTimeEstimate?: boolean;
  showControls?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  steps,
  onPause,
  onResume,
  onReset,
  showSteps = true,
  showTimeEstimate = true,
  showControls = false,
  variant = 'default',
  className = ''
}) => {
  const formatTime = (ms: number) => {
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
  };

  const getStatusColor = (status: ProgressState['status']) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ProgressState['status']) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(progress.status)}`} />
          <span className="text-sm font-medium">
            {Math.round(progress.progress)}%
          </span>
        </div>
        <Progress value={progress.progress} className="flex-1 h-2" />
        {showTimeEstimate && progress.elapsedTime > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatTime(progress.elapsedTime)}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(progress.status)}
            <CardTitle className="text-lg">
              {progress.status === 'complete' ? 'Complete!' : 
               progress.status === 'error' ? 'Error' :
               progress.currentStepInfo?.label || 'Processing...'}
            </CardTitle>
          </div>
          <Badge variant={progress.status === 'error' ? 'destructive' : 'secondary'}>
            {progress.status}
          </Badge>
        </div>
        {progress.currentStepInfo?.description && (
          <CardDescription>
            {progress.currentStepInfo.description}
          </CardDescription>
        )}
        {progress.message && (
          <CardDescription className="text-sm">
            {progress.message}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{Math.round(progress.progress)}%</span>
          </div>
          <Progress value={progress.progress} className="h-3" />
        </div>

        {/* Time Information */}
        {showTimeEstimate && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Elapsed: {formatTime(progress.elapsedTime)}</span>
            </div>
            {progress.estimatedTimeRemaining && (
              <span>
                Est. remaining: {formatTime(progress.estimatedTimeRemaining)}
              </span>
            )}
          </div>
        )}

        {/* Step Progress */}
        {showSteps && variant === 'detailed' && (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              Steps ({progress.currentStep + 1} of {progress.totalSteps})
            </div>
            <div className="space-y-2">
              {steps.map((step, index) => {
                const isCompleted = index < progress.currentStep;
                const isCurrent = index === progress.currentStep;
                const isPending = index > progress.currentStep;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isCurrent ? 'bg-primary/10 border border-primary/20' :
                      isCompleted ? 'bg-green-50 dark:bg-green-900/20' :
                      'bg-muted/50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : isCurrent ? (
                        <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20 animate-pulse" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        isCurrent ? 'text-primary' :
                        isCompleted ? 'text-green-700 dark:text-green-400' :
                        'text-muted-foreground'
                      }`}>
                        {step.label}
                      </div>
                      {step.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {step.description}
                        </div>
                      )}
                    </div>
                    {step.estimatedDuration && isPending && (
                      <div className="text-xs text-muted-foreground">
                        ~{formatTime(step.estimatedDuration)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="flex gap-2 pt-2 border-t">
            {progress.status === 'running' && onPause && (
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            )}
            {progress.status === 'paused' && onResume && (
              <Button variant="outline" size="sm" onClick={onResume}>
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
            )}
            {(progress.status === 'complete' || progress.status === 'error') && onReset && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Specialized progress indicators for different contexts
export const TattooGenerationProgress: React.FC<{
  progress: ProgressState;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
}> = ({ progress, onPause, onResume, onReset }) => {
  const steps = [
    { id: 'validate', label: 'Validating Input', description: 'Checking prompt and parameters' },
    { id: 'generate', label: 'Generating Design', description: 'AI is creating your tattoo design' },
    { id: 'process', label: 'Processing Image', description: 'Optimizing and enhancing the result' },
    { id: 'save', label: 'Saving Design', description: 'Storing your design in the gallery' }
  ];

  return (
    <ProgressIndicator
      progress={progress}
      steps={steps}
      onPause={onPause}
      onResume={onResume}
      onReset={onReset}
      variant="detailed"
      showControls={true}
      className="max-w-md mx-auto"
    />
  );
};

export const TattooAnalysisProgress: React.FC<{
  progress: ProgressState;
}> = ({ progress }) => {
  const steps = [
    { id: 'upload', label: 'Processing Image', description: 'Analyzing uploaded image' },
    { id: 'analyze', label: 'AI Analysis', description: 'Identifying style, elements, and details' },
    { id: 'generate', label: 'Creating Report', description: 'Compiling analysis results' }
  ];

  return (
    <ProgressIndicator
      progress={progress}
      steps={steps}
      variant="detailed"
      className="max-w-md mx-auto"
    />
  );
};

export default ProgressIndicator;
