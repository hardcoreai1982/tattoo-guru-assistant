
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-image.png';  // Update this path

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
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="outline" className="border-tattoo-purple text-tattoo-purple hover:bg-tattoo-purple/10 px-8 py-6 text-lg">
                <Link to="/features">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <img 
                src={heroImage} 
                alt="Tattoo Buddy Hero" 
                className="w-full h-auto rounded-xl shadow-xl object-cover"
              />
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
