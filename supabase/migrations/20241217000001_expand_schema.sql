-- Expand database schema for Tattoo Guru Assistant
-- Add tables for conversations, generated designs, user preferences, and design history

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table for storing chat and voice interactions
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text_chat', 'voice_chat')),
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create conversation_messages table for storing individual messages
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    audio_url TEXT,
    tool_calls JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create generated_designs table for storing AI-generated tattoo designs
CREATE TABLE IF NOT EXISTS generated_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    ai_model VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    style VARCHAR(100),
    technique VARCHAR(100),
    color_palette VARCHAR(100),
    body_zone VARCHAR(100),
    subject VARCHAR(255),
    theme VARCHAR(255),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create analyzed_tattoos table for storing tattoo analysis results
CREATE TABLE IF NOT EXISTS analyzed_tattoos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    analysis_mode VARCHAR(20) DEFAULT 'design' CHECK (analysis_mode IN ('design', 'preview')),
    subject VARCHAR(255),
    analysis_result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user_preferences table for storing user settings and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    preferred_ai_model VARCHAR(50) DEFAULT 'openai',
    preferred_style VARCHAR(100),
    preferred_technique VARCHAR(100),
    preferred_color_palette VARCHAR(100),
    voice_chat_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Create design_collections table for organizing saved designs
CREATE TABLE IF NOT EXISTS design_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create design_collection_items table for many-to-many relationship
CREATE TABLE IF NOT EXISTS design_collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES design_collections(id) ON DELETE CASCADE,
    design_id UUID REFERENCES generated_designs(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, design_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_generated_designs_user_id ON generated_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_designs_conversation_id ON generated_designs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_generated_designs_created_at ON generated_designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_designs_is_favorite ON generated_designs(is_favorite);
CREATE INDEX IF NOT EXISTS idx_generated_designs_style ON generated_designs(style);

CREATE INDEX IF NOT EXISTS idx_analyzed_tattoos_user_id ON analyzed_tattoos(user_id);
CREATE INDEX IF NOT EXISTS idx_analyzed_tattoos_created_at ON analyzed_tattoos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_design_collections_user_id ON design_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_design_collections_is_public ON design_collections(is_public);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_collections_updated_at BEFORE UPDATE ON design_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzed_tattoos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_collection_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for conversation_messages
CREATE POLICY "Users can view messages from their conversations" ON conversation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON conversation_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- Create RLS policies for generated_designs
CREATE POLICY "Users can view their own designs" ON generated_designs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own designs" ON generated_designs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs" ON generated_designs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs" ON generated_designs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for analyzed_tattoos
CREATE POLICY "Users can view their own analyzed tattoos" ON analyzed_tattoos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyzed tattoos" ON analyzed_tattoos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyzed tattoos" ON analyzed_tattoos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyzed tattoos" ON analyzed_tattoos
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for design_collections
CREATE POLICY "Users can view their own collections and public collections" ON design_collections
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own collections" ON design_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON design_collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON design_collections
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for design_collection_items
CREATE POLICY "Users can view items from accessible collections" ON design_collection_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM design_collections 
            WHERE design_collections.id = design_collection_items.collection_id 
            AND (design_collections.user_id = auth.uid() OR design_collections.is_public = true)
        )
    );

CREATE POLICY "Users can add items to their own collections" ON design_collection_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM design_collections 
            WHERE design_collections.id = design_collection_items.collection_id 
            AND design_collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove items from their own collections" ON design_collection_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM design_collections 
            WHERE design_collections.id = design_collection_items.collection_id 
            AND design_collections.user_id = auth.uid()
        )
    );
