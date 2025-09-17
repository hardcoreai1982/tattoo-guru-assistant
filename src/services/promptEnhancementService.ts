import { supabase } from '@/integrations/supabase/client';

export interface TattooStyleGuide {
  style: string;
  characteristics: string[];
  commonElements: string[];
  colorPalettes: string[];
  techniques: string[];
  promptKeywords: string[];
  avoidKeywords: string[];
}

export interface PromptEnhancement {
  originalPrompt: string;
  enhancedPrompt: string;
  addedElements: string[];
  technicalTerms: string[];
  styleSpecificTerms: string[];
  qualityModifiers: string[];
  confidence: number;
}

export class PromptEnhancementService {
  private static tattooStyleGuides: TattooStyleGuide[] = [
    {
      style: 'traditional',
      characteristics: ['Bold lines', 'Solid colors', 'Classic imagery', 'High contrast'],
      commonElements: ['Roses', 'Anchors', 'Eagles', 'Hearts', 'Banners', 'Skulls'],
      colorPalettes: ['Red', 'Blue', 'Yellow', 'Green', 'Black'],
      techniques: ['Bold outlining', 'Solid color fill', 'Minimal shading'],
      promptKeywords: ['bold lines', 'solid colors', 'classic', 'traditional', 'vintage', 'americana'],
      avoidKeywords: ['realistic', 'photorealistic', 'detailed shading', 'gradient']
    },
    {
      style: 'realistic',
      characteristics: ['Photorealistic', 'Detailed shading', 'Accurate proportions', 'Depth'],
      commonElements: ['Portraits', 'Animals', 'Landscapes', 'Objects'],
      colorPalettes: ['Full spectrum', 'Natural colors', 'Skin tones'],
      techniques: ['Fine line work', 'Detailed shading', 'Color blending', 'Highlights'],
      promptKeywords: ['photorealistic', 'detailed', 'lifelike', 'accurate', 'dimensional', 'realistic'],
      avoidKeywords: ['cartoon', 'simplified', 'bold lines', 'flat colors']
    },
    {
      style: 'watercolor',
      characteristics: ['Flowing colors', 'Soft edges', 'Paint-like texture', 'Artistic'],
      commonElements: ['Abstract shapes', 'Splashes', 'Drips', 'Organic forms'],
      colorPalettes: ['Vibrant colors', 'Pastels', 'Color bleeds'],
      techniques: ['Color bleeding', 'Soft transitions', 'Paint texture'],
      promptKeywords: ['watercolor', 'flowing', 'soft', 'artistic', 'paint-like', 'organic'],
      avoidKeywords: ['sharp lines', 'geometric', 'precise', 'mechanical']
    },
    {
      style: 'geometric',
      characteristics: ['Clean lines', 'Precise shapes', 'Mathematical patterns', 'Symmetry'],
      commonElements: ['Triangles', 'Circles', 'Polygons', 'Sacred geometry', 'Mandalas'],
      colorPalettes: ['Monochrome', 'Limited palette', 'High contrast'],
      techniques: ['Precise line work', 'Pattern repetition', 'Symmetrical design'],
      promptKeywords: ['geometric', 'precise', 'symmetrical', 'mathematical', 'clean lines', 'pattern'],
      avoidKeywords: ['organic', 'flowing', 'irregular', 'random']
    },
    {
      style: 'minimalist',
      characteristics: ['Simple lines', 'Negative space', 'Clean design', 'Subtle'],
      commonElements: ['Simple symbols', 'Line art', 'Small designs', 'Abstract forms'],
      colorPalettes: ['Black ink', 'Single color', 'Minimal color'],
      techniques: ['Fine line work', 'Negative space usage', 'Simple forms'],
      promptKeywords: ['minimalist', 'simple', 'clean', 'subtle', 'fine lines', 'negative space'],
      avoidKeywords: ['complex', 'detailed', 'busy', 'ornate']
    },
    {
      style: 'neo-traditional',
      characteristics: ['Bold lines', 'Vibrant colors', 'Modern twist', 'Detailed'],
      commonElements: ['Animals', 'Flowers', 'Portraits', 'Nature'],
      colorPalettes: ['Vibrant colors', 'Rich saturation', 'Color gradients'],
      techniques: ['Bold outlining', 'Color gradients', 'Detailed shading'],
      promptKeywords: ['neo-traditional', 'vibrant', 'modern', 'bold', 'detailed', 'contemporary'],
      avoidKeywords: ['vintage', 'classic only', 'simple', 'minimal']
    }
  ];

  private static technicalTerms = {
    lineWork: ['bold outlines', 'fine line work', 'clean lines', 'precise lineart', 'smooth curves'],
    shading: ['soft shading', 'gradient shading', 'realistic shadows', 'dimensional depth', 'light and shadow'],
    texture: ['skin texture', 'organic texture', 'smooth finish', 'detailed texture', 'surface detail'],
    composition: ['balanced composition', 'dynamic layout', 'focal point', 'visual flow', 'proportional'],
    quality: ['professional quality', 'tattoo-ready', 'high resolution', 'crisp details', 'clean execution']
  };

  private static bodyZoneConsiderations = {
    arm: ['flows with arm contour', 'wraps naturally', 'considers muscle definition'],
    leg: ['follows leg shape', 'considers calf/thigh placement', 'vertical flow'],
    back: ['large canvas design', 'spine alignment', 'shoulder blade consideration'],
    chest: ['heart-centered', 'ribcage flow', 'breathing movement'],
    shoulder: ['rounded placement', 'joint movement', 'deltoid curve'],
    wrist: ['small scale', 'delicate design', 'wrist bone consideration'],
    ankle: ['compact design', 'bone prominence', 'shoe interaction']
  };

  /**
   * Enhance a prompt with tattoo-specific knowledge and technical terms
   */
  static enhancePrompt(
    originalPrompt: string,
    style?: string,
    technique?: string,
    colorPalette?: string,
    bodyZone?: string,
    subject?: string,
    isPreviewMode?: boolean
  ): PromptEnhancement {
    let enhancedPrompt = originalPrompt.trim();
    const addedElements: string[] = [];
    const technicalTerms: string[] = [];
    const styleSpecificTerms: string[] = [];
    const qualityModifiers: string[] = [];

    // Find matching style guide
    const styleGuide = style ? this.tattooStyleGuides.find(sg => 
      sg.style.toLowerCase() === style.toLowerCase()
    ) : null;

    // Add style-specific enhancements
    if (styleGuide) {
      // Add style characteristics
      const styleKeywords = styleGuide.promptKeywords.slice(0, 2);
      styleKeywords.forEach(keyword => {
        if (!enhancedPrompt.toLowerCase().includes(keyword)) {
          enhancedPrompt += `, ${keyword}`;
          styleSpecificTerms.push(keyword);
        }
      });

      // Add technique specifications
      if (technique && styleGuide.techniques.length > 0) {
        const matchingTechnique = styleGuide.techniques.find(t => 
          t.toLowerCase().includes(technique.toLowerCase())
        );
        if (matchingTechnique) {
          enhancedPrompt += `, ${matchingTechnique}`;
          technicalTerms.push(matchingTechnique);
        }
      }
    }

    // Add color palette specifications
    if (colorPalette) {
      if (colorPalette === 'black_and_gray') {
        enhancedPrompt += ', black and gray tattoo, monochromatic, grayscale shading';
        technicalTerms.push('black and gray technique');
      } else if (colorPalette === 'color') {
        enhancedPrompt += ', vibrant colors, full color tattoo, rich saturation';
        technicalTerms.push('color saturation');
      }
    }

    // Add body zone considerations
    if (bodyZone && this.bodyZoneConsiderations[bodyZone as keyof typeof this.bodyZoneConsiderations]) {
      const considerations = this.bodyZoneConsiderations[bodyZone as keyof typeof this.bodyZoneConsiderations];
      const consideration = considerations[0]; // Use first consideration
      enhancedPrompt += `, ${consideration}`;
      addedElements.push(`${bodyZone} placement optimization`);
    }

    // Add technical quality terms
    const qualityTerms = this.technicalTerms.quality;
    const selectedQualityTerms = qualityTerms.slice(0, 2);
    selectedQualityTerms.forEach(term => {
      if (!enhancedPrompt.toLowerCase().includes(term.toLowerCase())) {
        enhancedPrompt += `, ${term}`;
        qualityModifiers.push(term);
      }
    });

    // Add line work specifications
    if (style !== 'watercolor' && style !== 'abstract') {
      const lineWorkTerm = this.technicalTerms.lineWork[0];
      if (!enhancedPrompt.toLowerCase().includes('line')) {
        enhancedPrompt += `, ${lineWorkTerm}`;
        technicalTerms.push(lineWorkTerm);
      }
    }

    // Add preview mode specifications
    if (isPreviewMode) {
      enhancedPrompt += ', realistic skin application, proper tattoo placement, natural lighting on skin';
      addedElements.push('skin preview mode');
    } else {
      enhancedPrompt += ', tattoo stencil ready, clean design for application';
      addedElements.push('stencil optimization');
    }

    // Add subject-specific enhancements
    if (subject) {
      const subjectEnhancements = this.getSubjectEnhancements(subject, style);
      if (subjectEnhancements) {
        enhancedPrompt += `, ${subjectEnhancements}`;
        addedElements.push(`${subject} optimization`);
      }
    }

    // Ensure tattoo context
    if (!enhancedPrompt.toLowerCase().includes('tattoo')) {
      enhancedPrompt += ', professional tattoo design';
      qualityModifiers.push('tattoo context');
    }

    // Calculate confidence based on enhancements added
    const confidence = Math.min(95, 60 + (addedElements.length * 5) + (technicalTerms.length * 3));

    return {
      originalPrompt,
      enhancedPrompt,
      addedElements,
      technicalTerms,
      styleSpecificTerms,
      qualityModifiers,
      confidence
    };
  }

  /**
   * Get subject-specific enhancements
   */
  private static getSubjectEnhancements(subject: string, style?: string): string | null {
    const subjectLower = subject.toLowerCase();

    const subjectEnhancements: Record<string, string> = {
      'rose': 'detailed petals, thorns, natural stem',
      'skull': 'anatomical accuracy, bone texture, shadow depth',
      'dragon': 'scales detail, flowing form, mythical presence',
      'eagle': 'feather detail, wing spread, majestic pose',
      'lion': 'mane texture, powerful expression, regal stance',
      'wolf': 'fur texture, piercing eyes, wild spirit',
      'butterfly': 'wing patterns, delicate structure, graceful form',
      'tree': 'bark texture, branch detail, root system',
      'flower': 'petal detail, natural color, organic form',
      'portrait': 'facial features, skin texture, emotional expression',
      'anchor': 'rope detail, metal texture, nautical elements',
      'heart': 'anatomical or stylized, emotional symbolism',
      'cross': 'religious symbolism, clean lines, proportional',
      'star': 'geometric precision, light rays, celestial quality'
    };

    // Find matching subject
    for (const [key, enhancement] of Object.entries(subjectEnhancements)) {
      if (subjectLower.includes(key)) {
        return enhancement;
      }
    }

    // Generic enhancements based on category
    if (subjectLower.includes('animal')) {
      return 'anatomical accuracy, natural texture, lifelike expression';
    } else if (subjectLower.includes('flower') || subjectLower.includes('plant')) {
      return 'organic form, natural detail, botanical accuracy';
    } else if (subjectLower.includes('symbol') || subjectLower.includes('geometric')) {
      return 'precise geometry, clean lines, symbolic meaning';
    }

    return null;
  }

  /**
   * Analyze prompt for potential improvements
   */
  static analyzePromptQuality(prompt: string): {
    score: number;
    suggestions: string[];
    missingElements: string[];
    strengths: string[];
  } {
    const suggestions: string[] = [];
    const missingElements: string[] = [];
    const strengths: string[] = [];
    let score = 50; // Base score

    // Check for tattoo context
    if (prompt.toLowerCase().includes('tattoo')) {
      score += 10;
      strengths.push('Includes tattoo context');
    } else {
      missingElements.push('Tattoo context');
      suggestions.push('Add "tattoo" to clarify the design purpose');
    }

    // Check for style specification
    const hasStyle = this.tattooStyleGuides.some(sg => 
      prompt.toLowerCase().includes(sg.style)
    );
    if (hasStyle) {
      score += 15;
      strengths.push('Style specified');
    } else {
      missingElements.push('Style specification');
      suggestions.push('Specify a tattoo style (traditional, realistic, etc.)');
    }

    // Check for technical terms
    const hasTechnicalTerms = Object.values(this.technicalTerms).flat().some(term =>
      prompt.toLowerCase().includes(term.toLowerCase())
    );
    if (hasTechnicalTerms) {
      score += 10;
      strengths.push('Technical terms included');
    } else {
      missingElements.push('Technical specifications');
      suggestions.push('Add technical terms like "bold lines" or "detailed shading"');
    }

    // Check prompt length
    const wordCount = prompt.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 30) {
      score += 10;
      strengths.push('Good prompt length');
    } else if (wordCount < 5) {
      suggestions.push('Add more descriptive details');
      missingElements.push('Sufficient detail');
    } else {
      suggestions.push('Consider shortening for clarity');
    }

    // Check for color specification
    if (prompt.toLowerCase().includes('color') || 
        prompt.toLowerCase().includes('black') ||
        prompt.toLowerCase().includes('gray')) {
      score += 5;
      strengths.push('Color preference specified');
    } else {
      suggestions.push('Specify color preference (color or black & gray)');
    }

    return {
      score: Math.min(100, score),
      suggestions,
      missingElements,
      strengths
    };
  }

  /**
   * Get style-specific prompt templates
   */
  static getStyleTemplates(): Record<string, string[]> {
    const templates: Record<string, string[]> = {};
    
    this.tattooStyleGuides.forEach(guide => {
      templates[guide.style] = [
        `${guide.commonElements[0]} in ${guide.style} style with ${guide.characteristics[0].toLowerCase()}`,
        `${guide.commonElements[1]} featuring ${guide.techniques[0].toLowerCase()} and ${guide.colorPalettes[0].toLowerCase()}`,
        `${guide.style} tattoo design with ${guide.characteristics[1].toLowerCase()} and ${guide.commonElements[2].toLowerCase()}`
      ];
    });

    return templates;
  }

  /**
   * Generate prompt suggestions based on partial input
   */
  static generatePromptSuggestions(partialPrompt: string, count: number = 5): string[] {
    const suggestions: string[] = [];
    const lowerPrompt = partialPrompt.toLowerCase();

    // Find relevant style guides
    const relevantStyles = this.tattooStyleGuides.filter(sg =>
      sg.promptKeywords.some(keyword => lowerPrompt.includes(keyword)) ||
      sg.commonElements.some(element => lowerPrompt.includes(element.toLowerCase()))
    );

    // Generate suggestions based on relevant styles
    relevantStyles.forEach(style => {
      style.commonElements.forEach(element => {
        if (suggestions.length < count) {
          suggestions.push(
            `${partialPrompt} ${element.toLowerCase()} in ${style.style} style with ${style.characteristics[0].toLowerCase()}`
          );
        }
      });
    });

    // Add generic enhancements if no style-specific matches
    if (suggestions.length === 0) {
      const genericSuggestions = [
        `${partialPrompt} with bold lines and solid colors`,
        `${partialPrompt} in realistic style with detailed shading`,
        `${partialPrompt} as minimalist design with clean lines`,
        `${partialPrompt} in traditional tattoo style`,
        `${partialPrompt} with geometric patterns and precise lines`
      ];
      suggestions.push(...genericSuggestions.slice(0, count));
    }

    return suggestions.slice(0, count);
  }
}
