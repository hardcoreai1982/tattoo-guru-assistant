
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Upload, Volume2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { sendMessage, executeToolCall, type Message, type ToolCall } from '@/services/chatService';
import { toast } from 'sonner';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: "Hi there! I'm your Tattoo Buddy. What can I help you with today? Whether you're looking for design inspiration, aftercare advice, or information about different tattoo styles, I'm here to assist!",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to the OpenAI API
      const botResponse = await sendMessage([...messages, userMessage]);
      
      // Process any tool calls
      if (botResponse.toolCalls && botResponse.toolCalls.length > 0) {
        for (const toolCall of botResponse.toolCalls) {
          // Execute each tool call
          const toolResponse = executeToolCall(toolCall);
          
          // Add the tool result if it's not empty
          if (toolResponse) {
            // For demonstration, we'll show the function call and response as separate messages
            const functionMessage: Message = {
              type: 'bot',
              content: `Using "${toolCall.function.name}" to help you...`,
              timestamp: new Date(),
            };
            
            const resultMessage: Message = {
              type: 'bot',
              content: toolResponse,
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, functionMessage, resultMessage]);
            
            // Optionally, you could have an actual AI response after the tool calls
            if (botResponse.content) {
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  type: 'bot',
                  content: botResponse.content || '',
                  timestamp: new Date()
                }]);
              }, 1000);
            }
          }
        }
      } else {
        // If no tool calls, add the bot response directly
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get a response. Please try again.");
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
              <p className="whitespace-pre-line">{message.content}</p>
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
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Upload className="h-5 w-5" />
          </Button>
          <Textarea
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[80px] border-gray-300 dark:border-gray-600 focus:ring-tattoo-purple resize-none"
          />
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isLoading} 
              size="icon"
              className="bg-tattoo-purple hover:bg-tattoo-purple/90 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              title="Read message aloud (coming soon)"
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
