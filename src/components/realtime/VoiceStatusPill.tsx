import React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConnectionState } from '@/lib/realtime/types';

interface VoiceStatusPillProps {
  connectionState: ConnectionState;
  tokenUsage?: {
    input: number;
    output: number;
    remaining: number;
  };
}

export function VoiceStatusPill({ connectionState, tokenUsage }: VoiceStatusPillProps) {
  const getStatusContent = () => {
    switch (connectionState.status) {
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
        };
      case 'connecting':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'Connecting',
          variant: 'secondary' as const,
          className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Error',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
        };
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Disconnected',
          variant: 'outline' as const,
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const status = getStatusContent();
  
  const isLowTokens = tokenUsage && tokenUsage.remaining < 1000;
  const tokenPercentage = tokenUsage ? 
    Math.round((tokenUsage.remaining / (tokenUsage.input + tokenUsage.output + tokenUsage.remaining)) * 100) : 
    100;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={status.variant}
        className={cn("gap-1.5 text-xs", status.className)}
      >
        {status.icon}
        {status.text}
      </Badge>
      
      {tokenUsage && connectionState.status === 'connected' && (
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs gap-1",
            isLowTokens && "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-current opacity-60" />
          {tokenPercentage}% tokens
        </Badge>
      )}
    </div>
  );
}