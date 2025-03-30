
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const TattooAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAnalyze = () => {
    if (!image) {
      toast.error('Please upload an image first.');
      return;
    }
    
    setIsAnalyzing(true);
    
    // Mock analysis - in a real app, this would call an API
    setTimeout(() => {
      setAnalysisResult({
        overview: {
          tattooType: 'Sleeve',
          subjectFocus: 'Japanese Dragon',
          placement: 'Forearm',
          purpose: 'Ornamental',
        },
        visualElements: {
          composition: 'Wrap-around design with strong flow',
          lineWork: 'Bold traditional outlines',
          detailDensity: 'Highly detailed',
          shadingStyle: 'Smooth gradient',
          colorPalette: 'Full-color, traditional Japanese',
          contrast: 'High contrast',
        },
        technique: {
          primaryTechnique: 'Japanese Irezumi',
          inkSaturation: 'Heavy solid',
        },
        style: {
          classification: 'Japanese Traditional (Irezumi)',
          styleConfidence: 'High (95%)',
        },
        symbolism: {
          motifs: 'Dragon, cherry blossoms, waves',
          culturalContext: 'Japanese mythology',
        },
        recommendations: [
          'Consider color touch-ups in 2-3 years',
          'Strong line work should hold up well over time',
          'Matches well with koi fish or hannya mask designs',
        ],
      });
      setIsAnalyzing(false);
    }, 2000);
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
                  className="w-full h-full object-cover"
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
              {isAnalyzing ? 'Analyzing...' : 'Analyze Tattoo'}
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
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tattoo Type</p>
                      <p>{analysisResult.overview.tattooType}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Subject Focus</p>
                      <p>{analysisResult.overview.subjectFocus}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Placement</p>
                      <p>{analysisResult.overview.placement}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Purpose/Mood</p>
                      <p>{analysisResult.overview.purpose}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Symbolism & Motifs</p>
                    <p>{analysisResult.symbolism.motifs}</p>
                    <p className="text-sm text-muted-foreground">{analysisResult.symbolism.culturalContext}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="visual" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Composition & Flow</p>
                      <p>{analysisResult.visualElements.composition}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Line Work</p>
                      <p>{analysisResult.visualElements.lineWork}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Detail Density</p>
                      <p>{analysisResult.visualElements.detailDensity}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Shading Style</p>
                      <p>{analysisResult.visualElements.shadingStyle}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Color Palette</p>
                      <p>{analysisResult.visualElements.colorPalette}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Contrast</p>
                      <p>{analysisResult.visualElements.contrast}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="technique" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Primary Technique</p>
                      <p>{analysisResult.technique.primaryTechnique}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Ink Saturation</p>
                      <p>{analysisResult.technique.inkSaturation}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="style" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Style Classification</p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {analysisResult.style.styleConfidence}
                        </span>
                      </div>
                      <p className="text-lg font-semibold">{analysisResult.style.classification}</p>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm">Style characteristics:</p>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                        <li>Bold outlines</li>
                        <li>Traditional Japanese color palette</li>
                        <li>Symbolic imagery</li>
                        <li>Respects flow of the body</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="recommendations" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recommendations</p>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Care Tip</p>
                        <p className="text-sm text-amber-700">
                          This style typically requires touch-ups every 5-7 years to maintain vibrancy.
                        </p>
                      </div>
                    </div>
                  </div>
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
