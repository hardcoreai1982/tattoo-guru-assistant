import React from 'react';
import Navbar from '@/components/Navbar';
import DesignGallery from '@/components/DesignGallery';

const DesignGalleryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DesignGallery />
    </div>
  );
};

export default DesignGalleryPage;
