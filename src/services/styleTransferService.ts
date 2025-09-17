import { supabase } from '@/integrations/supabase/client';
import { PromptEnhancementService } from './promptEnhancementService';
import { AIModelOptimizationService, type AIModel } from './aiModelOptimizationService';

export interface StyleTransferRule {
  fromStyle: string;
  toStyle: string;
  transformations: StyleTransformation[];
  compatibility: number; // 0-100, how well the transfer works
  preservedElements: string[];
  modifiedElements: string[];
  addedElements: string[];
  removedElements: string[];
}

export interface StyleTransformation {
  type: 'replace' | 'add' | 'remove' | 'modify';
  target: string;
  replacement?: string;
  condition?: string;
  priority: number;
}

export interface StyleTransferRequest {
  originalPrompt: string;
  originalStyle: string;
  targetStyle: string;
  preserveSubject: boolean;
  preserveComposition: boolean;
  preserveColorScheme: boolean;
  targetModel?: AIModel;
  customInstructions?: string;
}

export interface StyleTransferResult {
  originalPrompt: string;
  transferredPrompt: string;
  fromStyle: string;
  toStyle: string;
  confidence: number;
  preservedElements: string[];
  transformedElements: {
    original: string;
    transformed: string;
    reason: string;
  }[];
  warnings: string[];
  suggestions: string[];
  compatibilityScore: number;
  estimatedQuality: number;
}

export class StyleTransferService {
  private static transferRules: StyleTransferRule[] = [
    {
      fromStyle: 'traditional',
      toStyle: 'realistic',
      compatibility: 85,
      transformations: [
        {
          type: 'replace',
          target: 'bold lines',
          replacement: 'fine detailed linework',
          priority: 1
        },
        {
          type: 'replace',
          target: 'solid colors',
          replacement: 'realistic color gradients and shading',
          priority: 1
        },
        {
          type: 'add',
          target: 'design',
          replacement: 'photorealistic detail, dimensional depth, accurate proportions',
          priority: 2
        },
        {
          type: 'remove',
          target: 'americana|classic',
          priority: 3
        }
      ],
      preservedElements: ['subject', 'composition', 'basic color scheme'],
      modifiedElements: ['line style', 'shading technique', 'color application'],
      addedElements: ['realistic detail', 'dimensional shading', 'photorealistic texture'],
      removedElements: ['bold outlines', 'flat color fills', 'stylized elements']
    },
    {
      fromStyle: 'realistic',
      toStyle: 'traditional',
      compatibility: 75,
      transformations: [
        {
          type: 'replace',
          target: 'photorealistic|realistic|detailed shading',
          replacement: 'bold black outlines, solid color fills',
          priority: 1
        },
        {
          type: 'replace',
          target: 'fine.*line|detailed.*line',
          replacement: 'bold lines',
          priority: 1
        },
        {
          type: 'add',
          target: 'design',
          replacement: 'classic americana style, traditional tattoo aesthetic',
          priority: 2
        },
        {
          type: 'remove',
          target: 'dimensional|gradient|photorealistic',
          priority: 3
        }
      ],
      preservedElements: ['subject', 'basic composition'],
      modifiedElements: ['line weight', 'color application', 'shading style'],
      addedElements: ['bold outlines', 'solid colors', 'traditional aesthetic'],
      removedElements: ['fine details', 'realistic shading', 'photorealistic elements']
    },
    {
      fromStyle: 'traditional',
      toStyle: 'geometric',
      compatibility: 60,
      transformations: [
        {
          type: 'replace',
          target: 'organic|flowing',
          replacement: 'geometric patterns, precise angles',
          priority: 1
        },
        {
          type: 'add',
          target: 'design',
          replacement: 'mathematical precision, symmetrical composition, clean geometric lines',
          priority: 2
        },
        {
          type: 'modify',
          target: 'subject',
          replacement: 'stylized with geometric elements',
          condition: 'preserve_subject',
          priority: 2
        }
      ],
      preservedElements: ['color scheme', 'basic subject'],
      modifiedElements: ['composition', 'line style', 'overall approach'],
      addedElements: ['geometric patterns', 'mathematical precision', 'symmetrical elements'],
      removedElements: ['organic curves', 'traditional imagery', 'flowing elements']
    },
    {
      fromStyle: 'realistic',
      toStyle: 'watercolor',
      compatibility: 70,
      transformations: [
        {
          type: 'replace',
          target: 'precise|sharp|defined',
          replacement: 'soft, flowing, paint-like',
          priority: 1
        },
        {
          type: 'add',
          target: 'design',
          replacement: 'watercolor paint effects, color bleeding, soft edges, artistic brush strokes',
          priority: 2
        },
        {
          type: 'replace',
          target: 'photorealistic',
          replacement: 'artistic interpretation',
          priority: 1
        }
      ],
      preservedElements: ['subject', 'color palette'],
      modifiedElements: ['edge definition', 'color application', 'overall texture'],
      addedElements: ['paint effects', 'color bleeding', 'artistic texture'],
      removedElements: ['sharp edges', 'precise details', 'photorealistic elements']
    },
    {
      fromStyle: 'geometric',
      toStyle: 'minimalist',
      compatibility: 90,
      transformations: [
        {
          type: 'remove',
          target: 'complex|intricate|detailed',
          priority: 1
        },
        {
          type: 'add',
          target: 'design',
          replacement: 'clean simplicity, negative space, minimal elements',
          priority: 2
        },
        {
          type: 'replace',
          target: 'bold|thick',
          replacement: 'fine, delicate',
          priority: 2
        }
      ],
      preservedElements: ['geometric principles', 'clean lines'],
      modifiedElements: ['complexity level', 'line weight', 'element count'],
      addedElements: ['negative space', 'simplicity', 'minimal aesthetic'],
      removedElements: ['complex patterns', 'heavy elements', 'ornate details']
    },
    {
      fromStyle: 'watercolor',
      toStyle: 'blackwork',
      compatibility: 50,
      transformations: [
        {
          type: 'remove',
          target: 'color|vibrant|paint',
          priority: 1
        },
        {
          type: 'add',
          target: 'design',
          replacement: 'bold black ink, high contrast, solid black elements',
          priority: 2
        },
        {
          type: 'replace',
          target: 'soft|flowing',
          replacement: 'bold, defined, high contrast',
          priority: 1
        }
      ],
      preservedElements: ['subject', 'basic composition'],
      modifiedElements: ['color scheme', 'contrast level', 'edge definition'],
      addedElements: ['black ink emphasis', 'high contrast', 'bold elements'],
      removedElements: ['color elements', 'soft edges', 'paint effects']
    }
  ];

  /**
   * Transfer a design from one style to another
   */
  static async transferStyle(request: StyleTransferRequest): Promise<StyleTransferResult> {
    const startTime = Date.now();
    
    try {
      // Find applicable transfer rule
      const rule = this.findTransferRule(request.originalStyle, request.targetStyle);
      
      if (!rule) {
        return this.createFallbackTransfer(request);
      }

      // Apply transformations
      let transferredPrompt = request.originalPrompt;
      const transformedElements: StyleTransferResult['transformedElements'] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Sort transformations by priority
      const sortedTransformations = [...rule.transformations].sort((a, b) => a.priority - b.priority);

      for (const transformation of sortedTransformations) {
        const beforeTransform = transferredPrompt;
        
        switch (transformation.type) {
          case 'replace':
            if (transformation.target && transformation.replacement) {
              const regex = new RegExp(transformation.target, 'gi');
              if (regex.test(transferredPrompt)) {
                transferredPrompt = transferredPrompt.replace(regex, transformation.replacement);
                transformedElements.push({
                  original: transformation.target,
                  transformed: transformation.replacement,
                  reason: `Style transfer: ${request.originalStyle} → ${request.targetStyle}`
                });
              }
            }
            break;

          case 'add':
            if (transformation.replacement) {
              transferredPrompt += `, ${transformation.replacement}`;
              transformedElements.push({
                original: '',
                transformed: transformation.replacement,
                reason: `Added for ${request.targetStyle} style`
              });
            }
            break;

          case 'remove':
            if (transformation.target) {
              const regex = new RegExp(transformation.target, 'gi');
              if (regex.test(transferredPrompt)) {
                transferredPrompt = transferredPrompt.replace(regex, '');
                transformedElements.push({
                  original: transformation.target,
                  transformed: '[removed]',
                  reason: `Removed for ${request.targetStyle} style compatibility`
                });
              }
            }
            break;

          case 'modify':
            if (transformation.condition === 'preserve_subject' && request.preserveSubject) {
              // Apply conditional modification
              if (transformation.target && transformation.replacement) {
                const regex = new RegExp(`(${transformation.target})`, 'gi');
                transferredPrompt = transferredPrompt.replace(regex, `$1 ${transformation.replacement}`);
              }
            }
            break;
        }

        // Clean up any double commas or spaces
        transferredPrompt = transferredPrompt.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
      }

      // Apply preservation rules
      if (!request.preserveColorScheme && request.targetStyle === 'blackwork') {
        transferredPrompt = transferredPrompt.replace(/color\w*|vibrant|rainbow|red|blue|green|yellow/gi, 'black ink');
      }

      // Enhance with target style specifics
      const styleEnhancement = PromptEnhancementService.enhancePrompt(
        transferredPrompt,
        request.targetStyle,
        undefined, // Let the service determine technique
        request.preserveColorScheme ? undefined : this.getStyleColorPalette(request.targetStyle),
        undefined,
        this.extractSubject(request.originalPrompt)
      );

      transferredPrompt = styleEnhancement.enhancedPrompt;

      // Add model-specific optimization if requested
      if (request.targetModel) {
        const analysis = AIModelOptimizationService.analyzePrompt(transferredPrompt, request.targetStyle);
        transferredPrompt = AIModelOptimizationService.enhancePromptForModel(
          transferredPrompt,
          request.targetModel,
          analysis,
          { style: request.targetStyle }
        );
      }

      // Add custom instructions
      if (request.customInstructions) {
        transferredPrompt += `, ${request.customInstructions}`;
      }

      // Calculate confidence and quality scores
      const confidence = this.calculateTransferConfidence(rule, request, transformedElements);
      const estimatedQuality = this.estimateTransferQuality(rule, request);

      // Generate warnings and suggestions
      if (rule.compatibility < 70) {
        warnings.push(`Style transfer compatibility is ${rule.compatibility}% - results may vary`);
      }

      if (transformedElements.length < 2) {
        warnings.push('Limited transformations applied - consider manual refinement');
      }

      suggestions.push(`Consider using ${this.getOptimalModel(request.targetStyle)} model for best results`);
      
      if (confidence < 75) {
        suggestions.push('Try the advanced prompt builder for additional refinements');
      }

      // Save transfer result for analytics
      await this.saveTransferResult({
        originalPrompt: request.originalPrompt,
        transferredPrompt,
        fromStyle: request.originalStyle,
        toStyle: request.targetStyle,
        confidence,
        preservedElements: rule.preservedElements,
        transformedElements,
        warnings,
        suggestions,
        compatibilityScore: rule.compatibility,
        estimatedQuality
      });

      return {
        originalPrompt: request.originalPrompt,
        transferredPrompt,
        fromStyle: request.originalStyle,
        toStyle: request.targetStyle,
        confidence,
        preservedElements: rule.preservedElements,
        transformedElements,
        warnings,
        suggestions,
        compatibilityScore: rule.compatibility,
        estimatedQuality
      };

    } catch (error) {
      console.error('Style transfer error:', error);
      return this.createErrorTransfer(request, error);
    }
  }

  /**
   * Get available style transfer options
   */
  static getAvailableTransfers(): { from: string; to: string; compatibility: number }[] {
    return this.transferRules.map(rule => ({
      from: rule.fromStyle,
      to: rule.toStyle,
      compatibility: rule.compatibility
    }));
  }

  /**
   * Check if a style transfer is supported
   */
  static isTransferSupported(fromStyle: string, toStyle: string): boolean {
    return this.transferRules.some(rule => 
      rule.fromStyle.toLowerCase() === fromStyle.toLowerCase() && 
      rule.toStyle.toLowerCase() === toStyle.toLowerCase()
    );
  }

  /**
   * Get transfer compatibility score
   */
  static getTransferCompatibility(fromStyle: string, toStyle: string): number {
    const rule = this.findTransferRule(fromStyle, toStyle);
    return rule?.compatibility || 0;
  }

  /**
   * Preview style transfer without full processing
   */
  static previewTransfer(fromStyle: string, toStyle: string): {
    compatibility: number;
    preservedElements: string[];
    modifiedElements: string[];
    addedElements: string[];
    removedElements: string[];
    warnings: string[];
  } {
    const rule = this.findTransferRule(fromStyle, toStyle);
    
    if (!rule) {
      return {
        compatibility: 0,
        preservedElements: [],
        modifiedElements: [],
        addedElements: [],
        removedElements: [],
        warnings: ['Style transfer not supported between these styles']
      };
    }

    const warnings: string[] = [];
    if (rule.compatibility < 70) {
      warnings.push('Low compatibility - significant changes expected');
    }
    if (rule.compatibility < 50) {
      warnings.push('Very low compatibility - consider alternative target styles');
    }

    return {
      compatibility: rule.compatibility,
      preservedElements: rule.preservedElements,
      modifiedElements: rule.modifiedElements,
      addedElements: rule.addedElements,
      removedElements: rule.removedElements,
      warnings
    };
  }

  private static findTransferRule(fromStyle: string, toStyle: string): StyleTransferRule | null {
    return this.transferRules.find(rule => 
      rule.fromStyle.toLowerCase() === fromStyle.toLowerCase() && 
      rule.toStyle.toLowerCase() === toStyle.toLowerCase()
    ) || null;
  }

  private static createFallbackTransfer(request: StyleTransferRequest): StyleTransferResult {
    // Create a basic transfer using style enhancement
    const enhancement = PromptEnhancementService.enhancePrompt(
      request.originalPrompt,
      request.targetStyle
    );

    return {
      originalPrompt: request.originalPrompt,
      transferredPrompt: enhancement.enhancedPrompt,
      fromStyle: request.originalStyle,
      toStyle: request.targetStyle,
      confidence: 50,
      preservedElements: ['subject'],
      transformedElements: [{
        original: request.originalPrompt,
        transformed: enhancement.enhancedPrompt,
        reason: 'Fallback style enhancement applied'
      }],
      warnings: ['Direct style transfer not available - using style enhancement'],
      suggestions: ['Consider using a supported style combination for better results'],
      compatibilityScore: 50,
      estimatedQuality: 60
    };
  }

  private static createErrorTransfer(request: StyleTransferRequest, error: any): StyleTransferResult {
    return {
      originalPrompt: request.originalPrompt,
      transferredPrompt: request.originalPrompt,
      fromStyle: request.originalStyle,
      toStyle: request.targetStyle,
      confidence: 0,
      preservedElements: [],
      transformedElements: [],
      warnings: [`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      suggestions: ['Try again or use manual prompt editing'],
      compatibilityScore: 0,
      estimatedQuality: 0
    };
  }

  private static calculateTransferConfidence(
    rule: StyleTransferRule,
    request: StyleTransferRequest,
    transformedElements: any[]
  ): number {
    let confidence = rule.compatibility * 0.6; // Base confidence from compatibility

    // Bonus for successful transformations
    confidence += Math.min(30, transformedElements.length * 5);

    // Bonus for preservation preferences
    if (request.preserveSubject) confidence += 5;
    if (request.preserveComposition) confidence += 5;

    // Penalty for low compatibility
    if (rule.compatibility < 60) confidence -= 10;

    return Math.max(30, Math.min(95, Math.round(confidence)));
  }

  private static estimateTransferQuality(rule: StyleTransferRule, request: StyleTransferRequest): number {
    let quality = rule.compatibility * 0.7;

    // Adjust based on style combination difficulty
    const difficultCombinations = [
      ['watercolor', 'geometric'],
      ['realistic', 'minimalist'],
      ['traditional', 'watercolor']
    ];

    const isDifficult = difficultCombinations.some(([from, to]) =>
      (from === request.originalStyle && to === request.targetStyle) ||
      (to === request.originalStyle && from === request.targetStyle)
    );

    if (isDifficult) quality -= 15;

    return Math.max(40, Math.min(90, Math.round(quality)));
  }

  private static getStyleColorPalette(style: string): string {
    const palettes: Record<string, string> = {
      traditional: 'red, blue, yellow, green, black',
      realistic: 'natural colors, skin tones',
      watercolor: 'vibrant, flowing colors',
      geometric: 'monochrome, high contrast',
      minimalist: 'black ink, minimal color',
      blackwork: 'black ink only'
    };
    return palettes[style] || 'balanced color palette';
  }

  private static extractSubject(prompt: string): string {
    // Simple subject extraction - could be enhanced with NLP
    const commonSubjects = ['rose', 'skull', 'dragon', 'eagle', 'lion', 'butterfly', 'tree', 'heart', 'anchor'];
    const found = commonSubjects.find(subject => 
      prompt.toLowerCase().includes(subject)
    );
    return found || 'design';
  }

  private static getOptimalModel(style: string): AIModel {
    const modelPreferences: Record<string, AIModel> = {
      realistic: 'flux',
      traditional: 'openai',
      geometric: 'ideogram',
      watercolor: 'stablediffusion',
      minimalist: 'openai',
      blackwork: 'stablediffusion'
    };
    return modelPreferences[style] || 'flux';
  }

  private static async saveTransferResult(result: StyleTransferResult): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('style_transfer_logs').insert({
        user_id: user.id,
        original_prompt: result.originalPrompt,
        transferred_prompt: result.transferredPrompt,
        from_style: result.fromStyle,
        to_style: result.toStyle,
        confidence: result.confidence,
        compatibility_score: result.compatibilityScore,
        estimated_quality: result.estimatedQuality,
        transformed_elements: result.transformedElements,
        warnings: result.warnings,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving transfer result:', error);
    }
  }
}
