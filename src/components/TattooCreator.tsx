import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wand2, Download, Heart, Share2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const TattooCreator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [style, setStyle] = useState('');
  const [technique, setTechnique] = useState('');
  const [composition, setComposition] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [placement, setPlacement] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [pastGenerations, setPastGenerations] = useState<string[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [aiModel, setAiModel] = useState<'flux' | 'openai' | 'stablediffusion' | 'ideogram' | 'gptimage'>('flux');
  
  useEffect(() => {
    const modeText = isPreviewMode ? 'tattoo on body showing placement' : 'tattoo design for printing';
    const elements = [
      subject && `${subject}`,
      style && `${style} style`,
      technique && `with ${technique} technique`,
      composition && `in a ${composition} composition`,
      colorPalette && `using ${colorPalette} color palette`,
      placement && `for ${placement} placement`,
      isPreviewMode && 'realistic tattoo on actual skin'
    ].filter(Boolean);

    if (elements.length > 0) {
      const newPrompt = `A ${modeText} of ${elements.join(', ')}`;
      setPrompt(newPrompt);
    }
  }, [subject, style, technique, composition, colorPalette, placement, isPreviewMode]);
  
  const generateImage = async (promptText: string) => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-tattoo', {
        body: { 
          prompt: promptText,
          aiModel: aiModel
        }
      });
      
      if (error) {
        toast.error(error.message || 'Failed to generate image');
        console.error('Error generating image:', error);
        return null;
      }
      
      if (data.error) {
        toast.error(data.error);
        console.error('Error from edge function:', data.error);
        return null;
      }
      
      return data.url;
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Error generating image. Please try again later.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt) {
      toast.error('Please enter a description for your tattoo.');
      return;
    }
    
    setIsGenerating(true);
    
    const finalPromptText = [
      prompt,
      isPreviewMode ? 'Show as realistic tattoo on actual skin with proper lighting and texture.' : 'Show as clean design for printing.',
    ].filter(Boolean).join('. ');
    
    setFinalPrompt(finalPromptText);
    
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
    
    try {
      const tattooDetails = {
        subject: subject || 'tattoo',
        style: style || 'traditional',
        technique: technique || 'line work',
        composition: composition || 'balanced',
        colorPalette: colorPalette || 'black and grey',
        placement: placement || 'arm',
        isPreviewMode: isPreviewMode
      };
      
      const { data, error } = await supabase.functions.invoke('analyze-tattoo', {
        body: {
          mode: 'design',
          subject: tattooDetails.subject,
          image: '', // No image to analyze, we're using this function for prompt generation
          enhancePrompt: true, // Flag to indicate we want a prompt enhancement
          details: tattooDetails
        }
      });
      
      if (error || !data || data.error) {
        throw new Error(error?.message || data?.error || 'Failed to generate enhanced prompt');
      }
      
      const enhancedPrompt = data.enhancedPrompt;
      
      if (enhancedPrompt) {
        setPrompt(enhancedPrompt);
        toast.success('Enhanced tattoo prompt created with AI assistance!');
      } else {
        throw new Error('No prompt was generated');
      }
    } catch (error) {
      console.error('Error generating magic prompt:', error);
      toast.error('Failed to enhance prompt. Using basic prompt instead.');
      
      // Fallback to a manually constructed enhanced prompt
      const enhancedPrompt = `A detailed ${style || 'traditional'} tattoo design of ${subject || 'art'} with intricate ${technique || 'line work'}, featuring a ${composition || 'balanced'} composition. Use a ${colorPalette || 'vibrant'} color scheme, designed specifically for ${placement || 'arm'} placement. ${isPreviewMode ? 'Show realistically on skin with proper lighting and depth.' : 'Create clean, printable design with strong outlines and clear details.'}`;
      
      setPrompt(enhancedPrompt);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSave = () => {
    if (generatedImage) {
      toast.success('Design saved to your collection!');
    }
  };
  
  const handleDownload = () => {
    if (generatedImage) {
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
        toast.info('Copy the image to share it with others.');
      }
    }
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-1/3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Design Your Tattoo</CardTitle>
            <CardDescription>
              Customize your preferences and generate your perfect tattoo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-0.5">
                <Label htmlFor="mode-toggle">Mode</Label>
                <div className="text-sm text-muted-foreground">
                  {isPreviewMode ? 'Preview on body' : 'Design for printing'}
                </div>
              </div>
              <Switch
                id="mode-toggle"
                checked={isPreviewMode}
                onCheckedChange={setIsPreviewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Wolf, dragon, flower, etc."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
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
            
            <div className="space-y-2 pt-2">
              <Label htmlFor="model-select">Select AI Model</Label>
              <RadioGroup 
                value={aiModel} 
                onValueChange={(value: 'flux' | 'openai' | 'stablediffusion' | 'ideogram' | 'gptimage') => setAiModel(value)}
                className="flex flex-wrap gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flux" id="flux" />
                  <Label htmlFor="flux" className="cursor-pointer">Flux</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stablediffusion" id="stablediffusion" />
                  <Label htmlFor="stablediffusion" className="cursor-pointer">Stable Diffusion</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ideogram" id="ideogram" />
                  <Label htmlFor="ideogram" className="cursor-pointer">Ideogram</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="openai" id="openai" />
                  <Label htmlFor="openai" className="cursor-pointer">DALL-E</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gptimage" id="gptimage" />
                  <Label htmlFor="gptimage" className="cursor-pointer">GPT-image-1</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button 
              className="w-full bg-tattoo-purple hover:bg-tattoo-purple/90"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Tattoo'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleMagicPrompt}
              disabled={isGenerating}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Magic Prompt
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="w-full lg:w-2/3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Generated Design</CardTitle>
            <CardDescription>
              {generatedImage 
                ? `Your custom tattoo ${isPreviewMode ? 'preview' : 'design'} is ready` 
                : 'Complete the form and generate your design'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center aspect-video bg-muted rounded-lg">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-tattoo-purple mb-4"></div>
                <p className="text-muted-foreground">Generating your tattoo {isPreviewMode ? 'preview' : 'design'}...</p>
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
            
            {generatedImage && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Design Details</p>
                    <p className="text-sm text-muted-foreground">
                      A {style || 'custom'} {isPreviewMode ? 'tattoo preview' : 'tattoo design'} 
                      {subject ? ` of ${subject}` : ''} with {technique || 'mixed'} techniques and 
                      a {composition || 'balanced'} composition.
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
