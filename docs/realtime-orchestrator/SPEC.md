# Tattoo AI Buddy - Realtime Orchestrator Technical Specification

## Overview

The Realtime Orchestrator is a modular system that provides real-time voice interaction capabilities for the Tattoo AI Buddy application. It integrates with OpenAI's Realtime API to enable natural voice conversations that automatically extract tattoo design intent and route to appropriate generation services.

## Architecture

### Core Components

1. **RealtimeClient** - Main orchestration class handling WebRTC/WebSocket connections
2. **UI Components** - React components for voice interaction controls
3. **Type System** - Comprehensive TypeScript definitions
4. **Configuration** - System instructions and tool definitions
5. **Hooks** - React hooks for state management and integration

### Data Flow

```
User Voice Input → OpenAI Realtime API → Keyword Extraction → TGA Handoff → Tattoo Generation
```

## Technical Requirements

### Dependencies

- OpenAI Realtime API access
- WebRTC support (modern browsers)
- MediaDevices API (microphone access)
- TypeScript 4.5+
- React 18+

### Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## API Integration

### OpenAI Realtime API

**Model**: `gpt-4o-realtime-preview`
**Modalities**: `["audio", "text"]`
**Voice**: `alloy` (configurable)

#### Connection Methods

1. **WebRTC** (Hands-free mode)
   - Direct peer connection to OpenAI
   - Server VAD (Voice Activity Detection)
   - Real-time audio streaming
   - Optimal for continuous conversation

2. **WebSocket** (Push-to-talk mode)
   - WebSocket connection with audio buffer management
   - Manual audio input control
   - Better for controlled interactions

#### Session Configuration

```json
{
  "model": "gpt-4o-realtime-preview",
  "voice": "alloy",
  "instructions": "SYSTEM_INSTRUCTIONS",
  "tools": ["extract_keywords"],
  "turn_detection": {
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 500
  },
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16",
  "modalities": ["text", "audio"],
  "temperature": 0.8,
  "max_response_output_tokens": 4096
}
```

### Keyword Extraction Tool

The system uses a function calling tool to extract tattoo design elements:

```json
{
  "type": "function",
  "name": "extract_keywords",
  "description": "Extract tattoo design keywords from user's voice input",
  "parameters": {
    "type": "object",
    "properties": {
      "subject": { "type": "string", "description": "Main subject/element" },
      "theme": { "type": "string", "description": "Overall theme or concept" },
      "style": { "type": "string", "description": "Artistic style" },
      "color_palette": { "type": "string", "description": "Color preferences" },
      "technique": { "type": "string", "description": "Tattoo technique" },
      "artist_refs": { "type": "array", "items": { "type": "string" } },
      "body_zone": { "type": "string", "description": "Intended body placement" }
    },
    "required": ["subject"]
  }
}
```

## State Management

### Connection States

- `disconnected` - Not connected to any service
- `connecting` - Establishing connection
- `connected` - Active connection established
- `error` - Connection failed or error occurred

### Voice States

- `isVadEnabled` - Voice Activity Detection active
- `isSpeaking` - User is currently speaking
- `volume` - Current microphone volume level (0-1)

### Recording States

- `isRecording` - Currently recording audio (PTT mode)
- `isPushToTalk` - In push-to-talk mode vs hands-free

## Error Handling

### Connection Errors

- Network connectivity issues
- API authentication failures
- WebRTC negotiation failures
- Microphone permission denied

### Rate Limiting

- Monitor token usage via `rate_limits.updated` events
- Implement graceful degradation when approaching limits
- Auto-refresh sessions before 30-minute timeout

### Recovery Strategies

- Automatic reconnection attempts
- Fallback from WebRTC to WebSocket
- Graceful fallback to text-only mode

## Security Considerations

### Token Management

- Use ephemeral tokens generated server-side
- Never expose OpenAI API keys to client
- Implement proper token rotation
- Validate token expiration

### Audio Privacy

- Request explicit microphone permissions
- Clear audio buffers on disconnect
- No persistent audio storage
- User controls for muting/disconnecting

## Performance Optimization

### Audio Processing

- Use 16kHz PCM16 format for optimal quality/bandwidth
- Implement audio compression for WebSocket mode
- Buffer management for smooth streaming
- Echo cancellation and noise suppression

### Network Optimization

- Connection pooling for API requests
- Efficient binary audio transmission
- Minimize latency with direct WebRTC when possible
- Implement connection health monitoring

## Integration Points

### TGA Handoff

When keywords are extracted, the system creates a handoff payload:

```typescript
interface HandoffPayload {
  operation: 'design' | 'body_preview';
  keywords: KeywordExtractionResult;
  model_choice: 'flux' | 'dalle' | 'gpt-image-1';
}
```

This payload is sent to the Tattoo Generation Agent (TGA) for processing.

### UI Integration

The orchestrator provides React components that integrate with existing UI systems:

- `ModeModelDropdown` - Voice mode and model selection
- `PushToTalkButton` - Recording control with visual feedback
- `VoiceStatusPill` - Connection and token status display
- `RealtimeChatInterface` - Complete chat interface with voice

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=sk-...           # OpenAI API key (server-side only)
TGA_URL=https://api.../generate # Tattoo Generation Agent URL
```

### System Instructions

The AI assistant is configured with specific instructions for tattoo-focused conversations:

- Detect design intent in natural conversation
- Extract relevant keywords automatically
- Maintain tattoo-savvy, helpful tone
- Handle tattoo-specific terminology and concepts
- Provide contextual follow-up questions

## Monitoring and Logging

### Metrics to Track

- Connection success/failure rates
- Average response latency
- Token usage patterns
- Audio quality metrics
- User session duration

### Logging Requirements

- Connection events and errors
- Function call executions
- Token usage and rate limits
- Performance metrics
- User interaction patterns

## Testing Strategy

### Unit Tests

- RealtimeClient connection handling
- Keyword extraction validation
- State management logic
- Error handling scenarios

### Integration Tests

- End-to-end voice-to-design flow
- API integration with OpenAI
- TGA handoff validation
- UI component interactions

### Performance Tests

- Audio streaming latency
- Connection stability under load
- Memory usage during long sessions
- Token consumption rates

## Deployment Considerations

### Infrastructure Requirements

- SSL/TLS certificates for WebRTC
- Low-latency server deployment
- Adequate bandwidth for audio streaming
- Monitoring and alerting systems

### Scaling Considerations

- Connection pooling and load balancing
- Rate limiting and abuse prevention
- Regional deployment for latency optimization
- Capacity planning for concurrent users