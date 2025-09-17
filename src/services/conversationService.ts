import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
type ConversationMessage = Database['public']['Tables']['conversation_messages']['Row'];
type ConversationMessageInsert = Database['public']['Tables']['conversation_messages']['Insert'];

export interface ConversationWithMessages extends Conversation {
  messages?: ConversationMessage[];
}

export class ConversationService {
  /**
   * Create a new conversation
   */
  static async createConversation(
    type: 'text_chat' | 'voice_chat',
    title?: string,
    metadata?: Record<string, any>
  ): Promise<Conversation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const conversationData: ConversationInsert = {
        user_id: user.id,
        type,
        title: title || `${type === 'voice_chat' ? 'Voice' : 'Text'} Chat - ${new Date().toLocaleDateString()}`,
        metadata: metadata || {}
      };

      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createConversation:', error);
      return null;
    }
  }

  /**
   * Get conversations for the current user
   */
  static async getUserConversations(
    type?: 'text_chat' | 'voice_chat',
    limit: number = 50
  ): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }

  /**
   * Get a specific conversation with its messages
   */
  static async getConversationWithMessages(conversationId: string): Promise<ConversationWithMessages | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (conversationError || !conversation) {
        console.error('Error fetching conversation:', conversationError);
        return null;
      }

      // Get messages
      const { data: messages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return conversation;
      }

      return {
        ...conversation,
        messages: messages || []
      };
    } catch (error) {
      console.error('Error in getConversationWithMessages:', error);
      return null;
    }
  }

  /**
   * Add a message to a conversation
   */
  static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    audioUrl?: string,
    toolCalls?: any,
    metadata?: Record<string, any>
  ): Promise<ConversationMessage | null> {
    try {
      const messageData: ConversationMessageInsert = {
        conversation_id: conversationId,
        role,
        content,
        audio_url: audioUrl,
        tool_calls: toolCalls,
        metadata: metadata || {}
      };

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error in addMessage:', error);
      return null;
    }
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating conversation title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConversationTitle:', error);
      return false;
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      return false;
    }
  }

  /**
   * Generate a smart title for a conversation based on its messages
   */
  static generateConversationTitle(messages: ConversationMessage[]): string {
    if (messages.length === 0) {
      return 'New Conversation';
    }

    // Find the first user message
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    
    if (!firstUserMessage) {
      return 'New Conversation';
    }

    // Extract key tattoo-related terms for a smart title
    const content = firstUserMessage.content.toLowerCase();
    const tattooKeywords = [
      'dragon', 'rose', 'skull', 'butterfly', 'lion', 'eagle', 'wolf', 'snake',
      'traditional', 'realistic', 'watercolor', 'geometric', 'tribal', 'minimalist',
      'arm', 'leg', 'back', 'chest', 'shoulder', 'wrist', 'ankle'
    ];

    const foundKeywords = tattooKeywords.filter(keyword => content.includes(keyword));
    
    if (foundKeywords.length > 0) {
      const primaryKeyword = foundKeywords[0];
      return `${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Tattoo Discussion`;
    }

    // Fallback to first few words
    const words = firstUserMessage.content.split(' ').slice(0, 4);
    const title = words.join(' ');
    
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  /**
   * Search conversations by content
   */
  static async searchConversations(query: string, limit: number = 20): Promise<ConversationWithMessages[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      // Search in conversation titles and message content
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_messages (*)
        `)
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching conversations:', error);
        return [];
      }

      // Also search in message content
      const { data: messageMatches, error: messageError } = await supabase
        .from('conversation_messages')
        .select(`
          *,
          conversations!inner (*)
        `)
        .textSearch('content', query)
        .limit(limit);

      if (messageError) {
        console.error('Error searching messages:', messageError);
      }

      // Combine and deduplicate results
      const allResults = [...(conversations || [])];
      
      if (messageMatches) {
        messageMatches.forEach(match => {
          const conversation = (match as any).conversations;
          if (!allResults.find(c => c.id === conversation.id)) {
            allResults.push({
              ...conversation,
              messages: [match]
            });
          }
        });
      }

      return allResults as ConversationWithMessages[];
    } catch (error) {
      console.error('Error in searchConversations:', error);
      return [];
    }
  }
}
