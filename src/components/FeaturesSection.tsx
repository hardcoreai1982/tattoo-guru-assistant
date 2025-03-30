
import React from 'react';
import { MessageSquare, Image, BookOpen, Layout } from 'lucide-react';

const features = [
  {
    icon: <MessageSquare className="h-10 w-10 text-tattoo-purple" />,
    title: "AI Chatbot & Avatar",
    description:
      "Our intuitive chatbot makes interactions more engaging and personable. Get quick tips, in-depth explanations, or simple definitions with precise, insightful responses.",
  },
  {
    icon: <Image className="h-10 w-10 text-tattoo-purple" />,
    title: "Image Upload & Feedback",
    description:
      "Upload a design and our AI will analyze it for composition, line quality, and shading. Receive actionable recommendations within moments.",
  },
  {
    icon: <BookOpen className="h-10 w-10 text-tattoo-purple" />,
    title: "In-Depth Knowledge Base",
    description:
      "Access our extensive research on tattoo history, cultural significance, modern techniques, and emerging trends. Get reliable answers for every step of the process.",
  },
  {
    icon: <Layout className="h-10 w-10 text-tattoo-purple" />,
    title: "Flexible Integration",
    description:
      "Tattoo Buddy can be embedded on any webpage as a widget or run as a standalone page. We meet users wherever they prefer to engage.",
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 px-6 bg-white dark:bg-gray-900">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tattoo Buddy combines cutting-edge AI technology with expert tattoo knowledge
            to create a comprehensive platform for tattoo enthusiasts and artists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
