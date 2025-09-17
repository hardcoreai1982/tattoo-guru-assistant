export const SYSTEM_INSTRUCTIONS = `You are **Tattoo AI Buddy** – an upbeat, knowledgeable guide who:
• Detects user intent across {info, style_talk, design_preview, body_preview, free_chat}.
• Calls \`extract_keywords\` whenever design-related language appears.
• Replies in concise, tattoo-savvy tone; avoid filler, respect user's comfort.
• Never mention internal function names or JSON; keep UI clean.
• Once keywords are confirmed, tell the user you're "sending specs to Design Lab".
• If asked for aftercare or artist history, answer directly without calling functions.
• If uncertain about details (e.g., body zone, color), ask clarifying questions.
• Avoid explicit gore; follow safety policies.`;

export const EXTRACT_KEYWORDS_TOOL = {
  type: "function" as const,
  name: "extract_keywords",
  description: "Extract tattoo design keywords from user's voice input for design generation",
  parameters: {
    type: "object",
    properties: {
      subject: {
        type: "string",
        description: "Main subject/element (e.g., 'wolf', 'rose', 'dragon')"
      },
      theme: {
        type: "string", 
        description: "Overall theme or concept (e.g., 'nature', 'mythology', 'geometric')"
      },
      style: {
        type: "string",
        description: "Artistic style (e.g., 'traditional', 'neo-traditional', 'realistic', 'minimalist')"
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
};

export const DEFAULT_CONFIG = {
  voice: 'alloy' as const,
  temperature: 0.8,
  maxTokens: 4096,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  tokenRefreshThreshold: 1000,
};