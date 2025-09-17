import { supabase } from '@/integrations/supabase/client';
import { PromptEnhancementService } from './promptEnhancementService';
import { AIModelOptimizationService, type AIModel } from './aiModelOptimizationService';

export interface EnhancementStage {
  name: string;
  description: string;
  processor: (input: string, context: EnhancementContext) => Promise<string>;
  weight: number;
  enabled: boolean;
}

export interface EnhancementContext {
  originalPrompt: string;
  targetModel: AIModel;
  style?: string;
  technique?: string;
  subject?: string;
  colorPalette?: string;
  bodyZone?: string;
  isPreviewMode?: boolean;
  userPreferences?: any;
  iterationContext?: any;
  previousEnhancements?: string[];
}

export interface PipelineResult {
  originalPrompt: string;
  enhancedPrompt: string;
  stagesApplied: string[];
  confidenceScore: number;
  processingTime: number;
  improvements: {
    stage: string;
    before: string;
    after: string;
    impact: number;
  }[];
  warnings: string[];
  suggestions: string[];
}

export class PromptEnhancementPipeline {
  private static stages: EnhancementStage[] = [
    {
      name: 'domain_context',
      description: 'Add tattoo-specific context and terminology',
      processor: this.addDomainContext,
      weight: 0.2,
      enabled: true
    },
    {
      name: 'style_enhancement',
      description: 'Enhance with style-specific characteristics',
      processor: this.enhanceWithStyle,
      weight: 0.25,
      enabled: true
    },
    {
      name: 'technical_optimization',
      description: 'Add technical terms and specifications',
      processor: this.addTechnicalOptimization,
      weight: 0.15,
      enabled: true
    },
    {
      name: 'model_adaptation',
      description: 'Adapt prompt for specific AI model',
      processor: this.adaptForModel,
      weight: 0.2,
      enabled: true
    },
    {
      name: 'quality_enhancement',
      description: 'Add quality and professional terms',
      processor: this.enhanceQuality,
      weight: 0.1,
      enabled: true
    },
    {
      name: 'context_refinement',
      description: 'Refine based on body zone and preview mode',
      processor: this.refineContext,
      weight: 0.1,
      enabled: true
    }
  ];

  /**
   * Process prompt through the complete enhancement pipeline
   */
  static async processPrompt(
    prompt: string,
    context: EnhancementContext
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    let currentPrompt = prompt.trim();
    const stagesApplied: string[] = [];
    const improvements: PipelineResult['improvements'] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate input
    if (!currentPrompt) {
      warnings.push('Empty prompt provided');
      return {
        originalPrompt: prompt,
        enhancedPrompt: 'professional tattoo design',
        stagesApplied: [],
        confidenceScore: 0,
        processingTime: Date.now() - startTime,
        improvements: [],
        warnings,
        suggestions: ['Please provide a descriptive prompt for better results']
      };
    }

    // Process through each enabled stage
    for (const stage of this.stages.filter(s => s.enabled)) {
      try {
        const beforeStage = currentPrompt;
        currentPrompt = await stage.processor(currentPrompt, context);
        
        if (currentPrompt !== beforeStage) {
          stagesApplied.push(stage.name);
          improvements.push({
            stage: stage.name,
            before: beforeStage,
            after: currentPrompt,
            impact: this.calculateImpact(beforeStage, currentPrompt, stage.weight)
          });
        }
      } catch (error) {
        console.error(`Error in stage ${stage.name}:`, error);
        warnings.push(`Stage ${stage.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(
      prompt,
      currentPrompt,
      stagesApplied,
      improvements
    );

    // Generate suggestions
    const generatedSuggestions = this.generateSuggestions(currentPrompt, context);
    suggestions.push(...generatedSuggestions);

    return {
      originalPrompt: prompt,
      enhancedPrompt: currentPrompt,
      stagesApplied,
      confidenceScore,
      processingTime: Date.now() - startTime,
      improvements,
      warnings,
      suggestions
    };
  }

  /**
   * Stage 1: Add domain context
   */
  private static async addDomainContext(
    prompt: string,
    context: EnhancementContext
  ): Promise<string> {
    let enhanced = prompt;

    // Ensure tattoo context
    if (!enhanced.toLowerCase().includes('tattoo')) {
      enhanced = `tattoo design of ${enhanced}`;
    }

    // Add professional context
    if (!enhanced.toLowerCase().includes('professional')) {
      enhanced = `professional ${enhanced}`;
    }

    return enhanced;
  }

  /**
   * Stage 2: Enhance with style
   */
  private static async enhanceWithStyle(
    prompt: string,
    context: EnhancementContext
  ): Promise<string> {
    if (!context.style) return prompt;

    const enhancement = PromptEnhancementService.enhancePrompt(
      prompt,
      context.style,
      context.technique,
      context.colorPalette,
      context.bodyZone,
      context.subject,
      context.isPreviewMode
    );

    return enhancement.enhancedPrompt;
  }

  /**
   * Stage 3: Add technical optimization
   */
  private static async addTechnicalOptimization(
    prompt: string,
    context: EnhancementContext
  ): Promise<string> {
    let enhanced = prompt;

    // Add technique-specific terms
    if (context.technique) {
      const techniqueTerms = {
        'line_work': 'precise lineart, clean outlines',
        'shading': 'detailed shading, gradient work',
        'dotwork': 'stippling technique, dot shading',
        'watercolor': 'flowing colors, paint-like texture',
        'geometric': 'precise geometry, mathematical patterns'
      };

      const terms = techniqueTerms[context.technique as keyof typeof techniqueTerms];
      if (terms && !enhanced.toLowerCase().includes(terms.split(',')[0])) {
        enhanced += `, ${terms}`;
      }
    }

    // Add quality modifiers
    const qualityTerms = ['high resolution', 'detailed', 'crisp'];
    const hasQualityTerm = qualityTerms.some(term => 
      enhanced.toLowerCase().includes(term)
    );
    
    if (!hasQualityTerm) {
      enhanced += ', high resolution, detailed';
    }

    return enhanced;
  }

  /**
   * Stage 4: Adapt for specific model
   */
  private static async adaptForModel(
    prompt: string,
    context: EnhancementContext
  ): Promise<string> {
    const analysis = AIModelOptimizationService.analyzePrompt(
      prompt,
      context.style,
      context.technique,
      context.subject
    );

    return AIModelOptimizationService.enhancePromptForModel(
      prompt,
      context.targetModel,
      analysis,
      {
        style: context.style,
        technique: context.technique,
        colorPalette: context.colorPalette,
        bodyZone: context.bodyZone,
        subject: context.subject
      }
    );
  }

  /**
   * Stage 5: Enhance quality
   */
  private static async enhanceQuality(
    prompt: string,
    context: EnhancementContext
  ): Promise<string> {
    let enhanced = prompt;

    // Add professional quality terms
    const qualityEnhancements = [
      'professional quality',
      'tattoo-ready design',
      'clean execution'
    ];

    const missingQuality = qualityEnhancements.filter(term =>
      !enhanced.toLowerCase().includes(term.toLowerCase())
    );

    if (missingQuality.length > 0) {
      enhanced += `, ${missingQuality[0]}`;
    }

    return enhanced;
  }

  /**
   * Stage 6: Refine context
   */
  private static async refineContext(
    prompt: string,
    context: EnhancementContext
  ): Promise<string> {
    let enhanced = prompt;

    // Add body zone considerations
    if (context.bodyZone) {
      const zoneEnhancements = {
        'arm': 'flows with arm contour',
        'leg': 'follows leg shape',
        'back': 'large canvas design',
        'chest': 'heart-centered placement',
        'shoulder': 'rounded placement',
        'wrist': 'delicate scale',
        'ankle': 'compact design'
      };

      const enhancement = zoneEnhancements[context.bodyZone as keyof typeof zoneEnhancements];
      if (enhancement && !enhanced.includes(enhancement)) {
        enhanced += `, ${enhancement}`;
      }
    }

    // Add preview mode specifications
    if (context.isPreviewMode) {
      if (!enhanced.includes('on skin')) {
        enhanced += ', realistic skin application, natural lighting';
      }
    } else {
      if (!enhanced.includes('stencil')) {
        enhanced += ', clean stencil design';
      }
    }

    return enhanced;
  }

  /**
   * Calculate impact of a stage
   */
  private static calculateImpact(
    before: string,
    after: string,
    weight: number
  ): number {
    const lengthIncrease = (after.length - before.length) / before.length;
    const wordIncrease = (after.split(' ').length - before.split(' ').length) / before.split(' ').length;
    
    return Math.round((lengthIncrease + wordIncrease) * weight * 100);
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidenceScore(
    original: string,
    enhanced: string,
    stagesApplied: string[],
    improvements: PipelineResult['improvements']
  ): number {
    let score = 50; // Base score

    // Bonus for stages applied
    score += stagesApplied.length * 8;

    // Bonus for meaningful improvements
    const totalImpact = improvements.reduce((sum, imp) => sum + imp.impact, 0);
    score += Math.min(30, totalImpact);

    // Bonus for length increase (indicates more detail)
    const lengthRatio = enhanced.length / original.length;
    if (lengthRatio > 1.5) score += 10;
    if (lengthRatio > 2) score += 5;

    // Penalty for excessive length
    if (enhanced.split(' ').length > 50) score -= 10;

    return Math.min(95, Math.max(60, score));
  }

  /**
   * Generate suggestions for further improvement
   */
  private static generateSuggestions(
    prompt: string,
    context: EnhancementContext
  ): string[] {
    const suggestions: string[] = [];

    // Check for missing elements
    if (!context.style) {
      suggestions.push('Consider specifying a tattoo style (traditional, realistic, etc.)');
    }

    if (!context.colorPalette) {
      suggestions.push('Specify color preference (color or black & gray)');
    }

    if (!context.bodyZone) {
      suggestions.push('Mention body placement for better composition');
    }

    // Check prompt length
    const wordCount = prompt.split(' ').length;
    if (wordCount < 5) {
      suggestions.push('Add more descriptive details for better results');
    } else if (wordCount > 40) {
      suggestions.push('Consider shortening the prompt for clarity');
    }

    return suggestions;
  }

  /**
   * Get pipeline configuration
   */
  static getConfiguration(): EnhancementStage[] {
    return [...this.stages];
  }

  /**
   * Update stage configuration
   */
  static updateStageConfiguration(
    stageName: string,
    enabled: boolean,
    weight?: number
  ): boolean {
    const stage = this.stages.find(s => s.name === stageName);
    if (!stage) return false;

    stage.enabled = enabled;
    if (weight !== undefined) {
      stage.weight = Math.max(0, Math.min(1, weight));
    }

    return true;
  }

  /**
   * Save pipeline result to database for analytics
   */
  static async savePipelineResult(result: PipelineResult): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('prompt_enhancement_logs')
        .insert({
          user_id: user.id,
          original_prompt: result.originalPrompt,
          enhanced_prompt: result.enhancedPrompt,
          stages_applied: result.stagesApplied,
          confidence_score: result.confidenceScore,
          processing_time: result.processingTime,
          improvements: result.improvements,
          warnings: result.warnings,
          suggestions: result.suggestions,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving pipeline result:', error);
      }
    } catch (error) {
      console.error('Error in savePipelineResult:', error);
    }
  }

  /**
   * Analyze pipeline performance
   */
  static async analyzePipelinePerformance(
    results: PipelineResult[]
  ): Promise<{
    averageConfidence: number;
    averageProcessingTime: number;
    mostEffectiveStages: string[];
    commonWarnings: string[];
    improvementSuggestions: string[];
  }> {
    if (results.length === 0) {
      return {
        averageConfidence: 0,
        averageProcessingTime: 0,
        mostEffectiveStages: [],
        commonWarnings: [],
        improvementSuggestions: []
      };
    }

    const averageConfidence = results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length;
    const averageProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    // Find most effective stages
    const stageImpacts: Record<string, number[]> = {};
    results.forEach(result => {
      result.improvements.forEach(improvement => {
        if (!stageImpacts[improvement.stage]) {
          stageImpacts[improvement.stage] = [];
        }
        stageImpacts[improvement.stage].push(improvement.impact);
      });
    });

    const mostEffectiveStages = Object.entries(stageImpacts)
      .map(([stage, impacts]) => ({
        stage,
        averageImpact: impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length
      }))
      .sort((a, b) => b.averageImpact - a.averageImpact)
      .slice(0, 3)
      .map(item => item.stage);

    // Find common warnings
    const warningCounts: Record<string, number> = {};
    results.forEach(result => {
      result.warnings.forEach(warning => {
        warningCounts[warning] = (warningCounts[warning] || 0) + 1;
      });
    });

    const commonWarnings = Object.entries(warningCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([warning]) => warning);

    return {
      averageConfidence,
      averageProcessingTime,
      mostEffectiveStages,
      commonWarnings,
      improvementSuggestions: [
        averageConfidence < 70 ? 'Consider enabling more enhancement stages' : '',
        averageProcessingTime > 1000 ? 'Optimize stage processing for better performance' : '',
        commonWarnings.length > 0 ? 'Address common pipeline warnings' : ''
      ].filter(Boolean)
    };
  }
}
