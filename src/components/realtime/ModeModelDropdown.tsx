import React from 'react';
import { ChevronDown, Mic, MicOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RealtimeMode, AIModel } from '@/lib/realtime/types';

interface ModeModelDropdownProps {
  mode: RealtimeMode;
  model: AIModel;
  onModeChange: (mode: RealtimeMode) => void;
  onModelChange: (model: AIModel) => void;
  isConnected: boolean;
}

export function ModeModelDropdown({
  mode,
  model,
  onModeChange,
  onModelChange,
  isConnected
}: ModeModelDropdownProps) {
  const getModeIcon = () => {
    return mode === 'hands-free' ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />;
  };

  const getModeLabel = () => {
    return mode === 'hands-free' ? 'Hands-Free' : 'Push-to-Talk';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-card">
          {getModeIcon()}
          <span className="hidden sm:inline">{getModeLabel()}</span>
          <Badge variant="secondary" className="text-xs">
            GPT-4o
          </Badge>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover border-border" align="end">
        <DropdownMenuLabel className="text-popover-foreground">Voice Mode</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onModeChange('hands-free')}
          className="gap-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          disabled={!isConnected}
        >
          <Mic className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Hands-Free</span>
            <span className="text-xs text-muted-foreground">Voice activity detection</span>
          </div>
          {mode === 'hands-free' && (
            <Badge className="ml-auto bg-primary text-primary-foreground">Active</Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onModeChange('push-to-talk')}
          className="gap-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          disabled={!isConnected}
        >
          <MicOff className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Push-to-Talk</span>
            <span className="text-xs text-muted-foreground">Manual control</span>
          </div>
          {mode === 'push-to-talk' && (
            <Badge className="ml-auto bg-primary text-primary-foreground">Active</Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-popover-foreground">AI Model</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onModelChange('gpt-4o-realtime-preview')}
          className="gap-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="flex flex-col">
            <span>GPT-4o Realtime</span>
            <span className="text-xs text-muted-foreground">Ultra-fast voice processing</span>
          </div>
          <Badge className="ml-auto bg-accent text-accent-foreground">Preview</Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}