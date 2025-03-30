
import React from 'react';
import { Check } from 'lucide-react';

const missions = [
  {
    title: "Educate & Inform",
    description:
      "We provide detailed insights into styles, techniques, ink types, aftercare, and more. Our extensive research database is combined with the latest in AI-driven user interaction.",
  },
  {
    title: "Empower Creators",
    description:
      "Tattoo artists can use Tattoo Buddy as a virtual assistant to test designs, gather professional tips, and explore styles or trends. Our avatar-driven approach helps visualize ideas step by step.",
  },
  {
    title: "Simplify Image Analysis",
    description:
      "Upload sketches or references and get instant feedback. The AI offers suggestions on shading, composition, color contrast, and beyond, all powered by our integrated image-processing technology.",
  },
];

const MissionSection: React.FC = () => {
  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our <span className="gradient-text">Mission</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              We believe everyone deserves expert advice and guidance when it comes to tattoos—whether you're a first-timer deciding on your first piece, a seasoned artist honing your craft, or simply a tattoo collector exploring the latest styles.
            </p>
            
            <div className="space-y-6">
              {missions.map((mission, index) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-tattoo-purple">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold mb-2">{mission.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{mission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="absolute -top-5 -left-5 w-40 h-40 bg-tattoo-purple rounded-full opacity-10 blur-2xl"></div>
              <div className="absolute -bottom-5 -right-5 w-40 h-40 bg-tattoo-accent rounded-full opacity-10 blur-2xl"></div>
              <div className="relative bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 mb-6 flex items-center justify-center">
                  <div className="text-center p-4">
                    <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tattoo Buddy Demo Video</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-tattoo-purple mr-3"></div>
                    <p className="text-gray-700 dark:text-gray-300">Personalized Design Consultations</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-tattoo-purple mr-3"></div>
                    <p className="text-gray-700 dark:text-gray-300">Style-Specific Recommendations</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-tattoo-purple mr-3"></div>
                    <p className="text-gray-700 dark:text-gray-300">Aftercare Guidance</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-tattoo-purple mr-3"></div>
                    <p className="text-gray-700 dark:text-gray-300">Artist Matchmaking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
