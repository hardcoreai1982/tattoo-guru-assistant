
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeaturesSection from '@/components/FeaturesSection';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const featureDetails = [
  {
    title: "AI Chatbot & Avatar",
    description: "Our intuitive chatbot is personified by an avatar, making interactions more personable and engaging. Whether you need quick tips, in-depth explanations, or simple definitions, the chatbot delivers precise, insightful responses.",
    benefits: [
      "24/7 availability for instant guidance",
      "Personalized responses based on your preferences",
      "Extensive knowledge of tattoo styles and techniques",
      "Interactive conversations that feel natural and helpful"
    ],
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Image Upload & Feedback",
    description: "Got a design in mind? Need to improve an existing piece? Upload an image, and our AI model will analyze it for composition, line quality, and shading. You'll receive actionable recommendations within moments.",
    benefits: [
      "Detailed analysis of line work and composition",
      "Suggestions for improving design balance",
      "Color palette recommendations",
      "Placement advice based on design characteristics"
    ],
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "In-Depth Knowledge Base",
    description: "We've spent countless hours researching tattoo history, cultural significance, modern techniques, and emerging trends. The chatbot references this data to give reliable answers and help you master every step of the process.",
    benefits: [
      "Historical context for different tattoo styles",
      "Cultural significance awareness",
      "Technical information about needles and machines",
      "Comprehensive aftercare guides"
    ],
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Flexible Integration",
    description: "Tattoo Buddy can be embedded on any webpage as a widget or run as a standalone, full-featured page. We believe in meeting users wherever they prefer to engage, ensuring a seamless experience.",
    benefits: [
      "Easy embedding on tattoo artist websites",
      "Mobile-friendly interface",
      "Customizable appearance to match your brand",
      "API access for advanced integrations"
    ],
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=600&q=80"
  }
];

const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-b from-white to-gray-100 dark:from-tattoo-black dark:to-gray-900 pt-20 pb-16 px-6">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">Features</span> & Capabilities
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore the powerful features that make Tattoo Buddy your ultimate companion for tattoo design and education.
            </p>
          </div>
        </div>
        
        <FeaturesSection />
        
        <section className="py-16 px-6 bg-white dark:bg-gray-900">
          <div className="container mx-auto">
            {featureDetails.map((feature, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center mb-20 last:mb-0`}
              >
                <div className="lg:w-1/2">
                  <div className="relative">
                    <div className="absolute -top-5 -left-5 w-40 h-40 bg-tattoo-purple rounded-full opacity-10 blur-2xl"></div>
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="relative rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full h-auto"
                    />
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">{feature.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{feature.description}</p>
                  
                  <h3 className="font-semibold text-lg mb-3">Key Benefits:</h3>
                  <ul className="space-y-3 mb-6">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-tattoo-purple">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <span className="ml-3 text-gray-600 dark:text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <div className="bg-gray-50 dark:bg-gray-800 py-16 px-6">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Experience These Features?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Try out Tattoo Buddy today and discover how our AI-powered assistance can transform your tattoo journey.
            </p>
            <Button className="bg-tattoo-purple hover:bg-tattoo-purple/90 text-white px-8 py-6 text-lg">
              <Link to="/chat">Try AI Chat Now</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
