import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Wand2, Download, Heart, Share2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApiKeys } from '@/contexts/ApiKeysContext';

const TattooCreator: React.FC = () => {
  const { apiKeys, isConfigured } = useApiKeys();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [technique, setTechnique] = useState('');
  const [composition, setComposition] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [placement, setPlacement] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [pastGenerations, setPastGenerations] = useState<string[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [aiModel, setAiModel] = useState<'flux' | 'openai' | 'stablediffusion' | 'ideogram'>('flux');
  
  const generateImage = async (promptText: string) => {
    if (!isConfigured) {
      toast.error('Please configure your API keys in settings first.');
      return null;
    }

    if (aiModel === 'flux' && !apiKeys.fluxApiKey) {
      toast.error('Flux API key is not configured. Please add it in settings.');
      return null;
    }

    if (aiModel === 'openai' && !apiKeys.openAiApiKey) {
      toast.error('OpenAI API key is not configured. Please add it in settings.');
      return null;
    }

    if (aiModel === 'stablediffusion' && !apiKeys.stableDiffusionApiKey) {
      toast.error('Stable Diffusion API key is not configured. Please add it in settings.');
      return null;
    }

    if (aiModel === 'ideogram' && !apiKeys.ideogramApiKey) {
      toast.error('Ideogram API key is not configured. Please add it in settings.');
      return null;
    }

    try {
      // Base generation options
      let imageUrl = '';
      
      // Use appropriate API based on selected model
      if (aiModel === 'flux') {
        const response = await fetch('https://api.tryflux.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeys.fluxApiKey}`
          },
          body: JSON.stringify({
            prompt: promptText,
            n: 1,
            size: '1024x1024',
            response_format: 'url'
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate image with Flux API');
        }
        
        const data = await response.json();
        imageUrl = data.data[0].url;
      } 
      else if (aiModel === 'openai') {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeys.openAiApiKey}`
          },
          body: JSON.stringify({
            prompt: promptText,
            n: 1,
            size: '1024x1024',
            response_format: 'url'
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate image with OpenAI DALL-E');
        }
        
        const data = await response.json();
        imageUrl = data.data[0].url;
      }
      else {
        // Fallback to placeholder for other APIs that will be implemented later
        imageUrl = '/placeholder.svg';
        toast.info('Using placeholder image. Implementation for this AI model is coming soon.');
      }
      
      return imageUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Error generating image. Please try again later.');
      return null;
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt) {
      toast.error('Please enter a description for your tattoo.');
      return;
    }
    
    setIsGenerating(true);
    
    // Build the final prompt
    const finalPromptText = [
      prompt,
      style && `Style: ${style}`,
      technique && `Technique: ${technique}`,
      composition && `Composition: ${composition}`,
      colorPalette && `Color Palette: ${colorPalette}`,
      placement && `Placement: ${placement}`,
    ].filter(Boolean).join('. ');
    
    setFinalPrompt(finalPromptText);
    
    // Determine which AI model to use
    // For lettering/text tattoos, use Ideogram
    if (prompt.toLowerCase().includes('letter') || prompt.toLowerCase().includes('text') || prompt.toLowerCase().includes('script')) {
      setAiModel('ideogram');
    } 
    // Otherwise use the default model (Flux)
    else {
      setAiModel('flux');
    }
    
    try {
      const imageUrl = await generateImage(finalPromptText);
      
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setPastGenerations(prev => [imageUrl, ...prev.slice(0, 3)]);
        toast.success('Your tattoo design has been generated!');
      }
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      toast.error('Failed to generate design. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleMagicPrompt = async () => {
    const basePrompt = prompt || 'tattoo';
    setIsGenerating(true);
    
    if (!apiKeys.openAiApiKey) {
      toast.error('OpenAI API key is required for Magic Prompt feature.');
      setIsGenerating(false);
      return;
    }
    
    try {
      // Use OpenAI to enhance the prompt
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a tattoo artist assistant that helps create detailed prompts for tattoo designs. Your task is to enhance the user\'s input into a detailed, descriptive prompt for an AI image generator to create a tattoo design.'
            },
            {
              role: 'user',
              content: `Create a detailed prompt for a tattoo design based on this description: "${basePrompt}". Include details about style, technique, composition, and visual elements. Make it suitable for an AI image generator to create a tattoo design.`
            }
          ],
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate enhanced prompt');
      }
      
      const data = await response.json();
      const enhancedPrompt = data.choices[0].message.content;
      
      setPrompt(enhancedPrompt);
      toast.success('Enhanced prompt created with AI assistance!');
    } catch (error) {
      console.error('Error generating magic prompt:', error);
      toast.error('Failed to enhance prompt. Using basic prompt instead.');
      
      // Fallback to a simple enhancement
      const enhancedPrompt = `A detailed ${style || 'traditional'} tattoo of ${basePrompt} with intricate ${technique || 'line work'}, featuring a ${composition || 'balanced'} composition. Use a ${colorPalette || 'vibrant'} color scheme, designed for ${placement || 'arm'} placement.`;
      
      setPrompt(enhancedPrompt);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSave = () => {
    if (generatedImage) {
      // In a real app, this would save to user's collection in a database
      toast.success('Design saved to your collection!');
    }
  };
  
  const handleDownload = () => {
    if (generatedImage) {
      // Create a temporary anchor element to download the image
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `tattoo-design-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Design downloaded successfully!');
    }
  };
  
  const handleShare = () => {
    if (generatedImage) {
      // In a real app, this would open sharing options
      if (navigator.share) {
        navigator.share({
          title: 'My Tattoo Design',
          text: 'Check out this tattoo design I created!',
          url: generatedImage
        })
          .then(() => toast.success('Shared successfully!'))
          .catch((error) => {
            console.error('Error sharing:', error);
            toast.error('Failed to share. Try downloading and sharing manually.');
          });
      } else {
        // Fallback for browsers that don't support navigator.share
        toast.info('Copy the image to share it with others.');
      }
    }
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Panel - Controls */}
      <div className="w-full lg:w-1/3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Design Your Tattoo</CardTitle>
            <CardDescription>
              Customize your preferences and generate your perfect tattoo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="style">Tattoo Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="neo-traditional">Neo-Traditional</SelectItem>
                  <SelectItem value="realism">Realism</SelectItem>
                  <SelectItem value="watercolor">Watercolor</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                  <SelectItem value="tribal">Tribal</SelectItem>
                  <SelectItem value="geometric">Geometric</SelectItem>
                  <SelectItem value="blackwork">Blackwork</SelectItem>
                  <SelectItem value="fineline">Fine Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="technique">Technique</Label>
              <Select value={technique} onValueChange={setTechnique}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a technique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line-work">Line Work</SelectItem>
                  <SelectItem value="dotwork">Dotwork</SelectItem>
                  <SelectItem value="blackandgrey">Black and Grey</SelectItem>
                  <SelectItem value="colorblending">Color Blending</SelectItem>
                  <SelectItem value="stippling">Stippling</SelectItem>
                  <SelectItem value="whipshading">Whip Shading</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="composition">Composition</Label>
              <Select value={composition} onValueChange={setComposition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select composition style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="symmetrical">Symmetrical</SelectItem>
                  <SelectItem value="asymmetrical">Asymmetrical</SelectItem>
                  <SelectItem value="freeform">Freeform</SelectItem>
                  <SelectItem value="framed">Framed</SelectItem>
                  <SelectItem value="flowing">Flowing</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="colorPalette">Color Palette</Label>
              <Select value={colorPalette} onValueChange={setColorPalette}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blackandgrey">Black and Grey</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="vibrant">Vibrant</SelectItem>
                  <SelectItem value="pastel">Pastel</SelectItem>
                  <SelectItem value="monochromatic">Monochromatic</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="neon">Neon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="placement">Placement</Label>
              <Select value={placement} onValueChange={setPlacement}>
                <SelectTrigger>
                  <SelectValue placeholder="Select placement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arm">Arm</SelectItem>
                  <SelectItem value="forearm">Forearm</SelectItem>
                  <SelectItem value="sleeve">Full Sleeve</SelectItem>
                  <SelectItem value="shoulder">Shoulder</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="chest">Chest</SelectItem>
                  <SelectItem value="leg">Leg</SelectItem>
                  <SelectItem value="thigh">Thigh</SelectItem>
                  <SelectItem value="ribs">Ribs</SelectItem>
                  <SelectItem value="neck">Neck</SelectItem>
                  <SelectItem value="hand">Hand</SelectItem>
                  <SelectItem value="wrist">Wrist</SelectItem>
                  <SelectItem value="ankle">Ankle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 pt-4">
              <Label htmlFor="prompt">Describe Your Tattoo</Label>
              <Textarea 
                id="prompt"
                placeholder="Describe what you want in your tattoo design..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific about subjects, elements, mood, and any symbolism you want to include.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button 
              className="w-full bg-tattoo-purple hover:bg-tattoo-purple/90"
              onClick={handleGenerate}
              disabled={isGenerating || !isConfigured}
            >
              {isGenerating ? 'Generating...' : 'Generate Tattoo'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleMagicPrompt}
              disabled={isGenerating || !apiKeys.openAiApiKey}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Magic Prompt
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right Panel - Results */}
      <div className="w-full lg:w-2/3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Generated Design</CardTitle>
            <CardDescription>
              {generatedImage 
                ? 'Your custom tattoo design is ready' 
                : 'Complete the form and generate your design'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Generated Image */}
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center aspect-video bg-muted rounded-lg">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-tattoo-purple mb-4"></div>
                <p className="text-muted-foreground">Generating your tattoo design...</p>
              </div>
            ) : generatedImage ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                <img 
                  src={generatedImage} 
                  alt="Generated tattoo design" 
                  className="w-full h-full object-contain"
                />
                
                <div className="absolute bottom-3 right-3 flex space-x-2">
                  <Button size="sm" variant="secondary" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleSave}>
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center aspect-video bg-muted rounded-lg">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No design generated yet</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
                  Fill out the form on the left and click "Generate Tattoo" to create your custom design.
                </p>
              </div>
            )}
            
            {/* Past Generations */}
            {pastGenerations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Previous Generations</p>
                <div className="grid grid-cols-4 gap-3">
                  {pastGenerations.map((img, index) => (
                    <div 
                      key={index} 
                      className="aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setGeneratedImage(img)}
                    >
                      <img 
                        src={img} 
                        alt={`Previous design ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Design Description */}
            {generatedImage && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Design Details</p>
                    <p className="text-sm text-muted-foreground">
                      A {style || 'custom'} tattoo design with {technique || 'mixed'} techniques and a {composition || 'balanced'} composition.
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Prompt Used</p>
                    <p className="text-sm bg-muted p-3 rounded-md">{finalPrompt}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TattooCreator;
