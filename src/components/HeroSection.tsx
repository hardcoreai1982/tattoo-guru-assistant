
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-b from-white to-gray-100 dark:from-tattoo-black dark:to-gray-900 pt-20 pb-32 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your AI-Powered 
              <span className="gradient-text block"> Tattoo Assistant</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
              From inspiration to final design, Tattoo Buddy guides you through the entire tattoo journey with expert advice and AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-tattoo-purple hover:bg-tattoo-purple/90 text-white px-8 py-6 text-lg">
                <Link to="/chat">Try AI Chat</Link>
              </Button>
              <Button variant="outline" className="border-tattoo-purple text-tattoo-purple hover:bg-tattoo-purple/10 px-8 py-6 text-lg">
                <Link to="/features">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-tattoo-purple rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-tattoo-accent rounded-full opacity-20 blur-3xl"></div>
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-tattoo-purple flex items-center justify-center text-white font-bold">
                      TB
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">Tattoo Buddy</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p className="text-sm">Hi there! I'm your Tattoo Buddy. What kind of tattoo are you thinking about getting?</p>
                  </div>
                </div>
                <div className="p-3 mb-4 bg-tattoo-purple bg-opacity-10 rounded-lg ml-auto max-w-[80%]">
                  <p className="text-sm">I'm looking for a small geometric design for my forearm.</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p className="text-sm">Great choice! Geometric designs work well on forearms. Would you like to see some examples or get advice on sizing and placement?</p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="w-full p-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-tattoo-purple"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tattoo-purple">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1]">
        <svg className="absolute top-0 left-0 opacity-5" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pattern)" />
        </svg>
      </div>
    </div>
  );
};

export default HeroSection;
