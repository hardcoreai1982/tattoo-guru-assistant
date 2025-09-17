import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

export class UserPreferencesService {
  /**
   * Get user preferences, creating default ones if they don't exist
   */
  static async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Try to get existing preferences
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user preferences:', error);
        return null;
      }

      // If no preferences exist, create default ones
      if (!preferences) {
        return await this.createDefaultPreferences();
      }

      return preferences;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return null;
    }
  }

  /**
   * Create default preferences for a user
   */
  static async createDefaultPreferences(): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const defaultPreferences: UserPreferencesInsert = {
        user_id: user.id,
        preferred_ai_model: 'openai',
        voice_chat_enabled: true,
        notifications_enabled: true,
        theme: 'system',
        preferences: {
          autoSaveDesigns: true,
          showTutorials: true,
          defaultImageSize: '1024x1024'
        }
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (error) {
        console.error('Error creating default preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createDefaultPreferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(updates: Partial<UserPreferencesUpdate>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  }

  /**
   * Update preferred AI model
   */
  static async updatePreferredAiModel(aiModel: string): Promise<boolean> {
    return await this.updatePreferences({ preferred_ai_model: aiModel });
  }

  /**
   * Update preferred style
   */
  static async updatePreferredStyle(style: string): Promise<boolean> {
    return await this.updatePreferences({ preferred_style: style });
  }

  /**
   * Update preferred technique
   */
  static async updatePreferredTechnique(technique: string): Promise<boolean> {
    return await this.updatePreferences({ preferred_technique: technique });
  }

  /**
   * Update preferred color palette
   */
  static async updatePreferredColorPalette(colorPalette: string): Promise<boolean> {
    return await this.updatePreferences({ preferred_color_palette: colorPalette });
  }

  /**
   * Toggle voice chat enabled
   */
  static async toggleVoiceChat(): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences) return false;

      return await this.updatePreferences({ 
        voice_chat_enabled: !preferences.voice_chat_enabled 
      });
    } catch (error) {
      console.error('Error in toggleVoiceChat:', error);
      return false;
    }
  }

  /**
   * Toggle notifications enabled
   */
  static async toggleNotifications(): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences) return false;

      return await this.updatePreferences({ 
        notifications_enabled: !preferences.notifications_enabled 
      });
    } catch (error) {
      console.error('Error in toggleNotifications:', error);
      return false;
    }
  }

  /**
   * Update theme
   */
  static async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<boolean> {
    return await this.updatePreferences({ theme });
  }

  /**
   * Update custom preferences object
   */
  static async updateCustomPreferences(customPrefs: Record<string, any>): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences) return false;

      const currentPrefs = preferences.preferences as Record<string, any> || {};
      const updatedPrefs = { ...currentPrefs, ...customPrefs };

      return await this.updatePreferences({ preferences: updatedPrefs });
    } catch (error) {
      console.error('Error in updateCustomPreferences:', error);
      return false;
    }
  }

  /**
   * Get a specific custom preference value
   */
  static async getCustomPreference(key: string): Promise<any> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences || !preferences.preferences) return null;

      const customPrefs = preferences.preferences as Record<string, any>;
      return customPrefs[key] || null;
    } catch (error) {
      console.error('Error in getCustomPreference:', error);
      return null;
    }
  }

  /**
   * Reset preferences to defaults
   */
  static async resetToDefaults(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      // Delete existing preferences
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      // Create new default preferences
      const newPreferences = await this.createDefaultPreferences();
      return !!newPreferences;
    } catch (error) {
      console.error('Error in resetToDefaults:', error);
      return false;
    }
  }

  /**
   * Export user preferences as JSON
   */
  static async exportPreferences(): Promise<string | null> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences) return null;

      // Remove sensitive data before export
      const exportData = {
        preferred_ai_model: preferences.preferred_ai_model,
        preferred_style: preferences.preferred_style,
        preferred_technique: preferences.preferred_technique,
        preferred_color_palette: preferences.preferred_color_palette,
        voice_chat_enabled: preferences.voice_chat_enabled,
        notifications_enabled: preferences.notifications_enabled,
        theme: preferences.theme,
        preferences: preferences.preferences,
        exported_at: new Date().toISOString()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error in exportPreferences:', error);
      return null;
    }
  }

  /**
   * Import user preferences from JSON
   */
  static async importPreferences(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData);
      
      // Validate the imported data structure
      const validKeys = [
        'preferred_ai_model', 'preferred_style', 'preferred_technique',
        'preferred_color_palette', 'voice_chat_enabled', 'notifications_enabled',
        'theme', 'preferences'
      ];

      const updates: Partial<UserPreferencesUpdate> = {};
      
      for (const key of validKeys) {
        if (importData[key] !== undefined) {
          updates[key as keyof UserPreferencesUpdate] = importData[key];
        }
      }

      return await this.updatePreferences(updates);
    } catch (error) {
      console.error('Error in importPreferences:', error);
      return false;
    }
  }
}
