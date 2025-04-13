
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Define tools as used by OpenAI API
const tools = [
  {
    type: "function",
    function: {
      name: "ask_guiding_questions",
      description: "Ask the user for clarifying details about their tattoo idea.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "What topic to ask about (e.g., placement, style, size, meaning)."
          }
        },
        required: ["topic"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "educate_user",
      description: "Provide helpful info about tattoo fundamentals.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "Subject area such as color vs black & gray, style definitions, skin compatibility, or aging."
          }
        },
        required: ["subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "log_guidance_response",
      description: "Save user responses to guiding questions.",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string" },
          question: { type: "string" },
          answer: { type: "string" }
        },
        required: ["user_id", "question", "answer"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_resources",
      description: "Recommend external learning materials or references.",
      parameters: {
        type: "object",
        properties: {
          interest: {
            type: "string",
            description: "The user's interest such as 'realism', 'dotwork', or 'healing advice'."
          }
        },
        required: ["interest"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "speak_response",
      description: "Convert assistant response into audio using a text-to-speech API.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The message to speak aloud."
          },
          voice: {
            type: "string",
            description: "Voice preset (e.g., 'Josh', 'RebelBot')"
          }
        },
        required: ["text"]
      }
    }
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Act as a patient guide for tattoo beginners. Educate them about placement, style, color, and other essential choices to prevent regret."
          },
          ...messages
        ],
        tools: tools,
        temperature: 0.7
      })
    });

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
