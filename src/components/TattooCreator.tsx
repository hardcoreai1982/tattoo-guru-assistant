import React, { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Wand2, Download, Heart, Share2, Image as ImageIcon, RefreshCw, Brain, Settings, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { DesignService } from '@/services/designService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useProgress, type ProgressStep } from '@/hooks/useProgress';
import { TattooGenerationProgress } from '@/components/ProgressIndicator';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileTextarea } from '@/components/ui/mobile-input';
import { MobileSplitLayout, MobileCard } from '@/components/MobileOptimizedLayout';
import DesignIterationPanel from '@/components/DesignIterationPanel';
import IntelligentModelSelector from '@/components/IntelligentModelSelector';
import AdvancedPromptBuilder from '@/components/AdvancedPromptBuilder';
import StyleTransferPanel from '@/components/StyleTransferPanel';
import StyleComparisonView from '@/components/StyleComparisonView';
import { PromptEnhancementService } from '@/services/promptEnhancementService';
import { PromptEnhancementPipeline } from '@/services/promptEnhancementPipeline';
import { StyleTransferService, type StyleTransferResult } from '@/services/styleTransferService';

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

  const { handleError, createRetryAction } = useErrorHandler({
    context: 'Tattoo Creator'
  });

  const mobile = useMobileOptimizations();

  // Progress tracking for tattoo generation
  const generationSteps: ProgressStep[] = [
    { id: 'validate', label: 'Validating Input', description: 'Checking prompt and parameters', weight: 1, estimatedDuration: 2000 },
    { id: 'generate', label: 'Generating Design', description: 'AI is creating your tattoo design', weight: 3, estimatedDuration: 15000 },
    { id: 'process', label: 'Processing Image', description: 'Optimizing and enhancing the result', weight: 1, estimatedDuration: 3000 },
    { id: 'save', label: 'Saving Design', description: 'Storing your design in the gallery', weight: 1, estimatedDuration: 2000 }
  ];

  const progressTracker = useProgress({
    steps: generationSteps,
    onComplete: () => {
      console.log('Tattoo generation completed!');
    },
    onStepChange: (step, stepIndex) => {
      console.log(`Starting step ${stepIndex + 1}: ${step.label}`);
    }
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [pastGenerations, setPastGenerations] = useState<string[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [aiModel, setAiModel] = useState<'flux' | 'openai' | 'stablediffusion' | 'ideogram' | 'gptimage'>('flux');
  const [currentDesign, setCurrentDesign] = useState<any>(null);
  const [showIterationPanel, setShowIterationPanel] = useState(false);
  const [showIntelligentSelector, setShowIntelligentSelector] = useState(false);
  const [showAdvancedBuilder, setShowAdvancedBuilder] = useState(false);
  const [showStyleTransfer, setShowStyleTransfer] = useState(false);
  const [styleTransferResult, setStyleTransferResult] = useState<StyleTransferResult | null>(null);
  const [showStyleComparison, setShowStyleComparison] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  
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
      // Step 2: Generate design (already in progress from handleGenerate)
      progressTracker.updateStepProgress(25, 'Sending request to AI model...');

      const { data, error } = await supabase.functions.invoke('generate-tattoo', {
        body: {
          prompt: promptText,
          aiModel: aiModel
        }
      });

      progressTracker.updateStepProgress(75, 'Processing AI response...');
      
      if (error) {
        progressTracker.setError(new Error(error.message || 'Failed to generate image'));
        toast.error(error.message || 'Failed to generate image');
        console.error('Error generating image:', error);
        return null;
      }

      if (data.error) {
        progressTracker.setError(new Error(data.error));
        toast.error(data.error);
        console.error('Error from edge function:', data.error);
        return null;
      }

      // Step 3: Process image
      progressTracker.nextStep('Processing and optimizing image...');
      progressTracker.updateStepProgress(50, 'Optimizing image quality...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      progressTracker.nextStep('Image processing complete');

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
    progressTracker.reset();
    progressTracker.start();

    // Step 1: Validate input
    progressTracker.updateStepProgress(50, 'Preparing prompt and parameters...');

    const finalPromptText = [
      prompt,
      isPreviewMode ? 'Show as realistic tattoo on actual skin with proper lighting and texture.' : 'Show as clean design for printing.',
    ].filter(Boolean).join('. ');

    setFinalPrompt(finalPromptText);
    progressTracker.nextStep('Starting AI generation...');

    try {
      const imageUrl = await generateImage(finalPromptText);
      
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setPastGenerations(prev => [imageUrl, ...prev.slice(0, 3)]);

        // Save the design to database if user is authenticated
        const savedDesign = await DesignService.saveGeneratedDesign(
          finalPromptText,
          aiModel,
          imageUrl,
          undefined, // conversationId - could be added later
          {
            style: style || undefined,
            technique: technique || undefined,
            colorPalette: colorPalette || undefined,
            bodyZone: placement || undefined,
            subject: subject || undefined,
            theme: composition || undefined
          },
          {
            isPreviewMode,
            originalPrompt: prompt,
            enhancedPrompt: finalPromptText
          }
        );

        // Step 4: Save design (final step)
        progressTracker.updateStepProgress(100, 'Design saved successfully!');

        if (savedDesign) {
          toast.success('Your tattoo design has been generated and saved!');
          setCurrentDesign(savedDesign);
        } else {
          toast.success('Your tattoo design has been generated!');
        }
      }
    } catch (error) {
      progressTracker.setError(error as Error);
      handleError(error, 'Generate Tattoo', [
        createRetryAction(() => handleGenerate(), 'Try Again')
      ]);
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
        setEnhancedPrompt(enhancedPrompt);
        toast.success('Enhanced tattoo prompt created with AI assistance!');
      } else {
        throw new Error('No prompt was generated');
      }
    } catch (error) {
      console.error('Error generating magic prompt:', error);

      // Fallback to local prompt enhancement
      try {
        const enhancement = PromptEnhancementService.enhancePrompt(
          prompt || 'tattoo design',
          style,
          technique,
          colorPalette,
          placement,
          subject,
          isPreviewMode
        );

        setPrompt(enhancement.enhancedPrompt);
        setEnhancedPrompt(enhancement.enhancedPrompt);
        toast.success(`Prompt enhanced locally! Added ${enhancement.addedElements.length} improvements ✨`);
      } catch (fallbackError) {
        console.error('Fallback enhancement failed:', fallbackError);
        toast.error('Failed to enhance prompt. Please try again.');
      }
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

  const handleIterationComplete = (newDesign: any) => {
    setGeneratedImage(newDesign.image_url);
    setCurrentDesign(newDesign);
    setShowIterationPanel(false);
    setPastGenerations(prev => [newDesign.image_url, ...prev.slice(0, 3)]);
    toast.success('Design iteration completed!');
  };

  const handleModelSelect = (model: 'flux' | 'openai' | 'stablediffusion' | 'ideogram' | 'gptimage') => {
    setAiModel(model);
    toast.success(`Switched to ${model.toUpperCase()} model`);
  };

  const handlePromptEnhance = (enhanced: string) => {
    setPrompt(enhanced);
    setEnhancedPrompt(enhanced);
    toast.success('Prompt enhanced for selected model!');
  };

  const handleAdvancedPromptGenerated = async (prompt: string, metadata?: any) => {
    setPrompt(prompt);
    setEnhancedPrompt(prompt);
    setShowAdvancedBuilder(false);

    // Save pipeline result if available
    if (metadata?.pipelineResult) {
      await PromptEnhancementPipeline.savePipelineResult(metadata.pipelineResult);
    }

    toast.success(`Advanced prompt generated! ${metadata?.confidence ? `(${metadata.confidence}% confidence)` : ''}`);
  };

  const handleStyleTransferComplete = (result: StyleTransferResult) => {
    setStyleTransferResult(result);
    setShowStyleComparison(true);
    setShowStyleTransfer(false);
    toast.success(`Style transferred from ${result.fromStyle} to ${result.toStyle}!`);
  };

  const handleStyleTransferPromptUpdate = (prompt: string) => {
    setPrompt(prompt);
    setEnhancedPrompt(prompt);
  };

  const handleRateStyleTransfer = async (rating: number) => {
    // Could integrate with analytics service to track transfer ratings
    console.log('Style transfer rated:', rating);
  };
  
  return (
    <MobileSplitLayout
      left={
        <div className="space-y-6">
          <MobileCard>
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
              <MobileTextarea
                label="Describe Your Tattoo"
                placeholder="Describe what you want in your tattoo design..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                minRows={mobile.isMobile ? 4 : 3}
                maxRows={mobile.isMobile ? 8 : 6}
                autoResize
                helperText="Be specific about subjects, elements, mood, and any symbolism you want to include."
                mobileKeyboard="default"
              />
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
            <MobileButton
              className="w-full bg-tattoo-purple hover:bg-tattoo-purple/90"
              onClick={handleGenerate}
              disabled={isGenerating}
              loading={isGenerating}
              hapticFeedback
            >
              {isGenerating ? 'Generating...' : 'Generate Tattoo'}
            </MobileButton>
            <div className="flex gap-2">
              <MobileButton
                variant="outline"
                className="flex-1"
                onClick={handleMagicPrompt}
                disabled={isGenerating}
                hapticFeedback
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Magic Prompt
              </MobileButton>
              <MobileButton
                variant="outline"
                onClick={() => setShowIntelligentSelector(!showIntelligentSelector)}
                hapticFeedback
              >
                <Brain className="h-4 w-4" />
              </MobileButton>
              <MobileButton
                variant="outline"
                onClick={() => setShowAdvancedBuilder(!showAdvancedBuilder)}
                hapticFeedback
              >
                <Settings className="h-4 w-4" />
              </MobileButton>
              <MobileButton
                variant="outline"
                onClick={() => setShowStyleTransfer(!showStyleTransfer)}
                hapticFeedback
                disabled={!style}
              >
                <Shuffle className="h-4 w-4" />
              </MobileButton>
            </div>
          </CardFooter>
          </MobileCard>

          {/* Intelligent Model Selector */}
          {showIntelligentSelector && prompt.trim() && (
            <div className="mt-4">
              <IntelligentModelSelector
                prompt={prompt}
                style={style}
                technique={technique}
                subject={subject}
                colorPalette={colorPalette}
                bodyZone={placement}
                currentModel={aiModel}
                onModelSelect={handleModelSelect}
                onPromptEnhance={handlePromptEnhance}
              />
            </div>
          )}

          {/* Advanced Prompt Builder */}
          {showAdvancedBuilder && (
            <div className="mt-4">
              <AdvancedPromptBuilder
                initialPrompt={prompt}
                targetModel={aiModel}
                style={style}
                technique={technique}
                subject={subject}
                colorPalette={colorPalette}
                bodyZone={placement}
                isPreviewMode={isPreviewMode}
                onPromptGenerated={handleAdvancedPromptGenerated}
              />
            </div>
          )}

          {/* Style Transfer Panel */}
          {showStyleTransfer && style && (
            <div className="mt-4">
              <StyleTransferPanel
                originalPrompt={prompt}
                originalStyle={style}
                onTransferComplete={handleStyleTransferComplete}
                onPromptUpdate={handleStyleTransferPromptUpdate}
                availableModels={['flux', 'openai', 'stablediffusion', 'ideogram', 'gptimage']}
                currentModel={aiModel}
              />
            </div>
          )}

          {/* Style Comparison View */}
          {showStyleComparison && styleTransferResult && (
            <div className="mt-4">
              <StyleComparisonView
                transferResult={styleTransferResult}
                onRateTransfer={handleRateStyleTransfer}
                onGenerateOriginal={() => {
                  // Generate with original prompt and style
                  const originalPrompt = styleTransferResult.originalPrompt;
                  setPrompt(originalPrompt);
                  handleGenerate();
                }}
                onGenerateTransferred={() => {
                  // Generate with transferred prompt
                  setPrompt(styleTransferResult.transferredPrompt);
                  handleGenerate();
                }}
              />
            </div>
          )}
        </div>
      }
      right={
        <MobileCard className="h-full">
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
              <TattooGenerationProgress
                progress={progressTracker}
                onPause={progressTracker.pause}
                onResume={progressTracker.resume}
                onReset={progressTracker.reset}
              />
            ) : generatedImage ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                <img 
                  src={generatedImage} 
                  alt="Generated tattoo design" 
                  className="w-full h-full object-contain"
                />
                
                <div className={`absolute ${mobile.isMobile ? 'bottom-2 left-2 right-2' : 'bottom-3 right-3'} flex ${mobile.isMobile ? 'justify-center space-x-3' : 'space-x-2'}`}>
                  <MobileButton
                    size={mobile.isMobile ? "mobile-sm" : "sm"}
                    variant="secondary"
                    onClick={handleDownload}
                    hapticFeedback
                    className={mobile.isMobile ? "flex-1" : ""}
                  >
                    <Download className="h-4 w-4" />
                    {mobile.isMobile && <span className="ml-2">Download</span>}
                  </MobileButton>
                  <MobileButton
                    size={mobile.isMobile ? "mobile-sm" : "sm"}
                    variant="secondary"
                    onClick={handleSave}
                    hapticFeedback
                    className={mobile.isMobile ? "flex-1" : ""}
                  >
                    <Heart className="h-4 w-4" />
                    {mobile.isMobile && <span className="ml-2">Save</span>}
                  </MobileButton>
                  <MobileButton
                    size={mobile.isMobile ? "mobile-sm" : "sm"}
                    variant="secondary"
                    onClick={handleShare}
                    hapticFeedback
                    className={mobile.isMobile ? "flex-1" : ""}
                  >
                    <Share2 className="h-4 w-4" />
                    {mobile.isMobile && <span className="ml-2">Share</span>}
                  </MobileButton>
                  {currentDesign && (
                    <MobileButton
                      size={mobile.isMobile ? "mobile-sm" : "sm"}
                      variant="outline"
                      onClick={() => setShowIterationPanel(true)}
                      hapticFeedback
                      className={mobile.isMobile ? "flex-1" : ""}
                    >
                      <RefreshCw className="h-4 w-4" />
                      {mobile.isMobile && <span className="ml-2">Iterate</span>}
                    </MobileButton>
                  )}
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
          </MobileCard>

          {/* Design Iteration Panel */}
          {showIterationPanel && currentDesign && (
            <div className="mt-6">
              <DesignIterationPanel
                design={currentDesign}
                onIterationComplete={handleIterationComplete}
                onClose={() => setShowIterationPanel(false)}
              />
            </div>
          )}
      }
    />
  );
};

export default TattooCreator;
