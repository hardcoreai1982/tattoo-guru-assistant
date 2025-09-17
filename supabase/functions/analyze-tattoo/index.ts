
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
    const { image, mode = 'design', subject = '', enhancePrompt = false, details = {} } = await req.json();

    // Input validation
    if (!enhancePrompt && (!image || typeof image !== 'string')) {
      return new Response(
        JSON.stringify({
          error: 'A valid image is required for tattoo analysis',
          code: 'INVALID_IMAGE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (image && !image.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({
          error: 'Image must be in base64 data URL format',
          code: 'INVALID_IMAGE_FORMAT'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const validModes = ['design', 'preview'];
    if (mode && !validModes.includes(mode)) {
      return new Response(
        JSON.stringify({
          error: `Invalid analysis mode. Supported modes: ${validModes.join(', ')}`,
          code: 'INVALID_MODE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'AI service configuration error. Please try again later.',
          code: 'SERVICE_UNAVAILABLE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    // Handle prompt enhancement request
    if (enhancePrompt) {
      const enhancementResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a professional tattoo artist with extensive knowledge of tattoo design, techniques, styles, and cultural significance. Your task is to create highly detailed, specific prompts for AI image generators to create tattoo designs.'
            },
            {
              role: 'user',
              content: `Create a detailed tattoo design prompt for an AI image generator with these specifications:
              
              - Subject: ${details.subject || 'tattoo'}
              - Style: ${details.style || 'traditional'}
              - Technique: ${details.technique || 'line work'}
              - Composition: ${details.composition || 'balanced'}
              - Color Palette: ${details.colorPalette || 'black and grey'}
              - Placement: ${details.placement || 'arm'}
              - Mode: ${details.isPreviewMode ? 'Preview on body' : 'Design for printing'}
              
              The prompt should be highly detailed, mentioning specific artistic elements, textures, shading techniques, line work details, and visual characteristics specific to tattoo art. Include details about depth, contrast, and how the design interacts with the body if in preview mode. DO NOT introduce new subjects or themes not mentioned above. Keep the prompt to 2-3 sentences maximum, and focus on visual descriptors rather than meanings or symbolism.`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!enhancementResponse.ok) {
        const errorData = await enhancementResponse.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to enhance prompt');
      }

      const enhancementData = await enhancementResponse.json();
      const enhancedPrompt = enhancementData.choices[0].message.content;

      return new Response(
        JSON.stringify({ enhancedPrompt }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Original image analysis functionality
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create system prompt based on mode
    let systemPrompt = "You are a professional tattoo artist and historian with deep knowledge of tattoo styles, techniques, and cultural significance.";
    
    if (mode === 'preview') {
      systemPrompt += " Analyze this image and describe how this tattoo would appear when placed on the body. Focus on how it would interact with the anatomy, how it would heal over time, and how it would look in context.";
    } else {
      systemPrompt += " Analyze this image and provide insights about the design aspects, how it could be adjusted for printing, and technical considerations for the tattoo artist.";
    }

    if (subject) {
      systemPrompt += ` Pay special attention to the subject "${subject}" and how it's represented in the design.`;
    }

    // Call OpenAI API to analyze the image
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this tattoo image${subject ? ` of ${subject}` : ''} and provide a detailed breakdown including:
                
                ${mode === 'design' ? `
                - Overview: Brief summary of the tattoo design
                - Visual Elements: Description of the key visual components
                - Style: Identification of the tattoo style(s) and artistic influences
                - Technique: Analysis of line work, shading, and color application
                - History/Symbolism: Historical context and symbolic meaning
                - Recommendations: Suggestions for design adjustments and printing considerations
                ` : `
                - Overview: Brief summary of how this tattoo would look on the body
                - Visual Elements: How the elements would appear on skin
                - Style: How this style works with body placement
                - Technique: How the technical aspects would translate to skin
                - History/Symbolism: Cultural context of this tattoo on the body
                - Recommendations: Aftercare tips and how to ensure longevity
                `}
                
                Organize your response with these sections. Be educational but conversational.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      })
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to analyze image');
    }

    const analysisData = await analysisResponse.json();
    const analysis = {
      overview: '',
      visualElements: '',
      style: '',
      technique: '',
      history: '',
      recommendations: '',
    };

    // Process the response to extract sections
    const content = analysisData.choices[0].message.content;
    const sections = content.split(/#{1,2}\s+|(?<=\n)(?=[A-Z])/);

    for (const section of sections) {
      if (section.includes('Overview') || section.toLowerCase().includes('overview')) {
        analysis.overview = section.replace(/Overview:?\s*/i, '').trim();
      } else if (section.includes('Visual Elements') || section.toLowerCase().includes('visual elements')) {
        analysis.visualElements = section.replace(/Visual Elements:?\s*/i, '').trim();
      } else if (section.includes('Style') || section.toLowerCase().includes('style')) {
        analysis.style = section.replace(/Style:?\s*/i, '').trim();
      } else if (section.includes('Technique') || section.toLowerCase().includes('technique')) {
        analysis.technique = section.replace(/Technique:?\s*/i, '').trim();
      } else if (section.includes('History') || section.toLowerCase().includes('history') || section.includes('Symbolism') || section.toLowerCase().includes('symbolism')) {
        analysis.history = section.replace(/History\/Symbolism:?\s*|History:?\s*|Symbolism:?\s*/i, '').trim();
      } else if (section.includes('Recommendations') || section.toLowerCase().includes('recommendations')) {
        analysis.recommendations = section.replace(/Recommendations:?\s*/i, '').trim();
      }
    }

    // If we couldn't parse the sections, use the full content for overview
    if (!analysis.overview && content) {
      analysis.overview = content;
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Tattoo analysis error:', error);

    // Determine appropriate error message and status code
    let errorMessage = 'An unexpected error occurred while analyzing your tattoo';
    let statusCode = 500;

    if (error.message) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error. Please try again later.';
        statusCode = 503;
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorMessage = 'AI service is currently busy. Please try again in a few minutes.';
        statusCode = 429;
      } else if (error.message.includes('image') && error.message.includes('invalid')) {
        errorMessage = 'The uploaded image format is not supported. Please try a different image.';
        statusCode = 400;
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        statusCode = 503;
      } else if (error.message.includes('content policy') || error.message.includes('safety')) {
        errorMessage = 'The image content may violate our safety guidelines. Please try a different image.';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: 'ANALYSIS_ERROR',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode
      }
    );
  }
});
