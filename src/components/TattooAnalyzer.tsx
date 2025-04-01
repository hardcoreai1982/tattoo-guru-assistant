
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { supabase } from '@/integrations/supabase/client';

const TattooAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const { apiKeys } = useApiKeys();
  
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
    
    if (!apiKeys.openAiApiKey && !apiKeys.fluxApiKey) {
      toast.error('Please configure your API keys in the settings panel first.');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Call the Supabase edge function for analysis
      const { data, error } = await supabase.functions.invoke('analyze-tattoo', {
        body: { image },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to analyze tattoo');
      }
      
      if (data?.analysis) {
        setAnalysisResult(data.analysis);
        toast.success('Tattoo analysis complete!');
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No analysis results received');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze the tattoo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleImageClick = () => {
    document.getElementById('upload-image')?.click();
  };
  
  const mockImageUpload = () => {
    setImage('/placeholder.svg');
    setAnalysisResult(null);
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
              <div className="relative aspect-square rounded-md overflow-hidden border-2 border-dashed border-border">
                <img 
                  src={image} 
                  alt="Uploaded tattoo" 
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={handleImageClick}
                />
                <Button 
                  variant="secondary"
                  className="absolute bottom-4 right-4"
                  onClick={() => setImage(null)}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-md cursor-pointer aspect-square"
                onClick={() => document.getElementById('upload-image')?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Drag and drop your image here, or click to browse
                </p>
                <input 
                  id="upload-image" 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {/* Temporary for demo */}
                <Button 
                  variant="link" 
                  onClick={(e) => {
                    e.stopPropagation();
                    mockImageUpload();
                  }}
                  className="mt-4"
                >
                  Use Demo Image
                </Button>
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
                ? 'Review the detailed breakdown of your tattoo' 
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
                <TabsList className="grid grid-cols-5 mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="visual">Visual</TabsTrigger>
                  <TabsTrigger value="technique">Technique</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="recommendations">Tips</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {analysisResult.overview && (
                      <>
                        {analysisResult.overview.tattooType && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Tattoo Type</p>
                            <p>{analysisResult.overview.tattooType}</p>
                          </div>
                        )}
                        {analysisResult.overview.subjectFocus && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Subject Focus</p>
                            <p>{analysisResult.overview.subjectFocus}</p>
                          </div>
                        )}
                        {analysisResult.overview.placement && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Placement</p>
                            <p>{analysisResult.overview.placement}</p>
                          </div>
                        )}
                        {analysisResult.overview.purpose && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Purpose/Mood</p>
                            <p>{analysisResult.overview.purpose}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <Separator />
                  {analysisResult.symbolism && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Symbolism & Motifs</p>
                      {analysisResult.symbolism.motifs && <p>{analysisResult.symbolism.motifs}</p>}
                      {analysisResult.symbolism.culturalContext && (
                        <p className="text-sm text-muted-foreground">{analysisResult.symbolism.culturalContext}</p>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="visual" className="space-y-4">
                  {analysisResult.visualElements && (
                    <div className="space-y-4">
                      {analysisResult.visualElements.composition && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Composition & Flow</p>
                          <p>{analysisResult.visualElements.composition}</p>
                        </div>
                      )}
                      {analysisResult.visualElements.lineWork && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Line Work</p>
                          <p>{analysisResult.visualElements.lineWork}</p>
                        </div>
                      )}
                      {analysisResult.visualElements.detailDensity && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Detail Density</p>
                          <p>{analysisResult.visualElements.detailDensity}</p>
                        </div>
                      )}
                      {analysisResult.visualElements.shadingStyle && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Shading Style</p>
                          <p>{analysisResult.visualElements.shadingStyle}</p>
                        </div>
                      )}
                      {analysisResult.visualElements.colorPalette && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Color Palette</p>
                          <p>{analysisResult.visualElements.colorPalette}</p>
                        </div>
                      )}
                      {analysisResult.visualElements.contrast && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Contrast</p>
                          <p>{analysisResult.visualElements.contrast}</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="technique" className="space-y-4">
                  {analysisResult.technique && (
                    <div className="space-y-4">
                      {analysisResult.technique.primaryTechnique && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Primary Technique</p>
                          <p>{analysisResult.technique.primaryTechnique}</p>
                        </div>
                      )}
                      {analysisResult.technique.inkSaturation && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Ink Saturation</p>
                          <p>{analysisResult.technique.inkSaturation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="style" className="space-y-4">
                  {analysisResult.style && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Style Classification</p>
                          {analysisResult.style.styleConfidence && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {analysisResult.style.styleConfidence}
                            </span>
                          )}
                        </div>
                        {analysisResult.style.classification && (
                          <p className="text-lg font-semibold">{analysisResult.style.classification}</p>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recommendations" className="space-y-4">
                  {analysisResult.recommendations && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommendations</p>
                        <ul className="space-y-2">
                          {Array.isArray(analysisResult.recommendations) ? 
                            analysisResult.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            )) : 
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{String(analysisResult.recommendations)}</span>
                            </li>
                          }
                        </ul>
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
