import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatInterface from '@/components/ChatInterface';

const ChatPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* API Key settings removed */}
      </div>
      <ChatInterface />
      <Footer />
    </div>
  );
};

export default ChatPage;
