import { supabase } from '@/integrations/supabase/client';
import type { AIModel } from './aiModelOptimizationService';

export interface ModelPerformanceMetrics {
  model: AIModel;
  totalGenerations: number;
  successRate: number;
  averageGenerationTime: number;
  averageQualityRating: number;
  userSatisfactionScore: number;
  errorRate: number;
  popularStyles: string[];
  optimalPromptLength: number;
  lastUpdated: Date;
}

export interface GenerationResult {
  model: AIModel;
  prompt: string;
  style?: string;
  technique?: string;
  success: boolean;
  generationTime: number;
  qualityRating?: number;
  userRating?: number;
  errorMessage?: string;
  promptLength: number;
  timestamp: Date;
}

export class ModelPerformanceService {
  /**
   * Track a generation result for performance analysis
   */
  static async trackGeneration(result: GenerationResult): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store generation result in database
      const { error } = await supabase
        .from('model_performance_logs')
        .insert({
          user_id: user.id,
          model: result.model,
          prompt: result.prompt,
          style: result.style,
          technique: result.technique,
          success: result.success,
          generation_time: result.generationTime,
          quality_rating: result.qualityRating,
          user_rating: result.userRating,
          error_message: result.errorMessage,
          prompt_length: result.promptLength,
          created_at: result.timestamp.toISOString()
        });

      if (error) {
        console.error('Error tracking generation:', error);
      }
    } catch (error) {
      console.error('Error in trackGeneration:', error);
    }
  }

  /**
   * Get performance metrics for all models
   */
  static async getModelPerformanceMetrics(): Promise<ModelPerformanceMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('model_performance_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) {
        console.error('Error fetching performance metrics:', error);
        return [];
      }

      const models: AIModel[] = ['flux', 'openai', 'stablediffusion', 'ideogram', 'gptimage'];
      const metrics: ModelPerformanceMetrics[] = [];

      for (const model of models) {
        const modelData = data.filter(d => d.model === model);
        
        if (modelData.length === 0) {
          metrics.push({
            model,
            totalGenerations: 0,
            successRate: 0,
            averageGenerationTime: 0,
            averageQualityRating: 0,
            userSatisfactionScore: 0,
            errorRate: 0,
            popularStyles: [],
            optimalPromptLength: 0,
            lastUpdated: new Date()
          });
          continue;
        }

        const successfulGenerations = modelData.filter(d => d.success);
        const successRate = (successfulGenerations.length / modelData.length) * 100;
        
        const averageGenerationTime = modelData.reduce((sum, d) => sum + (d.generation_time || 0), 0) / modelData.length;
        
        const qualityRatings = modelData.filter(d => d.quality_rating).map(d => d.quality_rating);
        const averageQualityRating = qualityRatings.length > 0 
          ? qualityRatings.reduce((sum, rating) => sum + rating, 0) / qualityRatings.length 
          : 0;

        const userRatings = modelData.filter(d => d.user_rating).map(d => d.user_rating);
        const userSatisfactionScore = userRatings.length > 0
          ? userRatings.reduce((sum, rating) => sum + rating, 0) / userRatings.length
          : 0;

        const errorRate = ((modelData.length - successfulGenerations.length) / modelData.length) * 100;

        // Find popular styles
        const styleCount: Record<string, number> = {};
        modelData.forEach(d => {
          if (d.style) {
            styleCount[d.style] = (styleCount[d.style] || 0) + 1;
          }
        });
        const popularStyles = Object.entries(styleCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([style]) => style);

        // Calculate optimal prompt length
        const successfulPromptLengths = successfulGenerations.map(d => d.prompt_length);
        const optimalPromptLength = successfulPromptLengths.length > 0
          ? Math.round(successfulPromptLengths.reduce((sum, length) => sum + length, 0) / successfulPromptLengths.length)
          : 0;

        metrics.push({
          model,
          totalGenerations: modelData.length,
          successRate,
          averageGenerationTime,
          averageQualityRating,
          userSatisfactionScore,
          errorRate,
          popularStyles,
          optimalPromptLength,
          lastUpdated: new Date()
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error getting model performance metrics:', error);
      return [];
    }
  }

  /**
   * Get personalized model recommendations based on user history
   */
  static async getPersonalizedRecommendations(
    prompt: string,
    style?: string,
    technique?: string
  ): Promise<{
    recommendedModel: AIModel;
    confidence: number;
    reasoning: string[];
    alternativeModels: AIModel[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          recommendedModel: 'flux',
          confidence: 50,
          reasoning: ['Default recommendation - no user history available'],
          alternativeModels: ['openai', 'stablediffusion']
        };
      }

      // Get user's generation history
      const { data: userHistory, error } = await supabase
        .from('model_performance_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('success', true)
        .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()) // Last 60 days
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !userHistory || userHistory.length === 0) {
        return {
          recommendedModel: 'flux',
          confidence: 50,
          reasoning: ['Default recommendation - no successful generations found'],
          alternativeModels: ['openai', 'stablediffusion']
        };
      }

      // Analyze user preferences
      const modelPerformance: Record<AIModel, {
        count: number;
        avgRating: number;
        avgTime: number;
        styles: string[];
      }> = {} as any;

      userHistory.forEach(generation => {
        const model = generation.model as AIModel;
        if (!modelPerformance[model]) {
          modelPerformance[model] = {
            count: 0,
            avgRating: 0,
            avgTime: 0,
            styles: []
          };
        }

        modelPerformance[model].count++;
        if (generation.user_rating) {
          modelPerformance[model].avgRating = 
            (modelPerformance[model].avgRating + generation.user_rating) / 2;
        }
        if (generation.generation_time) {
          modelPerformance[model].avgTime = 
            (modelPerformance[model].avgTime + generation.generation_time) / 2;
        }
        if (generation.style && !modelPerformance[model].styles.includes(generation.style)) {
          modelPerformance[model].styles.push(generation.style);
        }
      });

      // Score models based on user history
      const modelScores: Array<{
        model: AIModel;
        score: number;
        reasoning: string[];
      }> = [];

      Object.entries(modelPerformance).forEach(([model, perf]) => {
        let score = 0;
        const reasoning: string[] = [];

        // Usage frequency bonus
        const usageRatio = perf.count / userHistory.length;
        score += usageRatio * 30;
        if (usageRatio > 0.3) {
          reasoning.push(`You frequently use ${model.toUpperCase()} (${Math.round(usageRatio * 100)}% of generations)`);
        }

        // Rating bonus
        if (perf.avgRating > 0) {
          score += perf.avgRating * 10;
          if (perf.avgRating >= 4) {
            reasoning.push(`High satisfaction with ${model.toUpperCase()} (${perf.avgRating.toFixed(1)}/5 rating)`);
          }
        }

        // Style compatibility
        if (style && perf.styles.includes(style)) {
          score += 20;
          reasoning.push(`Good results with ${style} style using ${model.toUpperCase()}`);
        }

        // Speed preference (if user prefers faster models)
        const avgUserTime = Object.values(modelPerformance)
          .reduce((sum, p) => sum + p.avgTime, 0) / Object.keys(modelPerformance).length;
        if (perf.avgTime < avgUserTime) {
          score += 10;
          reasoning.push(`Faster generation times with ${model.toUpperCase()}`);
        }

        modelScores.push({
          model: model as AIModel,
          score,
          reasoning
        });
      });

      // Sort by score
      modelScores.sort((a, b) => b.score - a.score);

      const topModel = modelScores[0];
      const confidence = Math.min(95, Math.max(60, topModel.score));

      return {
        recommendedModel: topModel.model,
        confidence,
        reasoning: topModel.reasoning,
        alternativeModels: modelScores.slice(1, 4).map(m => m.model)
      };
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return {
        recommendedModel: 'flux',
        confidence: 50,
        reasoning: ['Error analyzing user history - using default'],
        alternativeModels: ['openai', 'stablediffusion']
      };
    }
  }

  /**
   * Rate a generated design
   */
  static async rateGeneration(
    generationId: string,
    rating: number,
    feedback?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('model_performance_logs')
        .update({
          user_rating: rating,
          user_feedback: feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', generationId)
        .eq('user_id', user.id);

      return !error;
    } catch (error) {
      console.error('Error rating generation:', error);
      return false;
    }
  }

  /**
   * Get model usage statistics for analytics
   */
  static async getModelUsageStats(): Promise<Record<AIModel, number>> {
    try {
      const { data, error } = await supabase
        .from('model_performance_logs')
        .select('model')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (error || !data) {
        return {} as Record<AIModel, number>;
      }

      const stats: Record<AIModel, number> = {} as any;
      data.forEach(log => {
        const model = log.model as AIModel;
        stats[model] = (stats[model] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting model usage stats:', error);
      return {} as Record<AIModel, number>;
    }
  }
}
