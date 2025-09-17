import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModeModelDropdown } from './ModeModelDropdown';
import { PushToTalkButton } from './PushToTalkButton';
import { VoiceStatusPill } from './VoiceStatusPill';
import { useRealtimeOrchestrator } from '@/hooks/useRealtimeOrchestrator';
import type { HandoffPayload } from '@/lib/realtime/types';

interface RealtimeChatInterfaceProps {
  apiKey?: string;
  onTattooGenerate?: (payload: HandoffPayload) => Promise<void>;
}

export function RealtimeChatInterface({ 
  apiKey, 
  onTattooGenerate 
}: RealtimeChatInterfaceProps) {
  const {
    mode,
    model,
    connectionState,
    voiceState,
    messages,
    error,
    setMode,
    setModel,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    clearMessages,
    clearError,
    isConnected,
    isReady,
  } = useRealtimeOrchestrator({ apiKey, onTattooGenerate });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Voice Chat</CardTitle>
          <div className="flex items-center gap-3">
            <VoiceStatusPill 
              connectionState={connectionState}
              tokenUsage={connectionState.tokenUsage}
            />
            <ModeModelDropdown
              mode={mode}
              model={model}
              onModeChange={setMode}
              onModelChange={setModel}
              isConnected={isConnected}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {error && (
          <Alert className="mb-4 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-auto p-1 hover:bg-destructive/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!apiKey && (
          <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please configure your OpenAI API key to use voice chat features.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Messages Area */}
          <div className="h-64 border border-border rounded-lg">
            <ScrollArea className="h-full p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Start talking to begin your tattoo design conversation...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg max-w-[80%] ${
                        message.type === 'user'
                          ? 'bg-primary/10 text-primary-foreground ml-auto'
                          : message.type === 'system'
                          ? 'bg-accent/10 text-accent-foreground mx-auto text-center'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-60">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Controls Area */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {!isConnected ? (
                <Button
                  onClick={connect}
                  disabled={!isReady}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Connect Voice Chat
                </Button>
              ) : (
                <Button
                  onClick={disconnect}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  Disconnect
                </Button>
              )}
              
              {messages.length > 0 && (
                <Button
                  onClick={clearMessages}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Messages
                </Button>
              )}
            </div>

            {isConnected && (
              <PushToTalkButton
                connectionState={connectionState}
                voiceState={voiceState}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                disabled={!isConnected}
              />
            )}
          </div>

          {/* Usage Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              • <strong>Hands-Free Mode:</strong> Speak naturally, AI detects when you're talking
            </p>
            <p>
              • <strong>Push-to-Talk Mode:</strong> Hold the button or press spacebar to talk
            </p>
            <p>
              • Describe your tattoo ideas naturally - the AI will extract design elements automatically
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}