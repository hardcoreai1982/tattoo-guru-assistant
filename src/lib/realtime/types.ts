export interface RealtimeConfig {
  apiKey: string;
  sessionInstructions: string;
  voice: 'alloy' | 'shimmer' | 'nova';
  temperature: number;
  maxTokens: number;
}

export interface KeywordExtractionResult {
  subject?: string;
  theme?: string;
  style?: string;
  color_palette?: string;
  technique?: string;
  artist_refs?: string[];
  body_zone?: string;
}

export interface HandoffPayload {
  operation: 'design' | 'body_preview';
  keywords: KeywordExtractionResult;
  model_choice: 'flux' | 'dalle' | 'gpt-image-1';
}

export interface RealtimeMessage {
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  audioUrl?: string;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  isRecording: boolean;
  isPushToTalk: boolean;
  tokenUsage?: {
    input: number;
    output: number;
    remaining: number;
  };
}

export interface VoiceActivityState {
  isVadEnabled: boolean;
  isSpeaking: boolean;
  volume: number;
}

export type RealtimeMode = 'hands-free' | 'push-to-talk';
export type AIModel = 'gpt-4o-realtime-preview';