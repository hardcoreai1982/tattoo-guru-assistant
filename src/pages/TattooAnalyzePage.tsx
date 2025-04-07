
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TattooAnalyzer from '@/components/TattooAnalyzer';

const TattooAnalyzePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center">Tattoo Style & Design Analysis</h1>
          {/* API Key settings removed */}
        </div>
        <p className="text-lg text-center mb-8 max-w-3xl mx-auto">
          Upload your tattoo image and our AI will analyze its style, technique, composition, and more.
        </p>
        <TattooAnalyzer />
      </main>
      <Footer />
    </div>
  );
};

export default TattooAnalyzePage;
