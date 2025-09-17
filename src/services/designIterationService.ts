import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ConversationService } from './conversationService';
import { DesignService } from './designService';

type GeneratedDesign = Database['public']['Tables']['generated_designs']['Row'];
type ConversationMessage = Database['public']['Tables']['conversation_messages']['Row'];

export interface IterationRequest {
  originalDesignId: string;
  feedback: string;
  iterationType: 'refine' | 'style_change' | 'element_modification' | 'color_adjustment' | 'composition_change';
  specificChanges?: {
    style?: string;
    technique?: string;
    colorPalette?: string;
    subject?: string;
    composition?: string;
    placement?: string;
  };
  preserveElements?: string[];
  removeElements?: string[];
  addElements?: string[];
}

export interface IterationHistory {
  designId: string;
  iterationNumber: number;
  parentDesignId?: string;
  feedback: string;
  changes: string[];
  timestamp: Date;
  success: boolean;
}

export interface DesignLineage {
  originalDesign: GeneratedDesign;
  iterations: GeneratedDesign[];
  conversationContext: ConversationMessage[];
  totalIterations: number;
}

export class DesignIterationService {
  /**
   * Create an iteration of an existing design based on user feedback
   */
  static async iterateDesign(request: IterationRequest): Promise<GeneratedDesign | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the original design
      const originalDesign = await this.getDesignById(request.originalDesignId);
      if (!originalDesign) throw new Error('Original design not found');

      // Create conversation context for the iteration
      const conversationId = await this.createIterationConversation(
        originalDesign,
        request.feedback,
        request.iterationType
      );

      // Generate enhanced prompt based on feedback and original design
      const enhancedPrompt = await this.generateIterationPrompt(originalDesign, request);

      // Call the generation API with iteration context
      const response = await supabase.functions.invoke('generate-tattoo', {
        body: {
          prompt: enhancedPrompt,
          ai_model: originalDesign.ai_model,
          style: request.specificChanges?.style || originalDesign.style,
          technique: request.specificChanges?.technique || originalDesign.technique,
          color_palette: request.specificChanges?.colorPalette || originalDesign.color_palette,
          body_zone: request.specificChanges?.placement || originalDesign.body_zone,
          subject: request.specificChanges?.subject || originalDesign.subject,
          composition: request.specificChanges?.composition || originalDesign.composition,
          iteration_context: {
            parent_design_id: originalDesign.id,
            iteration_type: request.iterationType,
            feedback: request.feedback,
            preserve_elements: request.preserveElements,
            remove_elements: request.removeElements,
            add_elements: request.addElements
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate iteration');
      }

      const { image_url } = response.data;

      // Save the iterated design with lineage information
      const iteratedDesign = await DesignService.saveGeneratedDesign(
        enhancedPrompt,
        originalDesign.ai_model,
        image_url,
        conversationId,
        {
          style: request.specificChanges?.style || originalDesign.style,
          technique: request.specificChanges?.technique || originalDesign.technique,
          colorPalette: request.specificChanges?.colorPalette || originalDesign.color_palette,
          bodyZone: request.specificChanges?.placement || originalDesign.body_zone,
          subject: request.specificChanges?.subject || originalDesign.subject,
          theme: originalDesign.theme
        },
        {
          parent_design_id: originalDesign.id,
          iteration_type: request.iterationType,
          iteration_number: await this.getNextIterationNumber(originalDesign.id),
          feedback: request.feedback,
          changes_requested: this.summarizeChanges(request),
          conversation_id: conversationId
        }
      );

      // Record the iteration in conversation
      if (conversationId && iteratedDesign) {
        await ConversationService.addMessage(
          conversationId,
          'assistant',
          `I've created an iteration of your design based on your feedback: "${request.feedback}". Here's the refined version with the requested changes.`,
          {
            design_id: iteratedDesign.id,
            iteration_type: request.iterationType,
            changes_applied: this.summarizeChanges(request)
          }
        );
      }

      return iteratedDesign;
    } catch (error) {
      console.error('Error iterating design:', error);
      return null;
    }
  }

  /**
   * Get the complete lineage of a design (original + all iterations)
   */
  static async getDesignLineage(designId: string): Promise<DesignLineage | null> {
    try {
      // Find the root design (either this design or its parent)
      const design = await this.getDesignById(designId);
      if (!design) return null;

      const rootDesignId = design.metadata?.parent_design_id || designId;
      const originalDesign = await this.getDesignById(rootDesignId);
      if (!originalDesign) return null;

      // Get all iterations of this design
      const { data: iterations, error } = await supabase
        .from('generated_designs')
        .select('*')
        .eq('metadata->>parent_design_id', rootDesignId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get conversation context if available
      const conversationId = originalDesign.conversation_id;
      let conversationContext: ConversationMessage[] = [];
      
      if (conversationId) {
        const conversation = await ConversationService.getConversationWithMessages(conversationId);
        conversationContext = conversation?.messages || [];
      }

      return {
        originalDesign,
        iterations: iterations || [],
        conversationContext,
        totalIterations: (iterations?.length || 0)
      };
    } catch (error) {
      console.error('Error getting design lineage:', error);
      return null;
    }
  }

  /**
   * Get iteration suggestions based on design analysis
   */
  static async getIterationSuggestions(designId: string): Promise<string[]> {
    try {
      const design = await this.getDesignById(designId);
      if (!design) return [];

      // Analyze the design and suggest improvements
      const suggestions = [];

      // Style-based suggestions
      if (design.style) {
        suggestions.push(`Try a different style variation of ${design.style}`);
        suggestions.push(`Add more detail to the ${design.style} elements`);
      }

      // Color-based suggestions
      if (design.color_palette === 'black_and_gray') {
        suggestions.push('Add color accents to key elements');
        suggestions.push('Try a full color version');
      } else {
        suggestions.push('Create a black and gray version');
        suggestions.push('Adjust the color saturation');
      }

      // Composition suggestions
      suggestions.push('Adjust the composition for better flow');
      suggestions.push('Add background elements');
      suggestions.push('Simplify the design for cleaner lines');
      suggestions.push('Add more intricate details');

      // Subject-specific suggestions
      if (design.subject) {
        suggestions.push(`Add complementary elements to the ${design.subject}`);
        suggestions.push(`Change the perspective or angle of the ${design.subject}`);
      }

      return suggestions.slice(0, 6); // Return top 6 suggestions
    } catch (error) {
      console.error('Error getting iteration suggestions:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private static async getDesignById(id: string): Promise<GeneratedDesign | null> {
    const { data, error } = await supabase
      .from('generated_designs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching design:', error);
      return null;
    }

    return data;
  }

  private static async createIterationConversation(
    originalDesign: GeneratedDesign,
    feedback: string,
    iterationType: string
  ): Promise<string | null> {
    const conversation = await ConversationService.createConversation(
      'text_chat',
      `Design Iteration - ${originalDesign.prompt?.substring(0, 50)}...`,
      {
        original_design_id: originalDesign.id,
        iteration_type: iterationType,
        purpose: 'design_iteration'
      }
    );

    if (conversation) {
      // Add initial context message
      await ConversationService.addMessage(
        conversation.id,
        'user',
        `I'd like to iterate on this design: "${originalDesign.prompt}". ${feedback}`,
        {
          design_id: originalDesign.id,
          iteration_request: true
        }
      );
    }

    return conversation?.id || null;
  }

  private static async generateIterationPrompt(
    originalDesign: GeneratedDesign,
    request: IterationRequest
  ): Promise<string> {
    let enhancedPrompt = originalDesign.prompt || '';

    // Add iteration-specific modifications
    switch (request.iterationType) {
      case 'refine':
        enhancedPrompt += ` [REFINED VERSION: ${request.feedback}]`;
        break;
      case 'style_change':
        enhancedPrompt += ` [STYLE CHANGE: ${request.feedback}]`;
        break;
      case 'element_modification':
        enhancedPrompt += ` [MODIFY ELEMENTS: ${request.feedback}]`;
        break;
      case 'color_adjustment':
        enhancedPrompt += ` [COLOR ADJUSTMENT: ${request.feedback}]`;
        break;
      case 'composition_change':
        enhancedPrompt += ` [COMPOSITION CHANGE: ${request.feedback}]`;
        break;
    }

    // Add specific preservation instructions
    if (request.preserveElements?.length) {
      enhancedPrompt += ` [PRESERVE: ${request.preserveElements.join(', ')}]`;
    }

    // Add removal instructions
    if (request.removeElements?.length) {
      enhancedPrompt += ` [REMOVE: ${request.removeElements.join(', ')}]`;
    }

    // Add addition instructions
    if (request.addElements?.length) {
      enhancedPrompt += ` [ADD: ${request.addElements.join(', ')}]`;
    }

    return enhancedPrompt;
  }

  private static async getNextIterationNumber(parentDesignId: string): Promise<number> {
    const { data, error } = await supabase
      .from('generated_designs')
      .select('metadata')
      .eq('metadata->>parent_design_id', parentDesignId);

    if (error || !data) return 1;

    const maxIteration = data.reduce((max, design) => {
      const iterationNum = design.metadata?.iteration_number || 0;
      return Math.max(max, iterationNum);
    }, 0);

    return maxIteration + 1;
  }

  private static summarizeChanges(request: IterationRequest): string[] {
    const changes = [];
    
    if (request.specificChanges?.style) changes.push(`Style: ${request.specificChanges.style}`);
    if (request.specificChanges?.technique) changes.push(`Technique: ${request.specificChanges.technique}`);
    if (request.specificChanges?.colorPalette) changes.push(`Colors: ${request.specificChanges.colorPalette}`);
    if (request.preserveElements?.length) changes.push(`Preserved: ${request.preserveElements.join(', ')}`);
    if (request.removeElements?.length) changes.push(`Removed: ${request.removeElements.join(', ')}`);
    if (request.addElements?.length) changes.push(`Added: ${request.addElements.join(', ')}`);
    
    return changes;
  }
}
