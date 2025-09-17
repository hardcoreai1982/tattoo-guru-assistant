import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Event emitter for design updates
class DesignEventEmitter extends EventTarget {
  emitDesignCreated(design: GeneratedDesign) {
    this.dispatchEvent(new CustomEvent('designCreated', { detail: design }));
  }

  emitDesignUpdated(design: GeneratedDesign) {
    this.dispatchEvent(new CustomEvent('designUpdated', { detail: design }));
  }

  emitDesignDeleted(designId: string) {
    this.dispatchEvent(new CustomEvent('designDeleted', { detail: { id: designId } }));
  }

  emitAnalysisCreated(analysis: AnalyzedTattoo) {
    this.dispatchEvent(new CustomEvent('analysisCreated', { detail: analysis }));
  }
}

export const designEvents = new DesignEventEmitter();

type GeneratedDesign = Database['public']['Tables']['generated_designs']['Row'];
type GeneratedDesignInsert = Database['public']['Tables']['generated_designs']['Insert'];
type AnalyzedTattoo = Database['public']['Tables']['analyzed_tattoos']['Row'];
type AnalyzedTattooInsert = Database['public']['Tables']['analyzed_tattoos']['Insert'];

export class DesignService {
  /**
   * Save a generated tattoo design
   */
  static async saveGeneratedDesign(
    prompt: string,
    aiModel: string,
    imageUrl: string,
    conversationId?: string,
    designDetails?: {
      style?: string;
      technique?: string;
      colorPalette?: string;
      bodyZone?: string;
      subject?: string;
      theme?: string;
    },
    metadata?: Record<string, any>
  ): Promise<GeneratedDesign | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('User not authenticated, cannot save design');
        return null;
      }

      const designData: GeneratedDesignInsert = {
        user_id: user.id,
        conversation_id: conversationId,
        prompt,
        ai_model: aiModel,
        image_url: imageUrl,
        style: designDetails?.style,
        technique: designDetails?.technique,
        color_palette: designDetails?.colorPalette,
        body_zone: designDetails?.bodyZone,
        subject: designDetails?.subject,
        theme: designDetails?.theme,
        metadata: metadata || {}
      };

      const { data, error } = await supabase
        .from('generated_designs')
        .insert(designData)
        .select()
        .single();

      if (error) {
        console.error('Error saving generated design:', error);
        return null;
      }

      // Emit event for real-time updates
      if (data) {
        designEvents.emitDesignCreated(data);
      }

      return data;
    } catch (error) {
      console.error('Error in saveGeneratedDesign:', error);
      return null;
    }
  }

  /**
   * Get user's generated designs
   */
  static async getUserDesigns(
    limit: number = 50,
    offset: number = 0,
    filters?: {
      style?: string;
      technique?: string;
      aiModel?: string;
      isFavorite?: boolean;
    }
  ): Promise<GeneratedDesign[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      let query = supabase
        .from('generated_designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.style) {
        query = query.eq('style', filters.style);
      }
      if (filters?.technique) {
        query = query.eq('technique', filters.technique);
      }
      if (filters?.aiModel) {
        query = query.eq('ai_model', filters.aiModel);
      }
      if (filters?.isFavorite !== undefined) {
        query = query.eq('is_favorite', filters.isFavorite);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user designs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserDesigns:', error);
      return [];
    }
  }

  /**
   * Toggle favorite status of a design
   */
  static async toggleFavorite(designId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      // First get the current favorite status
      const { data: design, error: fetchError } = await supabase
        .from('generated_designs')
        .select('is_favorite')
        .eq('id', designId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !design) {
        console.error('Error fetching design:', fetchError);
        return false;
      }

      // Toggle the favorite status
      const { error } = await supabase
        .from('generated_designs')
        .update({ is_favorite: !design.is_favorite })
        .eq('id', designId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling favorite:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      return false;
    }
  }

  /**
   * Delete a generated design
   */
  static async deleteDesign(designId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('generated_designs')
        .delete()
        .eq('id', designId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting design:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteDesign:', error);
      return false;
    }
  }

  /**
   * Save an analyzed tattoo
   */
  static async saveAnalyzedTattoo(
    imageUrl: string,
    analysisResult: any,
    analysisMode: 'design' | 'preview' = 'design',
    subject?: string,
    conversationId?: string,
    metadata?: Record<string, any>
  ): Promise<AnalyzedTattoo | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('User not authenticated, cannot save analysis');
        return null;
      }

      const analysisData: AnalyzedTattooInsert = {
        user_id: user.id,
        conversation_id: conversationId,
        image_url: imageUrl,
        analysis_mode: analysisMode,
        subject,
        analysis_result: analysisResult,
        metadata: metadata || {}
      };

      const { data, error } = await supabase
        .from('analyzed_tattoos')
        .insert(analysisData)
        .select()
        .single();

      if (error) {
        console.error('Error saving analyzed tattoo:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in saveAnalyzedTattoo:', error);
      return null;
    }
  }

  /**
   * Get user's analyzed tattoos
   */
  static async getUserAnalyses(
    limit: number = 50,
    offset: number = 0
  ): Promise<AnalyzedTattoo[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('analyzed_tattoos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user analyses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserAnalyses:', error);
      return [];
    }
  }

  /**
   * Search designs by prompt or metadata
   */
  static async searchDesigns(
    query: string,
    limit: number = 20
  ): Promise<GeneratedDesign[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('generated_designs')
        .select('*')
        .eq('user_id', user.id)
        .or(`prompt.ilike.%${query}%,subject.ilike.%${query}%,style.ilike.%${query}%,theme.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching designs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchDesigns:', error);
      return [];
    }
  }

  /**
   * Get design statistics for the user
   */
  static async getDesignStats(): Promise<{
    totalDesigns: number;
    favoriteDesigns: number;
    totalAnalyses: number;
    designsByModel: Record<string, number>;
    designsByStyle: Record<string, number>;
  } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Get total designs and favorites
      const { data: designs, error: designsError } = await supabase
        .from('generated_designs')
        .select('ai_model, style, is_favorite')
        .eq('user_id', user.id);

      if (designsError) {
        console.error('Error fetching design stats:', designsError);
        return null;
      }

      // Get total analyses
      const { count: totalAnalyses, error: analysesError } = await supabase
        .from('analyzed_tattoos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (analysesError) {
        console.error('Error fetching analysis stats:', analysesError);
      }

      const totalDesigns = designs?.length || 0;
      const favoriteDesigns = designs?.filter(d => d.is_favorite).length || 0;

      const designsByModel: Record<string, number> = {};
      const designsByStyle: Record<string, number> = {};

      designs?.forEach(design => {
        if (design.ai_model) {
          designsByModel[design.ai_model] = (designsByModel[design.ai_model] || 0) + 1;
        }
        if (design.style) {
          designsByStyle[design.style] = (designsByStyle[design.style] || 0) + 1;
        }
      });

      return {
        totalDesigns,
        favoriteDesigns,
        totalAnalyses: totalAnalyses || 0,
        designsByModel,
        designsByStyle
      };
    } catch (error) {
      console.error('Error in getDesignStats:', error);
      return null;
    }
  }
}
