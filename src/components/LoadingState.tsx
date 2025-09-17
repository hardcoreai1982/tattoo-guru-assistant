import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, Palette, Wand2, Eye, MessageSquare } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  progress?: number;
  variant?: 'default' | 'card' | 'inline' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  icon?: 'default' | 'sparkles' | 'palette' | 'wand' | 'eye' | 'chat';
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  submessage,
  progress,
  variant = 'default',
  size = 'md',
  showProgress = false,
  icon = 'default',
  className = ''
}) => {
  const getIcon = () => {
    const iconProps = {
      className: `animate-spin ${getSizeClasses().icon}`
    };

    switch (icon) {
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'palette':
        return <Palette {...iconProps} />;
      case 'wand':
        return <Wand2 {...iconProps} />;
      case 'eye':
        return <Eye {...iconProps} />;
      case 'chat':
        return <MessageSquare {...iconProps} />;
      default:
        return <Loader2 {...iconProps} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'h-4 w-4',
          text: 'text-sm',
          subtext: 'text-xs',
          spacing: 'space-y-2',
          padding: 'p-4'
        };
      case 'lg':
        return {
          icon: 'h-12 w-12',
          text: 'text-xl',
          subtext: 'text-base',
          spacing: 'space-y-6',
          padding: 'p-8'
        };
      default:
        return {
          icon: 'h-8 w-8',
          text: 'text-base',
          subtext: 'text-sm',
          spacing: 'space-y-4',
          padding: 'p-6'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses.spacing} ${className}`}>
      <div className="flex items-center justify-center mb-2">
        {getIcon()}
      </div>
      
      <div className="space-y-2">
        <p className={`font-medium text-foreground ${sizeClasses.text}`}>
          {message}
        </p>
        
        {submessage && (
          <p className={`text-muted-foreground ${sizeClasses.subtext}`}>
            {submessage}
          </p>
        )}
      </div>

      {showProgress && progress !== undefined && (
        <div className="w-full max-w-xs space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}
    </div>
  );

  switch (variant) {
    case 'card':
      return (
        <Card className="w-full">
          <CardContent className={sizeClasses.padding}>
            <LoadingContent />
          </CardContent>
        </Card>
      );

    case 'inline':
      return (
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className={`font-medium ${sizeClasses.text}`}>{message}</p>
            {submessage && (
              <p className={`text-muted-foreground ${sizeClasses.subtext}`}>
                {submessage}
              </p>
            )}
          </div>
        </div>
      );

    case 'fullscreen':
      return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className={sizeClasses.padding}>
              <LoadingContent />
            </CardContent>
          </Card>
        </div>
      );

    default:
      return (
        <div className={sizeClasses.padding}>
          <LoadingContent />
        </div>
      );
  }
};

// Specialized loading components for different contexts
export const TattooGenerationLoading: React.FC<{ progress?: number }> = ({ progress }) => (
  <LoadingState
    message="Generating your tattoo design..."
    submessage="This may take a few moments while our AI creates your unique design"
    icon="wand"
    variant="card"
    size="lg"
    progress={progress}
    showProgress={progress !== undefined}
  />
);

export const TattooAnalysisLoading: React.FC = () => (
  <LoadingState
    message="Analyzing your tattoo..."
    submessage="Our AI is examining the design, style, and details"
    icon="eye"
    variant="card"
    size="lg"
  />
);

export const ChatLoading: React.FC = () => (
  <LoadingState
    message="AI is thinking..."
    submessage="Preparing a helpful response for you"
    icon="chat"
    variant="inline"
    size="sm"
  />
);

export const GalleryLoading: React.FC = () => (
  <LoadingState
    message="Loading your designs..."
    submessage="Fetching your saved tattoo designs and analyses"
    icon="palette"
    variant="card"
    size="md"
  />
);

export const VoiceChatLoading: React.FC = () => (
  <LoadingState
    message="Connecting to voice chat..."
    submessage="Setting up real-time audio connection"
    icon="chat"
    variant="card"
    size="md"
  />
);

export const AuthLoading: React.FC = () => (
  <LoadingState
    message="Signing you in..."
    submessage="Please wait while we authenticate your account"
    icon="default"
    variant="card"
    size="md"
  />
);

export const PageLoading: React.FC<{ pageName?: string }> = ({ pageName = 'page' }) => (
  <LoadingState
    message={`Loading ${pageName}...`}
    icon="default"
    variant="fullscreen"
    size="lg"
  />
);

// Loading skeleton components for specific UI elements
export const DesignCardSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <div className="aspect-square bg-muted rounded-t-lg" />
    <CardContent className="p-4 space-y-3">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-6 bg-muted rounded w-16" />
        <div className="h-6 bg-muted rounded w-20" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-muted rounded w-24" />
        <div className="flex gap-1">
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DesignGallerySkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <DesignCardSkeleton key={i} />
    ))}
  </div>
);

export const ConversationSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-xs p-3 rounded-lg ${i % 2 === 0 ? 'bg-muted' : 'bg-primary/10'}`}>
          <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2" />
          <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export const NavbarSkeleton: React.FC = () => (
  <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-8 w-32 bg-muted rounded" />
      </div>
      <div className="flex items-center space-x-4">
        <div className="h-9 w-20 bg-muted rounded" />
        <div className="h-9 w-20 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded-full" />
      </div>
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-24" />
      <div className="h-10 bg-muted rounded" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-32" />
      <div className="h-24 bg-muted rounded" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-20" />
        <div className="h-10 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
    <div className="h-10 bg-muted rounded w-32" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4
}) => (
  <div className="animate-pulse">
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded w-3/4" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b last:border-b-0 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingState;
