import React, { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConnectionState, VoiceActivityState } from '@/lib/realtime/types';

interface PushToTalkButtonProps {
  connectionState: ConnectionState;
  voiceState: VoiceActivityState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export function PushToTalkButton({
  connectionState,
  voiceState,
  onStartRecording,
  onStopRecording,
  disabled = false
}: PushToTalkButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [keyPressed, setKeyPressed] = useState(false);

  const handleMouseDown = useCallback(() => {
    if (disabled || connectionState.status !== 'connected') return;
    setIsPressed(true);
    onStartRecording();
  }, [disabled, connectionState.status, onStartRecording]);

  const handleMouseUp = useCallback(() => {
    if (!isPressed) return;
    setIsPressed(false);
    onStopRecording();
  }, [isPressed, onStopRecording]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && !keyPressed && !disabled && connectionState.status === 'connected') {
      event.preventDefault();
      setKeyPressed(true);
      setIsPressed(true);
      onStartRecording();
    }
  }, [keyPressed, disabled, connectionState.status, onStartRecording]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && keyPressed) {
      event.preventDefault();
      setKeyPressed(false);
      setIsPressed(false);
      onStopRecording();
    }
  }, [keyPressed, onStopRecording]);

  useEffect(() => {
    if (connectionState.isPushToTalk) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [connectionState.isPushToTalk, handleKeyDown, handleKeyUp]);

  const getButtonContent = () => {
    if (connectionState.status === 'connecting') {
      return (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-background border-t-primary" />
          <span className="hidden sm:inline">Connecting...</span>
        </>
      );
    }

    if (connectionState.status === 'error') {
      return (
        <>
          <MicOff className="h-5 w-5" />
          <span className="hidden sm:inline">Error</span>
        </>
      );
    }

    if (connectionState.isPushToTalk) {
      return (
        <>
          {isPressed ? (
            <Volume2 className={cn("h-5 w-5", voiceState.isSpeaking && "animate-pulse")} />
          ) : (
            <Mic className="h-5 w-5" />
          )}
          <span className="hidden sm:inline">
            {isPressed ? 'Recording...' : 'Hold to Talk'}
          </span>
        </>
      );
    }

    return (
      <>
        {voiceState.isVadEnabled ? (
          <Volume2 className={cn("h-5 w-5", voiceState.isSpeaking && "animate-pulse text-accent")} />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        <span className="hidden sm:inline">
          {voiceState.isVadEnabled ? 'Listening...' : 'Ready'}
        </span>
      </>
    );
  };

  const getButtonVariant = () => {
    if (connectionState.status === 'error') return 'destructive';
    if (isPressed || voiceState.isSpeaking) return 'default';
    return 'outline';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant={getButtonVariant()}
        size="lg"
        className={cn(
          "gap-2 transition-all duration-200",
          isPressed && "scale-95 bg-primary text-primary-foreground",
          voiceState.isSpeaking && "ring-2 ring-accent ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        disabled={disabled || connectionState.status !== 'connected'}
      >
        {getButtonContent()}
      </Button>
      
      {connectionState.isPushToTalk && (
        <p className="text-xs text-muted-foreground text-center">
          Hold button or press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to talk
        </p>
      )}
      
      {voiceState.volume > 0 && (
        <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-100"
            style={{ width: `${Math.min(voiceState.volume * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}