
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatInterface from '@/components/ChatInterface';
import ApiKeySettings from '@/components/ApiKeySettings';
import { ApiKeysProvider } from '@/contexts/ApiKeysContext';

const ChatPage: React.FC = () => {
  return (
    <ApiKeysProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-6 flex justify-end">
          <ApiKeySettings />
        </div>
        <ChatInterface />
        <Footer />
      </div>
    </ApiKeysProvider>
  );
};

export default ChatPage;
