
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TattooCreator from '@/components/TattooCreator';

const TattooCreationPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Create Your Dream Tattoo</h1>
        <p className="text-lg text-center mb-8 max-w-3xl mx-auto">
          Design your perfect tattoo by selecting styles, techniques, and customizing your preferences.
        </p>
        <TattooCreator />
      </main>
      <Footer />
    </div>
  );
};

export default TattooCreationPage;
