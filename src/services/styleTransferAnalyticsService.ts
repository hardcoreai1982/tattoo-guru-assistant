import { supabase } from '@/integrations/supabase/client';
import type { StyleTransferResult } from './styleTransferService';

export interface StyleTransferMetrics {
  transferId: string;
  fromStyle: string;
  toStyle: string;
  confidence: number;
  compatibilityScore: number;
  estimatedQuality: number;
  userRating?: number;
  actualQuality?: number;
  successRate: number;
  averageRating: number;
  totalTransfers: number;
  lastUsed: Date;
}

export interface StyleTransferInsights {
  popularTransfers: {
    fromStyle: string;
    toStyle: string;
    count: number;
    averageRating: number;
    successRate: number;
  }[];
  styleCompatibilityMatrix: {
    [fromStyle: string]: {
      [toStyle: string]: {
        compatibility: number;
        averageRating: number;
        transferCount: number;
      };
    };
  };
  userPreferences: {
    favoriteSourceStyles: string[];
    favoriteTargetStyles: string[];
    averageTransferRating: number;
    mostSuccessfulTransfers: string[];
  };
  qualityTrends: {
    period: string;
    averageConfidence: number;
    averageUserRating: number;
    transferVolume: number;
    topPerformingPairs: string[];
  }[];
  recommendations: {
    suggestedTransfers: string[];
    avoidedCombinations: string[];
    qualityImprovements: string[];
  };
}

export class StyleTransferAnalyticsService {
  /**
   * Track a style transfer operation
   */
  static async trackStyleTransfer(
    result: StyleTransferResult,
    generationSuccess?: boolean,
    actualQuality?: number
  ): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('style_transfer_logs')
        .insert({
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
          suggestions: result.suggestions,
          generation_success: generationSuccess,
          actual_quality: actualQuality,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      return data?.id || null;
    } catch (error) {
      console.error('Error tracking style transfer:', error);
      return null;
    }
  }

  /**
   * Update style transfer with user feedback
   */
  static async updateTransferFeedback(
    transferId: string,
    userRating: number,
    feedback?: string,
    actualQuality?: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('style_transfer_logs')
        .update({
          user_rating: userRating,
          user_feedback: feedback,
          actual_quality: actualQuality,
          updated_at: new Date().toISOString()
        })
        .eq('id', transferId);

      return !error;
    } catch (error) {
      console.error('Error updating transfer feedback:', error);
      return false;
    }
  }

  /**
   * Get comprehensive style transfer insights
   */
  static async getStyleTransferInsights(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<StyleTransferInsights> {
    try {
      const daysBack = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const { data: logs, error } = await supabase
        .from('style_transfer_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error || !logs) {
        console.error('Error fetching style transfer insights:', error);
        return this.getEmptyInsights();
      }

      // Calculate popular transfers
      const transferCounts: Record<string, any> = {};
      logs.forEach(log => {
        const key = `${log.from_style}->${log.to_style}`;
        if (!transferCounts[key]) {
          transferCounts[key] = {
            fromStyle: log.from_style,
            toStyle: log.to_style,
            count: 0,
            ratings: [],
            successes: 0
          };
        }
        transferCounts[key].count++;
        if (log.user_rating) transferCounts[key].ratings.push(log.user_rating);
        if (log.generation_success) transferCounts[key].successes++;
      });

      const popularTransfers = Object.values(transferCounts)
        .map((transfer: any) => ({
          fromStyle: transfer.fromStyle,
          toStyle: transfer.toStyle,
          count: transfer.count,
          averageRating: transfer.ratings.length > 0 
            ? transfer.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / transfer.ratings.length 
            : 0,
          successRate: (transfer.successes / transfer.count) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Build compatibility matrix
      const styleCompatibilityMatrix = this.buildCompatibilityMatrix(logs);

      // Calculate user preferences
      const userPreferences = await this.calculateUserPreferences();

      // Calculate quality trends
      const qualityTrends = this.calculateQualityTrends(logs, timeframe);

      // Generate recommendations
      const recommendations = this.generateRecommendations(logs, popularTransfers);

      return {
        popularTransfers,
        styleCompatibilityMatrix,
        userPreferences,
        qualityTrends,
        recommendations
      };
    } catch (error) {
      console.error('Error getting style transfer insights:', error);
      return this.getEmptyInsights();
    }
  }

  /**
   * Get style transfer success rates by combination
   */
  static async getTransferSuccessRates(): Promise<Record<string, { successRate: number; sampleSize: number }>> {
    try {
      const { data: logs, error } = await supabase
        .from('style_transfer_logs')
        .select('from_style, to_style, generation_success')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error || !logs) return {};

      const successRates: Record<string, { successes: number; total: number }> = {};
      
      logs.forEach(log => {
        const key = `${log.from_style}->${log.to_style}`;
        if (!successRates[key]) {
          successRates[key] = { successes: 0, total: 0 };
        }
        successRates[key].total++;
        if (log.generation_success) {
          successRates[key].successes++;
        }
      });

      const result: Record<string, { successRate: number; sampleSize: number }> = {};
      Object.entries(successRates).forEach(([key, data]) => {
        result[key] = {
          successRate: (data.successes / data.total) * 100,
          sampleSize: data.total
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting transfer success rates:', error);
      return {};
    }
  }

  /**
   * Get recommended style transfers for a user
   */
  static async getPersonalizedTransferRecommendations(
    currentStyle: string,
    userPreferences?: any
  ): Promise<{
    recommended: string[];
    reasons: Record<string, string>;
    confidence: Record<string, number>;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return this.getDefaultRecommendations(currentStyle);
      }

      // Get user's transfer history
      const { data: userHistory, error } = await supabase
        .from('style_transfer_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !userHistory || userHistory.length === 0) {
        return this.getDefaultRecommendations(currentStyle);
      }

      // Analyze user preferences
      const stylePreferences: Record<string, { count: number; avgRating: number; ratings: number[] }> = {};
      userHistory.forEach(log => {
        if (!stylePreferences[log.to_style]) {
          stylePreferences[log.to_style] = { count: 0, avgRating: 0, ratings: [] };
        }
        stylePreferences[log.to_style].count++;
        if (log.user_rating) {
          stylePreferences[log.to_style].ratings.push(log.user_rating);
        }
      });

      // Calculate average ratings
      Object.values(stylePreferences).forEach(pref => {
        if (pref.ratings.length > 0) {
          pref.avgRating = pref.ratings.reduce((sum, rating) => sum + rating, 0) / pref.ratings.length;
        }
      });

      // Generate recommendations based on preferences
      const recommended: string[] = [];
      const reasons: Record<string, string> = {};
      const confidence: Record<string, number> = {};

      // Recommend styles user has rated highly
      Object.entries(stylePreferences)
        .filter(([style, pref]) => style !== currentStyle && pref.avgRating >= 4)
        .sort(([,a], [,b]) => b.avgRating - a.avgRating)
        .slice(0, 3)
        .forEach(([style, pref]) => {
          recommended.push(style);
          reasons[style] = `You've rated ${style} transfers highly (${pref.avgRating.toFixed(1)}/5)`;
          confidence[style] = Math.min(95, 60 + (pref.avgRating * 10));
        });

      // Add popular combinations if not enough recommendations
      if (recommended.length < 3) {
        const popularCombos = await this.getPopularCombinations(currentStyle);
        popularCombos.forEach(combo => {
          if (!recommended.includes(combo.toStyle) && recommended.length < 3) {
            recommended.push(combo.toStyle);
            reasons[combo.toStyle] = `Popular combination with ${combo.successRate.toFixed(0)}% success rate`;
            confidence[combo.toStyle] = Math.min(90, combo.successRate);
          }
        });
      }

      return { recommended, reasons, confidence };
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return this.getDefaultRecommendations(currentStyle);
    }
  }

  private static buildCompatibilityMatrix(logs: any[]) {
    const matrix: any = {};
    
    logs.forEach(log => {
      if (!matrix[log.from_style]) {
        matrix[log.from_style] = {};
      }
      if (!matrix[log.from_style][log.to_style]) {
        matrix[log.from_style][log.to_style] = {
          compatibility: 0,
          ratings: [],
          transferCount: 0
        };
      }
      
      matrix[log.from_style][log.to_style].transferCount++;
      matrix[log.from_style][log.to_style].compatibility = log.compatibility_score;
      if (log.user_rating) {
        matrix[log.from_style][log.to_style].ratings.push(log.user_rating);
      }
    });

    // Calculate average ratings
    Object.values(matrix).forEach((fromStyle: any) => {
      Object.values(fromStyle).forEach((toStyle: any) => {
        if (toStyle.ratings.length > 0) {
          toStyle.averageRating = toStyle.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / toStyle.ratings.length;
        } else {
          toStyle.averageRating = 0;
        }
        delete toStyle.ratings; // Clean up
      });
    });

    return matrix;
  }

  private static async calculateUserPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          favoriteSourceStyles: [],
          favoriteTargetStyles: [],
          averageTransferRating: 0,
          mostSuccessfulTransfers: []
        };
      }

      const { data: userLogs, error } = await supabase
        .from('style_transfer_logs')
        .select('*')
        .eq('user_id', user.id);

      if (error || !userLogs) {
        return {
          favoriteSourceStyles: [],
          favoriteTargetStyles: [],
          averageTransferRating: 0,
          mostSuccessfulTransfers: []
        };
      }

      // Calculate preferences
      const sourceStyleCounts: Record<string, number> = {};
      const targetStyleCounts: Record<string, number> = {};
      const ratings: number[] = [];
      const successfulTransfers: string[] = [];

      userLogs.forEach(log => {
        sourceStyleCounts[log.from_style] = (sourceStyleCounts[log.from_style] || 0) + 1;
        targetStyleCounts[log.to_style] = (targetStyleCounts[log.to_style] || 0) + 1;
        
        if (log.user_rating) ratings.push(log.user_rating);
        if (log.generation_success && log.user_rating >= 4) {
          successfulTransfers.push(`${log.from_style} → ${log.to_style}`);
        }
      });

      const favoriteSourceStyles = Object.entries(sourceStyleCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([style]) => style);

      const favoriteTargetStyles = Object.entries(targetStyleCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([style]) => style);

      const averageTransferRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        favoriteSourceStyles,
        favoriteTargetStyles,
        averageTransferRating,
        mostSuccessfulTransfers: [...new Set(successfulTransfers)].slice(0, 5)
      };
    } catch (error) {
      console.error('Error calculating user preferences:', error);
      return {
        favoriteSourceStyles: [],
        favoriteTargetStyles: [],
        averageTransferRating: 0,
        mostSuccessfulTransfers: []
      };
    }
  }

  private static calculateQualityTrends(logs: any[], timeframe: string) {
    const totalLogs = logs.length;
    const ratingsLogs = logs.filter(log => log.user_rating);
    const averageConfidence = logs.reduce((sum, log) => sum + (log.confidence || 0), 0) / totalLogs;
    const averageUserRating = ratingsLogs.length > 0 
      ? ratingsLogs.reduce((sum, log) => sum + log.user_rating, 0) / ratingsLogs.length 
      : 0;

    // Find top performing pairs
    const pairPerformance: Record<string, { count: number; avgRating: number }> = {};
    logs.forEach(log => {
      const pair = `${log.from_style} → ${log.to_style}`;
      if (!pairPerformance[pair]) {
        pairPerformance[pair] = { count: 0, avgRating: 0 };
      }
      pairPerformance[pair].count++;
      if (log.user_rating) {
        pairPerformance[pair].avgRating = 
          (pairPerformance[pair].avgRating + log.user_rating) / 2;
      }
    });

    const topPerformingPairs = Object.entries(pairPerformance)
      .filter(([, data]) => data.count >= 3) // Minimum sample size
      .sort(([,a], [,b]) => b.avgRating - a.avgRating)
      .slice(0, 3)
      .map(([pair]) => pair);

    return [{
      period: timeframe,
      averageConfidence,
      averageUserRating,
      transferVolume: totalLogs,
      topPerformingPairs
    }];
  }

  private static generateRecommendations(logs: any[], popularTransfers: any[]) {
    const suggestedTransfers: string[] = [];
    const avoidedCombinations: string[] = [];
    const qualityImprovements: string[] = [];

    // Suggest popular high-rated transfers
    popularTransfers
      .filter(transfer => transfer.averageRating >= 4 && transfer.successRate >= 80)
      .slice(0, 3)
      .forEach(transfer => {
        suggestedTransfers.push(`${transfer.fromStyle} → ${transfer.toStyle}`);
      });

    // Identify combinations to avoid
    popularTransfers
      .filter(transfer => transfer.averageRating < 3 || transfer.successRate < 50)
      .slice(0, 2)
      .forEach(transfer => {
        avoidedCombinations.push(`${transfer.fromStyle} → ${transfer.toStyle}`);
      });

    // General quality improvements
    const avgConfidence = logs.reduce((sum, log) => sum + (log.confidence || 0), 0) / logs.length;
    if (avgConfidence < 70) {
      qualityImprovements.push('Consider using more detailed prompts for better transfer results');
    }

    const avgRating = logs.filter(log => log.user_rating)
      .reduce((sum, log) => sum + log.user_rating, 0) / logs.filter(log => log.user_rating).length;
    if (avgRating < 3.5) {
      qualityImprovements.push('Try preserving more elements during transfer for better results');
    }

    return {
      suggestedTransfers,
      avoidedCombinations,
      qualityImprovements
    };
  }

  private static getDefaultRecommendations(currentStyle: string) {
    const defaultRecommendations: Record<string, string[]> = {
      traditional: ['realistic', 'neo-traditional', 'blackwork'],
      realistic: ['traditional', 'watercolor', 'geometric'],
      geometric: ['minimalist', 'blackwork', 'traditional'],
      watercolor: ['realistic', 'traditional', 'minimalist'],
      minimalist: ['geometric', 'blackwork', 'traditional'],
      blackwork: ['traditional', 'geometric', 'minimalist']
    };

    const recommended = defaultRecommendations[currentStyle] || ['traditional', 'realistic', 'geometric'];
    const reasons: Record<string, string> = {};
    const confidence: Record<string, number> = {};

    recommended.forEach(style => {
      reasons[style] = 'Popular combination based on community data';
      confidence[style] = 75;
    });

    return { recommended, reasons, confidence };
  }

  private static async getPopularCombinations(fromStyle: string) {
    const { data: logs, error } = await supabase
      .from('style_transfer_logs')
      .select('to_style, generation_success')
      .eq('from_style', fromStyle)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !logs) return [];

    const combinations: Record<string, { total: number; successes: number }> = {};
    logs.forEach(log => {
      if (!combinations[log.to_style]) {
        combinations[log.to_style] = { total: 0, successes: 0 };
      }
      combinations[log.to_style].total++;
      if (log.generation_success) {
        combinations[log.to_style].successes++;
      }
    });

    return Object.entries(combinations)
      .map(([toStyle, data]) => ({
        toStyle,
        successRate: (data.successes / data.total) * 100,
        count: data.total
      }))
      .filter(combo => combo.count >= 3)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  }

  private static getEmptyInsights(): StyleTransferInsights {
    return {
      popularTransfers: [],
      styleCompatibilityMatrix: {},
      userPreferences: {
        favoriteSourceStyles: [],
        favoriteTargetStyles: [],
        averageTransferRating: 0,
        mostSuccessfulTransfers: []
      },
      qualityTrends: [],
      recommendations: {
        suggestedTransfers: [],
        avoidedCombinations: [],
        qualityImprovements: []
      }
    };
  }
}
