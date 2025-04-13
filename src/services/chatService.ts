
import { supabase } from '@/integrations/supabase/client';

export type Message = {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
};

export type ToolCall = {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
};

export const sendMessage = async (messages: Message[]): Promise<Message> => {
  try {
    // Convert our messages format to OpenAI format
    const formattedMessages = messages
      .filter(msg => msg.type === 'user' || msg.type === 'bot')
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

    // Call our Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('tattoo-chat', {
      body: { messages: formattedMessages },
    });

    if (error) {
      console.error('Error calling chat function:', error);
      return {
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
    }

    // Process the response
    const responseMessage = data.choices[0].message;
    
    // Return the formatted message
    return {
      type: 'bot',
      content: responseMessage.content || '',
      timestamp: new Date(),
      toolCalls: responseMessage.tool_calls,
    };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return {
      type: 'bot',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date(),
    };
  }
};

// Execute function calls
export const executeToolCall = (toolCall: ToolCall): string => {
  try {
    const args = JSON.parse(toolCall.function.arguments);
    
    switch (toolCall.function.name) {
      case 'ask_guiding_questions':
        return handleGuidingQuestions(args.topic);
      case 'educate_user':
        return handleEducation(args.subject);
      case 'suggest_resources':
        return handleResourceSuggestion(args.interest);
      default:
        return `Function ${toolCall.function.name} not implemented yet.`;
    }
  } catch (error) {
    console.error('Error executing tool call:', error);
    return 'Error executing function.';
  }
};

// Implement tool handlers
function handleGuidingQuestions(topic: string): string {
  const questions: Record<string, string[]> = {
    placement: [
      "Where are you thinking of placing your tattoo?",
      "Is visibility to others important to you?",
      "Do you want it to be easily hidden for professional settings?",
      "Have you considered how the placement might affect pain levels during tattooing?"
    ],
    style: [
      "What tattoo styles appeal to you the most?",
      "Have you seen examples of the style you want on skin with your tone?",
      "Are you interested in color or black and gray?",
      "What artists do you admire who work in this style?"
    ],
    size: [
      "How large are you considering for this tattoo?",
      "Are you aware that smaller tattoos with fine details tend to blur over time?",
      "Have you thought about how the size relates to the placement area?",
      "Are you open to the artist's recommendation on appropriate sizing?"
    ],
    meaning: [
      "What significance does this imagery have for you?",
      "Is this a design that will remain meaningful to you long-term?",
      "Have you researched the cultural significance of the symbols you're interested in?",
      "Would you prefer something with personal meaning or purely aesthetic value?"
    ]
  };

  return `Here are some questions to help you think about ${topic}:\n\n` + 
    questions[topic]?.join('\n\n') || 
    `I don't have specific questions about ${topic}, but it's important to discuss this with your tattoo artist.`;
}

function handleEducation(subject: string): string {
  const educationContent: Record<string, string> = {
    'color vs black & gray': `
**Color vs. Black & Gray Tattoos**

**Black & Gray:**
- Generally ages better with less fading
- Works well on all skin tones
- Requires less maintenance/touch-ups
- Can achieve subtle, realistic shading

**Color:**
- Offers vibrant, eye-catching designs
- May fade faster, especially reds, yellows, and light colors
- Requires more maintenance and sun protection
- May show differently on darker skin tones
- Modern inks have improved longevity

Consider your skin tone, maintenance commitment, and design complexity when choosing between color and black & gray.`,

    'style definitions': `
**Popular Tattoo Styles:**

**Traditional/American Traditional:** Bold black outlines, limited solid colors, classic motifs (roses, eagles, anchors)

**Neo-Traditional:** Evolution of traditional with expanded color palette and more illustrative qualities

**Realism/Photorealism:** Mimics photographs with detailed shading and little to no outlines

**Blackwork:** Uses solid black ink in various patterns, from geometric to illustrative

**Japanese (Irezumi):** Bold outlines, water-inspired backgrounds, mythological subjects

**Minimalist:** Simple, often single-line designs with minimal detail

**Watercolor:** Mimics paint-like quality with color transitions and minimal outlines

**Geometric:** Focus on shapes, patterns, and symmetry

**Dotwork/Stippling:** Images created entirely from dots, varying density creates shading

Each style requires different artist specialization and healing considerations.`,

    'skin compatibility': `
**Tattoo Ink and Skin Tone Compatibility:**

**Lighter Skin Tones:**
- Most colors show well
- Subtle shading and fine details are more visible
- White highlights work effectively

**Medium Skin Tones:**
- Most colors still show well
- Some yellows may need to be more saturated
- White highlights may fade to skin tone over time

**Darker Skin Tones:**
- Deep blues, reds, and blacks show best
- High contrast designs work better than subtle shading
- White ink typically isn't recommended
- Consider artists who specialize in darker skin tones

The right artist will adapt designs and choose appropriate colors for your specific skin tone. Always ask to see examples of their work on similar skin tones.`,

    'aging': `
**How Tattoos Age Over Time:**

**What Happens:**
- Fine lines may expand and blur ("spread")
- Detailed areas can become less defined
- Colors fade, especially with sun exposure
- Skin changes (stretching, sagging) affect tattoo appearance

**Factors That Affect Aging:**
- Tattoo placement (high friction areas age faster)
- Sun exposure (major factor in fading)
- Ink quality and application depth
- Skincare routine and overall health
- Original design composition (spacing between elements)

**Design Choices for Better Aging:**
- Opt for designs with adequate negative space
- Choose bold lines over extremely fine detail
- Consider black outlines for color pieces to maintain structure
- Larger designs typically age better than tiny, detailed ones

Proper aftercare and sun protection significantly improve long-term appearance.`
  };

  return educationContent[subject] || 
    `I don't have specific information about ${subject}, but I can help you research this topic further.`;
}

function handleResourceSuggestion(interest: string): string {
  const resources: Record<string, string[]> = {
    'realism': [
      "Instagram: Follow @nikko_hurtado, @steve_butcher, and @ralf_nonnweiler for top realism work",
      "Book: 'Realism in Tattoo Art' by Jinxi Caddel",
      "YouTube: 'Tattoo Critique: Realism' by TattooBetter offers technical breakdowns"
    ],
    'traditional': [
      "Instagram: @sailorjerry_tattoo, @edhardy, and @smithstreetstudio for classic traditional",
      "Book: 'Traditional American Tattoo Design' by Jerry Collins",
      "Museum: Follow the 'Tattoo History Museum' online for traditional flash collections"
    ],
    'healing advice': [
      "Website: TattooAftercare.org for evidence-based healing guides",
      "Product Research: Dermatologist-reviewed aftercare products at inkdays.com",
      "App: 'InkTracker' for daily aftercare reminders and healing progress photos",
      "YouTube: 'Proper Tattoo Aftercare' series by Howbouttat"
    ],
    'finding artists': [
      "Platform: Tattoodo.com lets you search artists by style and location",
      "Convention: International tattoo conventions let you meet multiple artists in person",
      "Method: Always check an artist's portfolio for consistency and healed results, not just fresh work",
      "Tip: Book consultations with 2-3 artists to find the best fit for your specific design and needs"
    ]
  };

  return `Here are some resources about ${interest} tattoos:\n\n` + 
    resources[interest]?.join('\n\n') || 
    `I don't have specific resources about ${interest}, but I recommend checking Instagram hashtags, specialized tattoo magazines, and local tattoo conventions to learn more.`;
}
