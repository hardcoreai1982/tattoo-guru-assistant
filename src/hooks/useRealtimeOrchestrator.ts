import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeClient } from '@/lib/realtime/client';
import type { 
  ConnectionState, 
  VoiceActivityState, 
  RealtimeMessage, 
  RealtimeMode, 
  AIModel,
  KeywordExtractionResult,
  HandoffPayload 
} from '@/lib/realtime/types';

interface UseRealtimeOrchestratorProps {
  apiKey?: string;
  onTattooGenerate?: (payload: HandoffPayload) => Promise<void>;
}

export function useRealtimeOrchestrator({ 
  apiKey, 
  onTattooGenerate 
}: UseRealtimeOrchestratorProps = {}) {
  const [mode, setMode] = useState<RealtimeMode>('hands-free');
  const [model, setModel] = useState<AIModel>('gpt-4o-realtime-preview');
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    isRecording: false,
    isPushToTalk: false,
  });
  const [voiceState, setVoiceState] = useState<VoiceActivityState>({
    isVadEnabled: false,
    isSpeaking: false,
    volume: 0,
  });
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<RealtimeClient | null>(null);

  // Initialize client when API key is available
  useEffect(() => {
    if (apiKey && !clientRef.current) {
      const client = new RealtimeClient(apiKey);
      
      // Set up event handlers
      client.onConnectionStateChange = setConnectionState;
      client.onVoiceStateChange = setVoiceState;
      client.onMessage = (message) => {
        setMessages(prev => [...prev, message]);
      };
      client.onKeywordExtraction = handleKeywordExtraction;
      client.onError = (err) => {
        console.error('Realtime error:', err);
        setError(err.message);
      };

      clientRef.current = client;
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [apiKey]);

  const handleKeywordExtraction = useCallback(async (keywords: KeywordExtractionResult) => {
    if (!onTattooGenerate) {
      console.warn('No tattoo generation handler provided');
      return;
    }

    try {
      // Create handoff payload
      const payload: HandoffPayload = {
        operation: 'design', // Default to design, could be configurable
        keywords,
        model_choice: 'flux', // Default model, could be configurable
      };

      await onTattooGenerate(payload);
      
      // Add system message about sending to design lab
      const systemMessage: RealtimeMessage = {
        type: 'system',
        content: 'Sending your specifications to the Design Lab...',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, systemMessage]);
      
    } catch (error) {
      console.error('Failed to generate tattoo:', error);
      setError('Failed to send design to generation system');
    }
  }, [onTattooGenerate]);

  const connect = useCallback(async () => {
    if (!clientRef.current) {
      setError('Client not initialized. Please provide an API key.');
      return;
    }

    try {
      setError(null);
      await clientRef.current.connect(mode);
    } catch (err) {
      console.error('Connection failed:', err);
      setError('Failed to connect to voice service');
    }
  }, [mode]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  const startRecording = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.startRecording();
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopRecording();
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    mode,
    model,
    connectionState,
    voiceState,
    messages,
    error,
    
    // Actions
    setMode,
    setModel,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    clearMessages,
    clearError,
    
    // Computed
    isConnected: connectionState.status === 'connected',
    isReady: !!apiKey && !!clientRef.current,
  };
}