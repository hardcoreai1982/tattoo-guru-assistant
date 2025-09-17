import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { RealtimeChatInterface } from '@/components/realtime/RealtimeChatInterface';
import type { HandoffPayload } from '@/lib/realtime/types';

const VoiceChatPage: React.FC = () => {
  // This would be replaced with actual API key management
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const handleTattooGenerate = async (payload: HandoffPayload) => {
    try {
      console.log('Generating tattoo with payload:', payload);
      
      // This would integrate with your existing tattoo generation system
      // For now, we'll just log the payload
      
      // Example integration with existing generate-tattoo function:
      /*
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Create a ${payload.keywords.style || 'traditional'} tattoo featuring ${payload.keywords.subject}${
            payload.keywords.theme ? ` with ${payload.keywords.theme} theme` : ''
          }${
            payload.keywords.color_palette ? ` using ${payload.keywords.color_palette} colors` : ''
          }${
            payload.keywords.technique ? ` with ${payload.keywords.technique} technique` : ''
          }`,
          model: payload.model_choice,
          style: payload.keywords.style,
          bodyZone: payload.keywords.body_zone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tattoo');
      }

      const result = await response.json();
      console.log('Tattoo generated successfully:', result);
      */
      
    } catch (error) {
      console.error('Failed to generate tattoo:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Voice Tattoo Design Chat
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Describe your tattoo ideas naturally using voice. Our AI will understand your vision 
              and automatically extract design elements to create your perfect tattoo.
            </p>
          </div>

          <RealtimeChatInterface 
            apiKey={apiKey}
            onTattooGenerate={handleTattooGenerate}
          />

          <div className="mt-8 p-6 bg-muted/50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">🎤</div>
                <h3 className="font-medium mb-1">Speak Naturally</h3>
                <p className="text-muted-foreground">
                  Describe your tattoo ideas in your own words. No special commands needed.
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🧠</div>
                <h3 className="font-medium mb-1">AI Understanding</h3>
                <p className="text-muted-foreground">
                  Our AI extracts style, subject, colors, and placement from your description.
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">✨</div>
                <h3 className="font-medium mb-1">Instant Generation</h3>
                <p className="text-muted-foreground">
                  Your design specifications are sent to our generation system automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VoiceChatPage;