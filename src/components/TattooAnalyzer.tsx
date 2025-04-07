import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Check, AlertCircle, RefreshCw, BadgeInfo } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const TattooAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  
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
    toast.info('Analyzing your tattoo... This may take a moment.');
    
    try {
      // Call the Supabase edge function for analysis
      const { data, error } = await supabase.functions.invoke('analyze-tattoo', {
        body: { 
          image,
          mode: 'design'
        },
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to analyze tattoo');
      }
      
      if (data?.analysis) {
        setAnalysisResult(data.analysis);
        toast.success('Tattoo analysis complete!');
      } else if (data?.error) {
        console.error('Analysis error from function:', data.error);
        throw new Error(data.error);
      } else {
        console.error('Unexpected response:', data);
        throw new Error('No analysis results received');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze the tattoo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleClick = () => {
    document.getElementById('upload-image')?.click();
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Panel - Image Upload and Analysis Controls */}
      <div className="w-full md:w-1/2 space-y-6">
        <Card>
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
            <Button 
              className="w-full bg-tattoo-purple hover:bg-tattoo-purple/90"
              onClick={handleAnalyze}
              disabled={!image || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : 'Analyze Tattoo'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right Panel - Analysis Results */}
      <div className="w-full md:w-1/2">
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
              <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-tattoo-purple mb-4"></div>
                <p className="text-muted-foreground">Analyzing your tattoo...</p>
                <p className="text-sm text-muted-foreground mt-2">Our AI agent is examining style, technique, and symbolism</p>
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
      </div>
    </div>
  );
};

export default TattooAnalyzer;
