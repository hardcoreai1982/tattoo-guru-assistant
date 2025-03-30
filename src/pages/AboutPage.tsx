
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TeamSection from '@/components/TeamSection';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-b from-white to-gray-100 dark:from-tattoo-black dark:to-gray-900 pt-20 pb-16 px-6">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="gradient-text">Tattoo Buddy</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your AI-powered companion for all things tattoo-related.
            </p>
          </div>
        </div>
        
        <section className="py-16 px-6 bg-white dark:bg-gray-900">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto prose dark:prose-invert">
              <h2>About Us</h2>
              <p>
                Welcome to <strong>Tattoo Buddy</strong>, your AI-powered companion for all things tattoo-related. 
                Our app unites a passionate team of tattoo enthusiasts and cutting-edge technology to create a 
                platform that guides users from the first spark of inspiration to the final design. We strive to 
                make the tattoo process more educational, interactive, and downright fun.
              </p>
              
              <h2>Our Mission</h2>
              <p>
                We believe everyone deserves expert advice and guidance when it comes to tattoos—whether you're 
                a first-timer deciding on your first piece, a seasoned artist honing your craft, or simply a 
                tattoo collector exploring the latest styles. <strong>Tattoo Buddy</strong> aims to:
              </p>
              
              <h3>1. Educate & Inform</h3>
              <p>
                We provide detailed insights into styles, techniques, ink types, aftercare, and more. We've 
                curated an extensive research database on tattooing and combined it with the latest in AI-driven 
                user interaction.
              </p>
              
              <h3>2. Empower Creators</h3>
              <p>
                Tattoo artists can use <strong>Tattoo Buddy</strong> as a virtual assistant to test designs, 
                gather professional tips, and explore styles or trends. Our avatar-driven approach helps you 
                visualize ideas step by step.
              </p>
              
              <h3>3. Simplify Image Analysis</h3>
              <p>
                Thanks to our integrated <strong>Flux</strong>-based model (or similar cutting-edge image-processing 
                technology), you can upload sketches or references and get instant feedback. The AI offers 
                suggestions on shading, composition, color contrast, and beyond.
              </p>
              
              <h2>Key Features</h2>
              <h3>1. AI Chatbot & Avatar</h3>
              <p>
                Our intuitive chatbot is personified by an avatar, making interactions more personable and engaging. 
                Whether you need quick tips, in-depth explanations, or simple definitions, the chatbot delivers 
                precise, insightful responses.
              </p>
              
              <h3>2. Image Upload & Feedback</h3>
              <p>
                Got a design in mind? Need to improve an existing piece? Upload an image, and our AI model will 
                analyze it for composition, line quality, and shading. You'll receive actionable recommendations 
                within moments.
              </p>
              
              <h3>3. In-Depth Knowledge Base</h3>
              <p>
                We've spent countless hours researching tattoo history, cultural significance, modern techniques, 
                and emerging trends. The chatbot references this data to give reliable answers and help you master 
                every step of the process.
              </p>
              
              <h3>4. Flexible Integration</h3>
              <p>
                <strong>Tattoo Buddy</strong> can be embedded on any webpage as a widget or run as a standalone, 
                full-featured page. We believe in meeting users wherever they prefer to engage, ensuring a 
                seamless experience.
              </p>
              
              <h2>Who We Are</h2>
              <p>
                We are a team of <strong>tattoo artists, developers, and AI enthusiasts</strong> dedicated to 
                pushing the boundaries of what's possible in the tattoo industry. From initial sketches to fully 
                realized masterpieces, we aim to connect creativity with technology—helping transform your vision 
                into ink on skin.
              </p>
              
              <h2>Our Vision</h2>
              <p>
                Moving forward, we see <strong>Tattoo Buddy</strong> evolving into a vibrant hub where creativity 
                thrives and knowledge is shared openly. Whether you're learning how to operate a tattoo machine, 
                exploring intricate color theories, or simply seeking fresh inspiration, <strong>Tattoo Buddy</strong> 
                will keep growing alongside you.
              </p>
              
              <p>
                <strong>Thank you for choosing Tattoo Buddy.</strong> Together, we're making the art of tattooing 
                more accessible, informative, and inspiring for everyone.
              </p>
            </div>
          </div>
        </section>
        
        <TeamSection />
        
        <div className="bg-gray-50 dark:bg-gray-800 py-16 px-6">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Experience Tattoo Buddy Today</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Ready to start your tattoo journey with expert AI guidance? Try out our interactive chat assistant now.
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

export default AboutPage;
