
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TattooCreator from '@/components/TattooCreator';

const TattooCreationPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center">Create Your Dream Tattoo</h1>
        </div>
        <p className="text-lg text-center mb-8 max-w-3xl mx-auto">
          Design your perfect tattoo using various AI models including Flux, DALL-E, and the new GPT-image-1.
          Select styles, techniques, and customize your preferences.
        </p>
        <TattooCreator />
      </main>
      <Footer />
    </div>
  );
};

export default TattooCreationPage;
