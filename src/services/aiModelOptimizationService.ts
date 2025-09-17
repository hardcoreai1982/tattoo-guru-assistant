import { supabase } from '@/integrations/supabase/client';

export type AIModel = 'flux' | 'openai' | 'stablediffusion' | 'ideogram' | 'gptimage';

export interface ModelCapabilities {
  model: AIModel;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
  styleCompatibility: string[];
  qualityScore: number;
  speedScore: number;
  costScore: number;
  maxPromptLength: number;
  supportedSizes: string[];
}

export interface PromptAnalysis {
  complexity: 'simple' | 'moderate' | 'complex';
  style: string | null;
  subject: string | null;
  technique: string | null;
  colorRequirement: 'black_and_gray' | 'color' | 'mixed' | 'any';
  detailLevel: 'minimal' | 'moderate' | 'high' | 'ultra';
  keywords: string[];
  estimatedTokens: number;
}

export interface ModelRecommendation {
  model: AIModel;
  confidence: number;
  reasoning: string[];
  expectedQuality: number;
  estimatedTime: number;
  alternativeModels: AIModel[];
}

export class AIModelOptimizationService {
  private static modelCapabilities: ModelCapabilities[] = [
    {
      model: 'flux',
      strengths: ['High detail', 'Realistic rendering', 'Complex compositions', 'Fine line work'],
      weaknesses: ['Slower generation', 'Higher cost', 'May over-complicate simple designs'],
      bestFor: ['Realistic tattoos', 'Portrait work', 'Complex scenes', 'Photo-realistic styles'],
      styleCompatibility: ['realistic', 'portrait', 'biomechanical', 'surreal', 'photorealistic'],
      qualityScore: 9.5,
      speedScore: 6.0,
      costScore: 4.0,
      maxPromptLength: 1000,
      supportedSizes: ['1024x1024']
    },
    {
      model: 'openai',
      strengths: ['Consistent quality', 'Good prompt understanding', 'Balanced results', 'Reliable'],
      weaknesses: ['Less artistic freedom', 'Content restrictions', 'Generic style'],
      bestFor: ['Traditional designs', 'Clean line work', 'Balanced compositions', 'Safe designs'],
      styleCompatibility: ['traditional', 'neo-traditional', 'american traditional', 'clean', 'minimalist'],
      qualityScore: 8.5,
      speedScore: 8.0,
      costScore: 7.0,
      maxPromptLength: 1000,
      supportedSizes: ['1024x1024']
    },
    {
      model: 'stablediffusion',
      strengths: ['Artistic styles', 'Creative freedom', 'Style flexibility', 'Good for abstract'],
      weaknesses: ['Inconsistent quality', 'May need multiple attempts', 'Less realistic'],
      bestFor: ['Artistic styles', 'Abstract designs', 'Watercolor', 'Sketch styles', 'Creative interpretations'],
      styleCompatibility: ['watercolor', 'sketch', 'abstract', 'artistic', 'painterly', 'illustrative'],
      qualityScore: 7.5,
      speedScore: 7.5,
      costScore: 8.5,
      maxPromptLength: 800,
      supportedSizes: ['1024x1024']
    },
    {
      model: 'ideogram',
      strengths: ['Text integration', 'Logo design', 'Geometric patterns', 'Typography'],
      weaknesses: ['Limited realism', 'Better for graphics than tattoos', 'Less organic'],
      bestFor: ['Text tattoos', 'Logos', 'Geometric designs', 'Typography', 'Symbols'],
      styleCompatibility: ['geometric', 'text', 'logo', 'minimalist', 'symbolic', 'typography'],
      qualityScore: 8.0,
      speedScore: 8.5,
      costScore: 8.0,
      maxPromptLength: 500,
      supportedSizes: ['1024x1024']
    },
    {
      model: 'gptimage',
      strengths: ['Latest technology', 'High quality', 'Good prompt understanding', 'Versatile'],
      weaknesses: ['New model', 'Less tested', 'May be inconsistent', 'Limited availability'],
      bestFor: ['Experimental designs', 'High-quality renders', 'Complex prompts', 'Latest features'],
      styleCompatibility: ['modern', 'contemporary', 'experimental', 'high-detail', 'versatile'],
      qualityScore: 9.0,
      speedScore: 7.0,
      costScore: 5.0,
      maxPromptLength: 1000,
      supportedSizes: ['1024x1024']
    }
  ];

  /**
   * Analyze a prompt to understand its characteristics
   */
  static analyzePrompt(prompt: string, style?: string, technique?: string, subject?: string): PromptAnalysis {
    const words = prompt.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    
    // Determine complexity based on word count and specific keywords
    const complexityKeywords = ['detailed', 'intricate', 'complex', 'elaborate', 'sophisticated'];
    const hasComplexityKeywords = complexityKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    
    let complexity: PromptAnalysis['complexity'] = 'simple';
    if (wordCount > 20 || hasComplexityKeywords) complexity = 'complex';
    else if (wordCount > 10) complexity = 'moderate';

    // Detect color requirements
    const colorKeywords = ['color', 'colored', 'vibrant', 'rainbow', 'red', 'blue', 'green', 'yellow', 'purple'];
    const bwKeywords = ['black', 'gray', 'grey', 'monochrome', 'black and white'];
    
    let colorRequirement: PromptAnalysis['colorRequirement'] = 'any';
    if (bwKeywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
      colorRequirement = 'black_and_gray';
    } else if (colorKeywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
      colorRequirement = 'color';
    }

    // Determine detail level
    const detailKeywords = {
      minimal: ['simple', 'clean', 'minimal', 'basic'],
      moderate: ['detailed', 'medium', 'standard'],
      high: ['intricate', 'detailed', 'complex', 'elaborate'],
      ultra: ['hyper-detailed', 'ultra-detailed', 'extremely detailed', 'photorealistic']
    };

    let detailLevel: PromptAnalysis['detailLevel'] = 'moderate';
    for (const [level, keywords] of Object.entries(detailKeywords)) {
      if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
        detailLevel = level as PromptAnalysis['detailLevel'];
        break;
      }
    }

    // Extract keywords
    const tattooKeywords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'with', 'that', 'this', 'for', 'are', 'was', 'will', 'have', 'been'].includes(word)
    );

    return {
      complexity,
      style: style || null,
      subject: subject || null,
      technique: technique || null,
      colorRequirement,
      detailLevel,
      keywords: tattooKeywords.slice(0, 10), // Top 10 keywords
      estimatedTokens: Math.ceil(wordCount * 1.3) // Rough token estimation
    };
  }

  /**
   * Recommend the best AI model based on prompt analysis and user preferences
   */
  static recommendModel(
    promptAnalysis: PromptAnalysis,
    userPreferences?: {
      prioritizeQuality?: boolean;
      prioritizeSpeed?: boolean;
      prioritizeCost?: boolean;
      preferredModels?: AIModel[];
      avoidModels?: AIModel[];
    }
  ): ModelRecommendation {
    const preferences = {
      prioritizeQuality: false,
      prioritizeSpeed: false,
      prioritizeCost: false,
      preferredModels: [],
      avoidModels: [],
      ...userPreferences
    };

    let modelScores: Array<{ model: AIModel; score: number; reasoning: string[] }> = [];

    for (const modelCap of this.modelCapabilities) {
      if (preferences.avoidModels?.includes(modelCap.model)) continue;

      let score = 0;
      const reasoning: string[] = [];

      // Base quality score
      score += modelCap.qualityScore * 0.3;

      // Style compatibility
      if (promptAnalysis.style && modelCap.styleCompatibility.includes(promptAnalysis.style.toLowerCase())) {
        score += 2;
        reasoning.push(`Excellent for ${promptAnalysis.style} style`);
      }

      // Complexity matching
      if (promptAnalysis.complexity === 'complex' && modelCap.model === 'flux') {
        score += 2;
        reasoning.push('Best for complex, detailed designs');
      } else if (promptAnalysis.complexity === 'simple' && modelCap.model === 'ideogram') {
        score += 1.5;
        reasoning.push('Efficient for simple designs');
      }

      // Detail level matching
      if (promptAnalysis.detailLevel === 'ultra' && ['flux', 'gptimage'].includes(modelCap.model)) {
        score += 1.5;
        reasoning.push('Handles ultra-detailed prompts well');
      }

      // Subject-specific bonuses
      if (promptAnalysis.subject) {
        const subject = promptAnalysis.subject.toLowerCase();
        if (subject.includes('portrait') && modelCap.model === 'flux') {
          score += 2;
          reasoning.push('Excellent for portrait work');
        } else if (subject.includes('text') && modelCap.model === 'ideogram') {
          score += 2;
          reasoning.push('Best for text and typography');
        } else if (subject.includes('geometric') && modelCap.model === 'ideogram') {
          score += 1.5;
          reasoning.push('Great for geometric patterns');
        }
      }

      // User preference bonuses
      if (preferences.prioritizeQuality) {
        score += modelCap.qualityScore * 0.2;
        reasoning.push('High quality prioritized');
      }
      if (preferences.prioritizeSpeed) {
        score += modelCap.speedScore * 0.2;
        reasoning.push('Fast generation prioritized');
      }
      if (preferences.prioritizeCost) {
        score += modelCap.costScore * 0.2;
        reasoning.push('Cost efficiency prioritized');
      }
      if (preferences.preferredModels?.includes(modelCap.model)) {
        score += 1;
        reasoning.push('User preferred model');
      }

      // Prompt length compatibility
      if (promptAnalysis.estimatedTokens > modelCap.maxPromptLength) {
        score -= 2;
        reasoning.push('Prompt may be too long for this model');
      }

      modelScores.push({ model: modelCap.model, score, reasoning });
    }

    // Sort by score
    modelScores.sort((a, b) => b.score - a.score);

    const topModel = modelScores[0];
    const confidence = Math.min(95, Math.max(60, topModel.score * 10));

    return {
      model: topModel.model,
      confidence,
      reasoning: topModel.reasoning,
      expectedQuality: this.modelCapabilities.find(m => m.model === topModel.model)?.qualityScore || 8,
      estimatedTime: this.getEstimatedTime(topModel.model, promptAnalysis.complexity),
      alternativeModels: modelScores.slice(1, 4).map(m => m.model)
    };
  }

  /**
   * Enhance a prompt based on the selected model's strengths
   */
  static enhancePromptForModel(
    originalPrompt: string,
    model: AIModel,
    promptAnalysis: PromptAnalysis,
    designDetails?: {
      style?: string;
      technique?: string;
      colorPalette?: string;
      bodyZone?: string;
      subject?: string;
    }
  ): string {
    const modelCap = this.modelCapabilities.find(m => m.model === model);
    if (!modelCap) return originalPrompt;

    let enhancedPrompt = originalPrompt;

    // Model-specific enhancements
    switch (model) {
      case 'flux':
        if (promptAnalysis.detailLevel !== 'ultra') {
          enhancedPrompt += ', highly detailed, photorealistic, professional tattoo quality';
        }
        if (designDetails?.technique) {
          enhancedPrompt += `, masterful ${designDetails.technique} technique`;
        }
        break;

      case 'openai':
        enhancedPrompt += ', clean professional tattoo design, well-balanced composition';
        if (designDetails?.style === 'traditional') {
          enhancedPrompt += ', classic American traditional style';
        }
        break;

      case 'stablediffusion':
        enhancedPrompt += ', artistic tattoo design, creative interpretation';
        if (designDetails?.style?.includes('watercolor')) {
          enhancedPrompt += ', watercolor tattoo style, flowing colors';
        }
        break;

      case 'ideogram':
        if (promptAnalysis.subject?.includes('text') || originalPrompt.includes('text')) {
          enhancedPrompt += ', clear typography, readable text, professional lettering';
        }
        if (promptAnalysis.keywords.some(k => ['geometric', 'pattern', 'symbol'].includes(k))) {
          enhancedPrompt += ', precise geometric design, clean lines';
        }
        break;

      case 'gptimage':
        enhancedPrompt += ', cutting-edge tattoo design, modern interpretation';
        break;
    }

    // Add technical specifications
    enhancedPrompt += ', tattoo stencil ready, black outline, suitable for skin application';

    // Ensure prompt doesn't exceed model limits
    if (enhancedPrompt.length > modelCap.maxPromptLength) {
      enhancedPrompt = enhancedPrompt.substring(0, modelCap.maxPromptLength - 3) + '...';
    }

    return enhancedPrompt;
  }

  /**
   * Get estimated generation time for a model and complexity
   */
  private static getEstimatedTime(model: AIModel, complexity: PromptAnalysis['complexity']): number {
    const baseTime = {
      flux: 15,
      openai: 8,
      stablediffusion: 10,
      ideogram: 6,
      gptimage: 12
    };

    const complexityMultiplier = {
      simple: 0.8,
      moderate: 1.0,
      complex: 1.3
    };

    return Math.round(baseTime[model] * complexityMultiplier[complexity]);
  }

  /**
   * Get model information for UI display
   */
  static getModelInfo(model: AIModel): ModelCapabilities | null {
    return this.modelCapabilities.find(m => m.model === model) || null;
  }

  /**
   * Get all available models with their capabilities
   */
  static getAllModels(): ModelCapabilities[] {
    return [...this.modelCapabilities];
  }

  /**
   * Save user model preferences
   */
  static async saveUserPreferences(preferences: {
    preferredModels?: AIModel[];
    avoidModels?: AIModel[];
    prioritizeQuality?: boolean;
    prioritizeSpeed?: boolean;
    prioritizeCost?: boolean;
  }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ai_model_preferences: preferences,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  }

  /**
   * Load user model preferences
   */
  static async loadUserPreferences(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('ai_model_preferences')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return null;
      return data.ai_model_preferences;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  }
}
