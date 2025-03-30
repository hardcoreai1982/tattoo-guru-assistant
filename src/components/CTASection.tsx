
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <section className="py-20 px-6 bg-tattoo-black text-white">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Tattoo Experience?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            From inspiration to final design, Tattoo Buddy guides you through every step of your tattoo journey with expert advice and AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-tattoo-purple hover:bg-tattoo-purple/90 text-white px-8 py-6 text-lg">
              <Link to="/chat">Try AI Chat Now</Link>
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute left-0 w-full overflow-hidden z-[-1]">
        <svg className="absolute left-0 opacity-10" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="pattern-cta" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pattern-cta)" />
        </svg>
      </div>
    </section>
  );
};

export default CTASection;
