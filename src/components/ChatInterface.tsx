
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Upload } from 'lucide-react';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hi there! I'm your Tattoo Buddy. What can I help you with today? Whether you're looking for design inspiration, aftercare advice, or information about different tattoo styles, I'm here to assist!",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "That's a great question about tattoo styles! Traditional tattoos feature bold black outlines and a limited color palette, while neo-traditional expands on this with a broader range of colors and more detailed designs. What kind of style are you interested in?",
        "When it comes to tattoo placement, the pain level varies. Areas with thin skin and close to bones (like ribs, spine, ankles) tend to be more painful. Fleshy areas like upper arms or thighs are usually less painful. Have you decided on a placement yet?",
        "For aftercare, keep the tattoo clean and moisturized. Avoid swimming, direct sunlight, and tight clothing on the area for at least 2 weeks. Don't pick at scabs as they form part of the healing process. Would you like more specific aftercare instructions?",
        "Geometric tattoos are a popular choice! They can range from simple shapes to complex sacred geometry. They work well in both black ink or with color accents. Would you like to see some examples of geometric designs?",
      ];
      
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage = {
        type: 'bot',
        content: randomResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-tattoo-purple flex items-center justify-center text-white font-bold">
            TB
          </div>
          <div className="ml-3">
            <h2 className="font-semibold">Tattoo Buddy</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.type === 'user'
                  ? 'bg-tattoo-purple text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <p>{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Upload className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="border-gray-300 dark:border-gray-600 focus:ring-tattoo-purple"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim()} 
            size="icon"
            className="bg-tattoo-purple hover:bg-tattoo-purple/90 flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
