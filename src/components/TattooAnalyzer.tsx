import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Check, AlertCircle, RefreshCw, BadgeInfo } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DesignService } from '@/services/designService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { TattooAnalysisLoading } from '@/components/LoadingState';
import { useProgress, type ProgressStep } from '@/hooks/useProgress';
import { TattooAnalysisProgress } from '@/components/ProgressIndicator';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileSplitLayout, MobileCard } from '@/components/MobileOptimizedLayout';

const TattooAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const { handleError, createRetryAction } = useErrorHandler({
    context: 'Tattoo Analyzer'
  });

  const mobile = useMobileOptimizations();

  // Progress tracking for tattoo analysis
  const analysisSteps: ProgressStep[] = [
    { id: 'upload', label: 'Processing Image', description: 'Analyzing uploaded image', weight: 1, estimatedDuration: 3000 },
    { id: 'analyze', label: 'AI Analysis', description: 'Identifying style, elements, and details', weight: 2, estimatedDuration: 8000 },
    { id: 'generate', label: 'Creating Report', description: 'Compiling analysis results', weight: 1, estimatedDuration: 2000 }
  ];

  const progressTracker = useProgress({
    steps: analysisSteps,
    onComplete: () => {
      console.log('Tattoo analysis completed!');
    },
    onStepChange: (step, stepIndex) => {
      console.log(`Starting analysis step ${stepIndex + 1}: ${step.label}`);
    }
  });
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image is too large. Please upload an image smaller than 10MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAnalyze = async () => {
    if (!image) {
      toast.error('Please upload an image first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    progressTracker.reset();
    progressTracker.start();

    try {
      // Step 1: Process image
      progressTracker.updateStepProgress(50, 'Preparing image for analysis...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      progressTracker.nextStep('Starting AI analysis...');

      // Step 2: AI Analysis
      progressTracker.updateStepProgress(25, 'Sending to AI analysis service...');

      // Call the Supabase edge function for analysis
      const { data, error } = await supabase.functions.invoke('analyze-tattoo', {
        body: {
          image,
          mode: 'design'
        },
      });

      progressTracker.updateStepProgress(75, 'Processing analysis results...');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to analyze tattoo');
      }
      
      if (data?.analysis) {
        progressTracker.nextStep('Generating analysis report...');

        setAnalysisResult(data.analysis);

        // Step 3: Save analysis
        progressTracker.updateStepProgress(50, 'Saving analysis to gallery...');

        // Save the analysis to database if user is authenticated
        const savedAnalysis = await DesignService.saveAnalyzedTattoo(
          image,
          data.analysis,
          'design',
          data.analysis.subject || undefined,
          undefined, // conversationId - could be added later
          {
            analysisTimestamp: new Date().toISOString(),
            imageSize: image.length
          }
        );

        progressTracker.updateStepProgress(100, 'Analysis complete!');

        if (savedAnalysis) {
          toast.success('Tattoo analysis complete and saved!');
        } else {
          toast.success('Tattoo analysis complete!');
        }
      } else if (data?.error) {
        progressTracker.setError(new Error(data.error));
        console.error('Analysis error from function:', data.error);
        throw new Error(data.error);
      } else {
        progressTracker.setError(new Error('No analysis results received'));
        console.error('Unexpected response:', data);
        throw new Error('No analysis results received');
      }
    } catch (error) {
      progressTracker.setError(error as Error);
      handleError(error, 'Analyze Tattoo', [
        createRetryAction(() => handleAnalyze(), 'Try Again')
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleClick = () => {
    document.getElementById('upload-image')?.click();
  };
  
  return (
    <MobileSplitLayout
      left={
        <div className="space-y-6">
          <MobileCard>
          <CardHeader>
            <CardTitle>Upload Tattoo Image</CardTitle>
            <CardDescription>
              Upload a clear image of the tattoo you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {image ? (
              <div className="relative aspect-square rounded-md overflow-hidden border-2 border-dashed border-border cursor-pointer" onClick={handleClick}>
                <img 
                  src={image} 
                  alt="Uploaded tattoo" 
                  className="w-full h-full object-cover"
                />
                <Button 
                  variant="secondary"
                  className="absolute bottom-4 right-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImage(null);
                  }}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-md cursor-pointer aspect-square"
                onClick={handleClick}
              >
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Click to upload your tattoo image
                </p>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  PNG, JPG or GIF (max. 10MB)
                </p>
                <input 
                  id="upload-image" 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <MobileButton
              className="w-full bg-tattoo-purple hover:bg-tattoo-purple/90"
              onClick={handleAnalyze}
              disabled={!image || isAnalyzing}
              loading={isAnalyzing}
              hapticFeedback
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Tattoo'}
            </MobileButton>
          </CardFooter>
          </MobileCard>
        </div>
      }
      right={
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              {analysisResult 
                ? 'Review the detailed design analysis of your tattoo'
                : 'Upload an image and click "Analyze Tattoo" to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full">
            {isAnalyzing ? (
              <div className="h-96 flex items-center justify-center">
                <TattooAnalysisProgress progress={progressTracker} />
              </div>
            ) : analysisResult ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-6 mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="visual">Visual</TabsTrigger>
                  <TabsTrigger value="technique">Technique</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="recommendations">Tips</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="space-y-4">
                    {analysisResult.overview && (
                      <div className="space-y-2">
                        <p className="text-lg">{analysisResult.overview}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="visual" className="space-y-4">
                  {analysisResult.visualElements && (
                    <div className="space-y-4">
                      <p className="text-lg">{analysisResult.visualElements}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="technique" className="space-y-4">
                  {analysisResult.technique && (
                    <div className="space-y-4">
                      <p className="text-lg">{analysisResult.technique}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="style" className="space-y-4">
                  {analysisResult.style && (
                    <div className="space-y-4">
                      <p className="text-lg">{analysisResult.style}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  {analysisResult.history && (
                    <div className="space-y-4">
                      <p className="text-lg">{analysisResult.history}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recommendations" className="space-y-4">
                  {analysisResult.recommendations && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-lg">{analysisResult.recommendations}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No analysis results yet</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Upload a tattoo image and click "Analyze Tattoo" to see a detailed breakdown of style, technique, and recommendations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      }
    />
  );
};

export default TattooAnalyzer;
