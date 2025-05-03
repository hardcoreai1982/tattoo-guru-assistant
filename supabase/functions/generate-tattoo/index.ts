
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { prompt, aiModel } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'No prompt provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let imageUrl = '';
    
    if (aiModel === 'flux') {
      const apiKey = Deno.env.get('FLUX_API_KEY');
      
      if (!apiKey) {
        throw new Error('FLUX_API_KEY is not configured');
      }

      console.log("Calling Flux API with prompt:", prompt);
      const response = await fetch('https://api.tryflux.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Flux API error:", errorData);
        throw new Error(errorData.error?.message || `Failed to generate image with Flux: ${response.status}`);
      }
      
      const data = await response.json();
      imageUrl = data.data[0].url;
    } 
    else if (aiModel === 'openai') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }

      console.log("Calling OpenAI API with prompt:", prompt);
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          model: "dall-e-3",
          quality: "standard",
          response_format: 'url'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(errorData.error?.message || `Failed to generate image with OpenAI: ${response.status}`);
      }
      
      const data = await response.json();
      imageUrl = data.data[0].url;
    }
    else if (aiModel === 'gptimage') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }

      console.log("Calling GPT-image-1 API with prompt:", prompt);
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          model: "gpt-image-1",
          response_format: "b64_json" // Get base64 for gpt-image-1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("GPT-image-1 API error:", errorData);
        throw new Error(errorData.error?.message || `Failed to generate image with GPT-image-1: ${response.status}`);
      }
      
      const data = await response.json();
      // For GPT-image-1, we get b64_json, so we need to convert it to URL
      if (data.data[0].b64_json) {
        imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
      } else {
        throw new Error("No b64_json returned from GPT-image-1");
      }
    }
    else if (aiModel === 'stablediffusion' || aiModel === 'ideogram') {
      // For future implementation
      return new Response(
        JSON.stringify({ error: `${aiModel} integration is not yet implemented` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 501 }
      );
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid AI model selected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Successfully generated image URL:", imageUrl.substring(0, 100) + "...");
    return new Response(
      JSON.stringify({ url: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
