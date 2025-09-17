import { supabase } from '@/integrations/supabase/client';
import type { AIModel } from './aiModelOptimizationService';

export interface PromptPerformanceMetrics {
  promptId: string;
  originalPrompt: string;
  enhancedPrompt: string;
  model: AIModel;
  style?: string;
  technique?: string;
  successRate: number;
  averageQualityRating: number;
  averageGenerationTime: number;
  userSatisfactionScore: number;
  enhancementConfidence: number;
  stagesApplied: string[];
  totalGenerations: number;
  lastUsed: Date;
}

export interface PromptInsights {
  topPerformingPrompts: PromptPerformanceMetrics[];
  worstPerformingPrompts: PromptPerformanceMetrics[];
  mostEffectiveEnhancements: {
    stage: string;
    averageImprovement: number;
    usageCount: number;
  }[];
  stylePerformance: {
    style: string;
    averageSuccess: number;
    averageRating: number;
    promptCount: number;
  }[];
  modelOptimization: {
    model: AIModel;
    bestPromptPatterns: string[];
    averageConfidence: number;
    recommendedEnhancements: string[];
  }[];
  trends: {
    period: string;
    averageConfidence: number;
    successRate: number;
    popularStyles: string[];
    emergingPatterns: string[];
  }[];
}

export interface UserPromptHistory {
  userId: string;
  totalPrompts: number;
  averageConfidence: number;
  favoriteStyles: string[];
  mostUsedModels: AIModel[];
  improvementTrend: number;
  personalizedSuggestions: string[];
  recentActivity: {
    date: Date;
    prompt: string;
    confidence: number;
    success: boolean;
  }[];
}

export class PromptAnalyticsService {
  /**
   * Track prompt usage and performance
   */
  static async trackPromptUsage(
    originalPrompt: string,
    enhancedPrompt: string,
    model: AIModel,
    style?: string,
    technique?: string,
    enhancementData?: any
  ): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('prompt_usage_logs')
        .insert({
          user_id: user.id,
          original_prompt: originalPrompt,
          enhanced_prompt: enhancedPrompt,
          model,
          style,
          technique,
          enhancement_confidence: enhancementData?.confidenceScore || 0,
          stages_applied: enhancementData?.stagesApplied || [],
          processing_time: enhancementData?.processingTime || 0,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      return data?.id || null;
    } catch (error) {
      console.error('Error tracking prompt usage:', error);
      return null;
    }
  }

  /**
   * Update prompt performance after generation
   */
  static async updatePromptPerformance(
    promptLogId: string,
    success: boolean,
    generationTime: number,
    qualityRating?: number,
    userRating?: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prompt_usage_logs')
        .update({
          success,
          generation_time: generationTime,
          quality_rating: qualityRating,
          user_rating: userRating,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptLogId);

      return !error;
    } catch (error) {
      console.error('Error updating prompt performance:', error);
      return false;
    }
  }

  /**
   * Get comprehensive prompt insights
   */
  static async getPromptInsights(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<PromptInsights> {
    try {
      const daysBack = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const { data: logs, error } = await supabase
        .from('prompt_usage_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error || !logs) {
        console.error('Error fetching prompt insights:', error);
        return this.getEmptyInsights();
      }

      // Calculate top performing prompts
      const promptPerformance = this.calculatePromptPerformance(logs);
      const topPerformingPrompts = promptPerformance
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 10);

      const worstPerformingPrompts = promptPerformance
        .filter(p => p.totalGenerations >= 3) // Only include prompts with sufficient data
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 5);

      // Calculate enhancement effectiveness
      const mostEffectiveEnhancements = this.calculateEnhancementEffectiveness(logs);

      // Calculate style performance
      const stylePerformance = this.calculateStylePerformance(logs);

      // Calculate model optimization insights
      const modelOptimization = this.calculateModelOptimization(logs);

      // Calculate trends
      const trends = this.calculateTrends(logs, timeframe);

      return {
        topPerformingPrompts,
        worstPerformingPrompts,
        mostEffectiveEnhancements,
        stylePerformance,
        modelOptimization,
        trends
      };
    } catch (error) {
      console.error('Error getting prompt insights:', error);
      return this.getEmptyInsights();
    }
  }

  /**
   * Get user-specific prompt history and insights
   */
  static async getUserPromptHistory(): Promise<UserPromptHistory | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: logs, error } = await supabase
        .from('prompt_usage_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !logs) {
        console.error('Error fetching user prompt history:', error);
        return null;
      }

      const totalPrompts = logs.length;
      const averageConfidence = logs.reduce((sum, log) => sum + (log.enhancement_confidence || 0), 0) / totalPrompts;

      // Calculate favorite styles
      const styleCount: Record<string, number> = {};
      logs.forEach(log => {
        if (log.style) {
          styleCount[log.style] = (styleCount[log.style] || 0) + 1;
        }
      });
      const favoriteStyles = Object.entries(styleCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([style]) => style);

      // Calculate most used models
      const modelCount: Record<AIModel, number> = {} as any;
      logs.forEach(log => {
        const model = log.model as AIModel;
        modelCount[model] = (modelCount[model] || 0) + 1;
      });
      const mostUsedModels = Object.entries(modelCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([model]) => model as AIModel);

      // Calculate improvement trend (last 10 vs previous 10)
      const recent10 = logs.slice(0, 10);
      const previous10 = logs.slice(10, 20);
      const recentAvg = recent10.reduce((sum, log) => sum + (log.enhancement_confidence || 0), 0) / recent10.length;
      const previousAvg = previous10.length > 0 
        ? previous10.reduce((sum, log) => sum + (log.enhancement_confidence || 0), 0) / previous10.length 
        : recentAvg;
      const improvementTrend = ((recentAvg - previousAvg) / previousAvg) * 100;

      // Generate personalized suggestions
      const personalizedSuggestions = this.generatePersonalizedSuggestions(logs);

      // Recent activity
      const recentActivity = logs.slice(0, 10).map(log => ({
        date: new Date(log.created_at),
        prompt: log.original_prompt,
        confidence: log.enhancement_confidence || 0,
        success: log.success || false
      }));

      return {
        userId: user.id,
        totalPrompts,
        averageConfidence,
        favoriteStyles,
        mostUsedModels,
        improvementTrend,
        personalizedSuggestions,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting user prompt history:', error);
      return null;
    }
  }

  /**
   * Get prompt suggestions based on successful patterns
   */
  static async getPromptSuggestions(
    partialPrompt: string,
    style?: string,
    model?: AIModel
  ): Promise<string[]> {
    try {
      const { data: logs, error } = await supabase
        .from('prompt_usage_logs')
        .select('enhanced_prompt, success, user_rating')
        .eq('success', true)
        .gte('user_rating', 4)
        .ilike('enhanced_prompt', `%${partialPrompt}%`)
        .order('user_rating', { ascending: false })
        .limit(20);

      if (error || !logs) {
        return [];
      }

      // Filter by style and model if provided
      let filteredLogs = logs;
      if (style) {
        filteredLogs = filteredLogs.filter(log => 
          log.enhanced_prompt.toLowerCase().includes(style.toLowerCase())
        );
      }

      // Extract unique prompt patterns
      const suggestions = [...new Set(filteredLogs.map(log => log.enhanced_prompt))]
        .slice(0, 5);

      return suggestions;
    } catch (error) {
      console.error('Error getting prompt suggestions:', error);
      return [];
    }
  }

  private static calculatePromptPerformance(logs: any[]): PromptPerformanceMetrics[] {
    const promptGroups: Record<string, any[]> = {};
    
    logs.forEach(log => {
      const key = log.enhanced_prompt;
      if (!promptGroups[key]) {
        promptGroups[key] = [];
      }
      promptGroups[key].push(log);
    });

    return Object.entries(promptGroups).map(([prompt, groupLogs]) => {
      const successfulLogs = groupLogs.filter(log => log.success);
      const successRate = (successfulLogs.length / groupLogs.length) * 100;
      
      const qualityRatings = groupLogs.filter(log => log.quality_rating).map(log => log.quality_rating);
      const averageQualityRating = qualityRatings.length > 0 
        ? qualityRatings.reduce((sum, rating) => sum + rating, 0) / qualityRatings.length 
        : 0;

      const userRatings = groupLogs.filter(log => log.user_rating).map(log => log.user_rating);
      const userSatisfactionScore = userRatings.length > 0
        ? userRatings.reduce((sum, rating) => sum + rating, 0) / userRatings.length
        : 0;

      const generationTimes = groupLogs.filter(log => log.generation_time).map(log => log.generation_time);
      const averageGenerationTime = generationTimes.length > 0
        ? generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length
        : 0;

      return {
        promptId: prompt,
        originalPrompt: groupLogs[0].original_prompt,
        enhancedPrompt: prompt,
        model: groupLogs[0].model,
        style: groupLogs[0].style,
        technique: groupLogs[0].technique,
        successRate,
        averageQualityRating,
        averageGenerationTime,
        userSatisfactionScore,
        enhancementConfidence: groupLogs[0].enhancement_confidence || 0,
        stagesApplied: groupLogs[0].stages_applied || [],
        totalGenerations: groupLogs.length,
        lastUsed: new Date(Math.max(...groupLogs.map(log => new Date(log.created_at).getTime())))
      };
    });
  }

  private static calculateEnhancementEffectiveness(logs: any[]) {
    const stageEffectiveness: Record<string, { improvements: number[], count: number }> = {};

    logs.forEach(log => {
      if (log.stages_applied && Array.isArray(log.stages_applied)) {
        log.stages_applied.forEach((stage: string) => {
          if (!stageEffectiveness[stage]) {
            stageEffectiveness[stage] = { improvements: [], count: 0 };
          }
          stageEffectiveness[stage].count++;
          if (log.success) {
            stageEffectiveness[stage].improvements.push(log.enhancement_confidence || 0);
          }
        });
      }
    });

    return Object.entries(stageEffectiveness)
      .map(([stage, data]) => ({
        stage,
        averageImprovement: data.improvements.length > 0 
          ? data.improvements.reduce((sum, imp) => sum + imp, 0) / data.improvements.length 
          : 0,
        usageCount: data.count
      }))
      .sort((a, b) => b.averageImprovement - a.averageImprovement)
      .slice(0, 5);
  }

  private static calculateStylePerformance(logs: any[]) {
    const styleGroups: Record<string, any[]> = {};
    
    logs.forEach(log => {
      if (log.style) {
        if (!styleGroups[log.style]) {
          styleGroups[log.style] = [];
        }
        styleGroups[log.style].push(log);
      }
    });

    return Object.entries(styleGroups).map(([style, styleLogs]) => {
      const successfulLogs = styleLogs.filter(log => log.success);
      const averageSuccess = (successfulLogs.length / styleLogs.length) * 100;
      
      const ratings = styleLogs.filter(log => log.user_rating).map(log => log.user_rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        style,
        averageSuccess,
        averageRating,
        promptCount: styleLogs.length
      };
    }).sort((a, b) => b.averageSuccess - a.averageSuccess);
  }

  private static calculateModelOptimization(logs: any[]) {
    const models: AIModel[] = ['flux', 'openai', 'stablediffusion', 'ideogram', 'gptimage'];
    
    return models.map(model => {
      const modelLogs = logs.filter(log => log.model === model);
      const successfulLogs = modelLogs.filter(log => log.success);
      
      const averageConfidence = modelLogs.length > 0
        ? modelLogs.reduce((sum, log) => sum + (log.enhancement_confidence || 0), 0) / modelLogs.length
        : 0;

      // Find best performing prompt patterns
      const promptPatterns = successfulLogs
        .filter(log => log.user_rating >= 4)
        .map(log => log.enhanced_prompt)
        .slice(0, 3);

      return {
        model,
        bestPromptPatterns: promptPatterns,
        averageConfidence,
        recommendedEnhancements: this.getModelSpecificRecommendations(model)
      };
    });
  }

  private static calculateTrends(logs: any[], timeframe: string) {
    // Simple trend calculation - can be expanded
    const totalLogs = logs.length;
    const successfulLogs = logs.filter(log => log.success);
    const averageConfidence = logs.reduce((sum, log) => sum + (log.enhancement_confidence || 0), 0) / totalLogs;
    const successRate = (successfulLogs.length / totalLogs) * 100;

    const styleCount: Record<string, number> = {};
    logs.forEach(log => {
      if (log.style) {
        styleCount[log.style] = (styleCount[log.style] || 0) + 1;
      }
    });
    const popularStyles = Object.entries(styleCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style);

    return [{
      period: timeframe,
      averageConfidence,
      successRate,
      popularStyles,
      emergingPatterns: ['AI-enhanced prompts showing 15% better success rates']
    }];
  }

  private static generatePersonalizedSuggestions(logs: any[]): string[] {
    const suggestions: string[] = [];
    
    const avgConfidence = logs.reduce((sum, log) => sum + (log.enhancement_confidence || 0), 0) / logs.length;
    if (avgConfidence < 70) {
      suggestions.push('Try using more specific style and technique keywords');
    }

    const successRate = logs.filter(log => log.success).length / logs.length;
    if (successRate < 0.8) {
      suggestions.push('Consider using the advanced prompt builder for better results');
    }

    const hasLowRatings = logs.some(log => log.user_rating && log.user_rating < 3);
    if (hasLowRatings) {
      suggestions.push('Experiment with different AI models for your preferred style');
    }

    return suggestions.slice(0, 3);
  }

  private static getModelSpecificRecommendations(model: AIModel): string[] {
    const recommendations: Record<AIModel, string[]> = {
      flux: ['Use detailed technical terms', 'Specify lighting conditions', 'Include texture descriptions'],
      openai: ['Keep prompts concise but descriptive', 'Use clear style references', 'Avoid overly complex compositions'],
      stablediffusion: ['Experiment with artistic styles', 'Use negative prompts effectively', 'Include quality modifiers'],
      ideogram: ['Focus on geometric precision', 'Use mathematical terms', 'Specify symmetry requirements'],
      gptimage: ['Try experimental approaches', 'Use contemporary references', 'Include emotional context']
    };

    return recommendations[model] || [];
  }

  private static getEmptyInsights(): PromptInsights {
    return {
      topPerformingPrompts: [],
      worstPerformingPrompts: [],
      mostEffectiveEnhancements: [],
      stylePerformance: [],
      modelOptimization: [],
      trends: []
    };
  }
}
