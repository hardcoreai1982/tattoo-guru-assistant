
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
            content: `You are a professional tattoo analyst agent specializing in identifying tattoo styles, techniques, and cultural contexts. 
            Analyze the given tattoo image in detail, covering:
            1. Tattoo style classification (Japanese, American Traditional, Neo-Traditional, Blackwork, etc.)
            2. Visual elements (linework, shading, color usage, composition)
            3. Technical aspects (techniques used, quality assessment)
            4. Cultural and symbolic meaning
            5. Historical context if relevant
            6. Artist skill assessment
            7. Recommendations for care or potential enhancements
            
            Format your response as a structured JSON object with these keys:
            - overview: General information about the tattoo type, subject, placement
            - visualElements: Details about composition, line work, detail density, shading, color palette, contrast
            - technique: Information about the tattooing techniques used
            - style: Style classification with confidence level
            - symbolism: Any symbolism or cultural context
            - recommendations: Care tips and style enhancement suggestions
            
            Be thorough but concise. Use terminology that tattoo enthusiasts would appreciate.`
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
