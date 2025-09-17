import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key from environment
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Validate user authentication (optional - can be added later)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('No authorization header provided for ephemeral token request');
      // For now, we'll allow unauthenticated requests for development
      // In production, you should validate the user session
    }

    // Generate ephemeral token from OpenAI
    console.log('Generating ephemeral token for realtime session');
    
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        instructions: `You are **Tattoo AI Buddy** – an upbeat, knowledgeable guide who:
• Detects user intent across {info, style_talk, design_preview, body_preview, free_chat}.
• Calls \`extract_keywords\` whenever design-related language appears.
• Replies in concise, tattoo-savvy tone; avoid filler, respect user's comfort.
• Never mention internal function names or JSON; keep UI clean.
• Once keywords are confirmed, tell the user you're "sending specs to Design Lab".
• If asked for aftercare or artist history, answer directly without calling functions.
• If uncertain about details (e.g., body zone, color), ask clarifying questions.
• Avoid explicit gore; follow safety policies.`,
        tools: [
          {
            type: "function",
            name: "extract_keywords",
            description: "Extract tattoo design keywords from user's voice input",
            parameters: {
              type: "object",
              properties: {
                subject: {
                  type: "string",
                  description: "Main subject/element (e.g., 'dragon', 'rose', 'geometric pattern')"
                },
                theme: {
                  type: "string",
                  description: "Overall theme or concept (e.g., 'nature', 'mythology', 'minimalist')"
                },
                style: {
                  type: "string",
                  description: "Artistic style (e.g., 'traditional', 'realism', 'neo-traditional', 'blackwork')"
                },
                color_palette: {
                  type: "string",
                  description: "Color preferences (e.g., 'black and grey', 'vibrant colors', 'earth tones')"
                },
                technique: {
                  type: "string",
                  description: "Tattoo technique (e.g., 'fine line', 'bold linework', 'dotwork', 'watercolor')"
                },
                artist_refs: {
                  type: "array",
                  items: { type: "string" },
                  description: "Referenced artists or art styles"
                },
                body_zone: {
                  type: "string",
                  description: "Intended body placement (e.g., 'forearm', 'shoulder', 'back piece')"
                }
              },
              required: ["subject"]
            }
          }
        ],
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        modalities: ['text', 'audio'],
        temperature: 0.8,
        max_response_output_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || `Failed to generate ephemeral token: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Successfully generated ephemeral token');
    
    return new Response(
      JSON.stringify({
        client_secret: data.client_secret,
        expires_at: data.expires_at,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Ephemeral token generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate ephemeral token',
        details: 'Check server logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
