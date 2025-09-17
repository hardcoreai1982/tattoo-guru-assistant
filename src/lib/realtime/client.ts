import { SYSTEM_INSTRUCTIONS, EXTRACT_KEYWORDS_TOOL, DEFAULT_CONFIG } from './config';
import type { 
  RealtimeConfig, 
  ConnectionState, 
  VoiceActivityState, 
  RealtimeMessage,
  HandoffPayload,
  KeywordExtractionResult
} from './types';

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioStream: MediaStream | null = null;
  private config: RealtimeConfig;
  private connectionState: ConnectionState;
  private voiceState: VoiceActivityState;
  private messageHistory: RealtimeMessage[] = [];

  // Event handlers
  public onConnectionStateChange: (state: ConnectionState) => void = () => {};
  public onVoiceStateChange: (state: VoiceActivityState) => void = () => {};
  public onMessage: (message: RealtimeMessage) => void = () => {};
  public onKeywordExtraction: (keywords: KeywordExtractionResult) => void = () => {};
  public onError: (error: Error) => void = () => {};

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      sessionInstructions: SYSTEM_INSTRUCTIONS,
      voice: DEFAULT_CONFIG.voice,
      temperature: DEFAULT_CONFIG.temperature,
      maxTokens: DEFAULT_CONFIG.maxTokens,
    };

    this.connectionState = {
      status: 'disconnected',
      isRecording: false,
      isPushToTalk: false,
    };

    this.voiceState = {
      isVadEnabled: false,
      isSpeaking: false,
      volume: 0,
    };
  }

  async connect(mode: 'hands-free' | 'push-to-talk' = 'hands-free'): Promise<void> {
    try {
      this.connectionState = {
        ...this.connectionState,
        status: 'connecting',
        isPushToTalk: mode === 'push-to-talk'
      };
      this.onConnectionStateChange(this.connectionState);

      // Request microphone permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      if (mode === 'hands-free') {
        await this.connectWebRTC();
      } else {
        await this.connectWebSocket();
      }

      this.connectionState.status = 'connected';
      this.voiceState.isVadEnabled = mode === 'hands-free';
      
      this.onConnectionStateChange(this.connectionState);
      this.onVoiceStateChange(this.voiceState);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private async connectWebRTC(): Promise<void> {
    // Create ephemeral token (this would call your API)
    const tokenResponse = await fetch('/api/realtime/ephemeral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get ephemeral token');
    }

    const { client_secret } = await tokenResponse.json();

    // Set up WebRTC peer connection
    this.pc = new RTCPeerConnection();
    
    // Add audio track
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => {
        this.pc?.addTrack(track, this.audioStream!);
      });
    }

    // Create data channel for session updates
    this.dataChannel = this.pc.createDataChannel('oai-events');
    this.setupDataChannelHandlers();

    // Set up WebRTC handlers
    this.pc.ontrack = (event) => {
      const audioElement = new Audio();
      audioElement.srcObject = event.streams[0];
      audioElement.play();
    };

    // Connect to OpenAI Realtime API via WebRTC
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client_secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: this.config.voice,
        instructions: this.config.sessionInstructions,
        tools: [EXTRACT_KEYWORDS_TOOL],
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        modalities: ['text', 'audio'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Realtime API error: ${response.statusText}`);
    }

    const answer = await response.json();
    await this.pc.setRemoteDescription(answer);
  }

  private async connectWebSocket(): Promise<void> {
    // Create ephemeral token
    const tokenResponse = await fetch('/api/realtime/ephemeral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get ephemeral token');
    }

    const { client_secret } = await tokenResponse.json();

    // Connect via WebSocket for Push-to-Talk mode
    this.ws = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
      ['realtime', `openai-insecure-api-key.${client_secret}`]
    );

    this.ws.onopen = () => {
      this.sendSessionUpdate();
    };

    this.ws.onmessage = (event) => {
      this.handleWebSocketMessage(JSON.parse(event.data));
    };

    this.ws.onerror = (error) => {
      this.handleError(new Error('WebSocket error'));
    };

    this.ws.onclose = () => {
      this.connectionState.status = 'disconnected';
      this.onConnectionStateChange(this.connectionState);
    };
  }

  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.sendSessionUpdate();
    };

    this.dataChannel.onmessage = (event) => {
      this.handleRealtimeEvent(JSON.parse(event.data));
    };
  }

  private sendSessionUpdate(): void {
    const sessionUpdate = {
      type: 'session.update',
      session: {
        instructions: this.config.sessionInstructions,
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: this.connectionState.isPushToTalk ? null : {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        tools: [EXTRACT_KEYWORDS_TOOL],
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxTokens,
      },
    };

    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(sessionUpdate));
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(sessionUpdate));
    }
  }

  public startRecording(): void {
    if (!this.connectionState.isPushToTalk || this.connectionState.isRecording) return;
    
    this.connectionState.isRecording = true;
    this.onConnectionStateChange(this.connectionState);

    // For WebSocket mode, start audio buffer
    if (this.ws && this.audioStream) {
      this.startAudioCapture();
    }
  }

  public stopRecording(): void {
    if (!this.connectionState.isRecording) return;
    
    this.connectionState.isRecording = false;
    this.onConnectionStateChange(this.connectionState);

    // Commit audio buffer and create response
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      this.ws.send(JSON.stringify({ type: 'response.create' }));
    }
  }

  private startAudioCapture(): void {
    if (!this.audioStream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(this.audioStream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      if (!this.connectionState.isRecording) return;

      const inputBuffer = event.inputBuffer.getChannelData(0);
      const pcm16Array = new Int16Array(inputBuffer.length);
      
      // Convert float32 to PCM16
      for (let i = 0; i < inputBuffer.length; i++) {
        pcm16Array[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
      }

      // Convert to base64 and send
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16Array.buffer)));
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        }));
      }

      // Update volume for UI
      const volume = Math.sqrt(inputBuffer.reduce((sum, sample) => sum + sample * sample, 0) / inputBuffer.length);
      this.voiceState.volume = volume;
      this.onVoiceStateChange(this.voiceState);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  }

  private handleWebSocketMessage(message: any): void {
    this.handleRealtimeEvent(message);
  }

  private handleRealtimeEvent(event: any): void {
    switch (event.type) {
      case 'response.audio.delta':
        // Handle audio response
        break;
        
      case 'response.text.delta':
        // Handle text response
        this.handleTextResponse(event.delta);
        break;
        
      case 'response.function_call_arguments.delta':
        // Handle function call
        if (event.name === 'extract_keywords') {
          this.handleKeywordExtraction(JSON.parse(event.arguments));
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        this.voiceState.isSpeaking = true;
        this.onVoiceStateChange(this.voiceState);
        break;
        
      case 'input_audio_buffer.speech_stopped':
        this.voiceState.isSpeaking = false;
        this.onVoiceStateChange(this.voiceState);
        break;
        
      case 'rate_limits.updated':
        this.connectionState.tokenUsage = {
          input: event.rate_limits.input_tokens.consumed,
          output: event.rate_limits.output_tokens.consumed,
          remaining: event.rate_limits.input_tokens.remaining,
        };
        this.onConnectionStateChange(this.connectionState);
        break;
    }
  }

  private handleTextResponse(text: string): void {
    const message: RealtimeMessage = {
      type: 'assistant',
      content: text,
      timestamp: Date.now(),
    };
    
    this.messageHistory.push(message);
    this.onMessage(message);
  }

  private handleKeywordExtraction(keywords: KeywordExtractionResult): void {
    this.onKeywordExtraction(keywords);
  }

  private handleError(error: Error): void {
    this.connectionState.status = 'error';
    this.onConnectionStateChange(this.connectionState);
    this.onError(error);
  }

  public disconnect(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    this.connectionState.status = 'disconnected';
    this.onConnectionStateChange(this.connectionState);
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getVoiceState(): VoiceActivityState {
    return this.voiceState;
  }

  public getMessageHistory(): RealtimeMessage[] {
    return this.messageHistory;
  }
}