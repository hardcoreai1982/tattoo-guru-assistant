
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log("Analyzing tattoo image...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional tattoo analyst agent with extensive knowledge of tattoo art, styles, techniques, and cultural significance.
            
            Your task is to deeply analyze tattoo images and provide detailed, insightful, and engaging explanations about:
            
            1. Identify the specific tattoo style (Japanese/Irezumi, American Traditional, Neo-Traditional, Blackwork, Geometric, Watercolor, etc.)
            2. Explain the technical aspects (line quality, shading techniques, color saturation, composition)
            3. Describe any cultural or symbolic meaning present in the tattoo
            4. Note the artistic elements that make this tattoo unique or interesting
            5. Suggest potential meanings or stories behind the imagery
            6. Comment on placement and how it complements the design
            7. Provide interesting historical context about the tattoo style
            
            Format your response as a structured JSON object with these keys:
            - overview: General information about the tattoo type, subject matter, and placement
            - visualElements: Details about composition, line work, detail density, shading, color palette, contrast
            - technique: Information about the tattooing techniques used
            - style: Style classification with confidence level
            - symbolism: Any symbolism or cultural context identified
            - history: Brief historical context about this tattoo style
            - recommendations: Care tips and style enhancement suggestions
            
            Your tone should be enthusiastic, knowledgeable, and conversational - like a passionate tattoo artist explaining a piece to an interested client.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this tattoo in detail:' },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    let analysisResult;
    
    try {
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        analysisResult = JSON.parse(data.choices[0].message.content);
        console.log("Analysis completed successfully");
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results', details: parseError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ analysis: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-tattoo function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
