
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

    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'A valid prompt is required to generate a tattoo design',
          code: 'INVALID_PROMPT'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (prompt.length < 3) {
      return new Response(
        JSON.stringify({
          error: 'Prompt must be at least 3 characters long',
          code: 'PROMPT_TOO_SHORT'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return new Response(
        JSON.stringify({
          error: 'Prompt must be less than 1000 characters',
          code: 'PROMPT_TOO_LONG'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const validModels = ['flux', 'openai', 'gptimage', 'stablediffusion', 'ideogram'];
    if (aiModel && !validModels.includes(aiModel)) {
      return new Response(
        JSON.stringify({
          error: `Invalid AI model. Supported models: ${validModels.join(', ')}`,
          code: 'INVALID_MODEL'
        }),
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
    else if (aiModel === 'stablediffusion') {
      const apiKey = Deno.env.get('STABILITY_API_KEY');

      if (!apiKey) {
        throw new Error('STABILITY_API_KEY is not configured');
      }

      console.log("Calling Stability AI API with prompt:", prompt);
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
          style_preset: "photographic"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Stability AI API error:", errorData);
        throw new Error(errorData.message || `Failed to generate image with Stability AI: ${response.status}`);
      }

      const data = await response.json();
      if (data.artifacts && data.artifacts.length > 0) {
        imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;
      } else {
        throw new Error("No image artifacts returned from Stability AI");
      }
    }
    else if (aiModel === 'ideogram') {
      const apiKey = Deno.env.get('IDEOGRAM_API_KEY');

      if (!apiKey) {
        throw new Error('IDEOGRAM_API_KEY is not configured');
      }

      console.log("Calling Ideogram API with prompt:", prompt);
      const response = await fetch('https://api.ideogram.ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey
        },
        body: JSON.stringify({
          image_request: {
            prompt: prompt,
            aspect_ratio: "ASPECT_1_1",
            model: "V_2",
            magic_prompt_option: "AUTO",
            style_type: "REALISTIC"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Ideogram API error:", errorData);
        throw new Error(errorData.error?.message || `Failed to generate image with Ideogram: ${response.status}`);
      }

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        imageUrl = data.data[0].url;
      } else {
        throw new Error("No image data returned from Ideogram");
      }
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
    console.error('Tattoo generation error:', error);

    // Determine appropriate error message and status code
    let errorMessage = 'An unexpected error occurred while generating your tattoo';
    let statusCode = 500;

    if (error.message) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error. Please try again later.';
        statusCode = 503;
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorMessage = 'AI service is currently busy. Please try again in a few minutes.';
        statusCode = 429;
      } else if (error.message.includes('content policy') || error.message.includes('safety')) {
        errorMessage = 'Your prompt may contain content that violates our safety guidelines. Please try a different description.';
        statusCode = 400;
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: 'GENERATION_ERROR',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode
      }
    );
  }
});
