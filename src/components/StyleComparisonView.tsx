import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeftRight, 
  Eye, 
  Download, 
  Share2, 
  Star,
  TrendingUp,
  Palette,
  Target,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileCard } from '@/components/MobileOptimizedLayout';
import type { StyleTransferResult } from '@/services/styleTransferService';

export interface StyleComparisonViewProps {
  transferResult: StyleTransferResult;
  originalImage?: string;
  transferredImage?: string;
  onGenerateOriginal?: () => void;
  onGenerateTransferred?: () => void;
  onRateTransfer?: (rating: number) => void;
  onShareComparison?: () => void;
}

const StyleComparisonView: React.FC<StyleComparisonViewProps> = ({
  transferResult,
  originalImage,
  transferredImage,
  onGenerateOriginal,
  onGenerateTransferred,
  onRateTransfer,
  onShareComparison
}) => {
  const [activeView, setActiveView] = useState<'side-by-side' | 'overlay' | 'details'>('side-by-side');
  const [userRating, setUserRating] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(false);

  const mobile = useMobileOptimizations();

  const handleRating = (rating: number) => {
    setUserRating(rating);
    onRateTransfer?.(rating);
    toast.success(`Rated ${rating}/5 stars`);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return Info;
    return AlertTriangle;
  };

  const ConfidenceIcon = getConfidenceIcon(transferResult.confidence);

  return (
    <MobileCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Style Transfer Comparison
        </CardTitle>
        <CardDescription>
          {transferResult.fromStyle} → {transferResult.toStyle}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList className={`grid w-full ${mobile.isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="side-by-side">Compare</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            {!mobile.isMobile && <TabsTrigger value="overlay">Overlay</TabsTrigger>}
          </TabsList>

          <TabsContent value="side-by-side" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium capitalize">{transferResult.fromStyle} Style</h4>
                  <Badge variant="outline">Original</Badge>
                </div>
                
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  {originalImage ? (
                    <img 
                      src={originalImage} 
                      alt="Original style" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Palette className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Generate to see original style
                      </p>
                      {onGenerateOriginal && (
                        <MobileButton size="sm" onClick={onGenerateOriginal} hapticFeedback>
                          Generate Original
                        </MobileButton>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-accent/50 rounded-lg">
                  <div className="text-xs font-medium mb-1">Original Prompt</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {transferResult.originalPrompt}
                  </div>
                </div>
              </div>

              {/* Transferred Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium capitalize">{transferResult.toStyle} Style</h4>
                  <Badge variant="default">Transferred</Badge>
                </div>
                
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  {transferredImage ? (
                    <img 
                      src={transferredImage} 
                      alt="Transferred style" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Generate to see transferred style
                      </p>
                      {onGenerateTransferred && (
                        <MobileButton size="sm" onClick={onGenerateTransferred} hapticFeedback>
                          Generate Transferred
                        </MobileButton>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-xs font-medium mb-1">Transferred Prompt</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {transferResult.transferredPrompt}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className={`text-lg font-bold ${getConfidenceColor(transferResult.confidence).split(' ')[0]}`}>
                  {transferResult.confidence}%
                </div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{transferResult.compatibilityScore}%</div>
                <div className="text-xs text-muted-foreground">Compatibility</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{transferResult.estimatedQuality}%</div>
                <div className="text-xs text-muted-foreground">Est. Quality</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Transfer Confidence */}
            <div className={`p-3 rounded-lg border ${getConfidenceColor(transferResult.confidence)}`}>
              <div className="flex items-center gap-2 mb-2">
                <ConfidenceIcon className="h-4 w-4" />
                <span className="font-medium">Transfer Confidence: {transferResult.confidence}%</span>
              </div>
              <p className="text-xs">
                {transferResult.confidence >= 80 
                  ? 'High confidence transfer with excellent style adaptation'
                  : transferResult.confidence >= 60
                  ? 'Good transfer with some style adaptation challenges'
                  : 'Lower confidence transfer - manual refinement recommended'
                }
              </p>
            </div>

            {/* Preserved Elements */}
            {transferResult.preservedElements.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Preserved Elements
                </h5>
                <div className="flex flex-wrap gap-1">
                  {transferResult.preservedElements.map((element, index) => (
                    <Badge key={index} variant="outline" className="text-xs text-green-600 border-green-200">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Transformations */}
            {transferResult.transformedElements.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-blue-600 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Transformations Applied
                </h5>
                <div className="space-y-2">
                  {transferResult.transformedElements.map((element, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs font-medium text-blue-800 mb-1">
                        {element.reason}
                      </div>
                      {element.original && element.transformed !== '[removed]' && (
                        <div className="text-xs text-blue-600">
                          <span className="line-through opacity-60">"{element.original}"</span>
                          {' → '}
                          <span className="font-medium">"{element.transformed}"</span>
                        </div>
                      )}
                      {element.transformed === '[removed]' && (
                        <div className="text-xs text-blue-600">
                          <span className="line-through opacity-60">"{element.original}"</span>
                          <span className="ml-2 text-red-600">[removed]</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {transferResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </h5>
                <ul className="space-y-1">
                  {transferResult.warnings.map((warning, index) => (
                    <li key={index} className="text-xs text-orange-600 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {transferResult.suggestions.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-purple-600 flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Suggestions
                </h5>
                <ul className="space-y-1">
                  {transferResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-purple-600 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          {!mobile.isMobile && (
            <TabsContent value="overlay" className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                {originalImage && transferredImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <img 
                      src={transferredImage} 
                      alt="Transferred" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                      title="Hover to see transferred version"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      Hover to compare
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Generate both versions to see overlay comparison
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Rating Section */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Rate this transfer</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className={`p-1 rounded ${
                    star <= userRating 
                      ? 'text-yellow-500' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className="h-4 w-4 fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onShareComparison && (
            <MobileButton
              variant="outline"
              onClick={onShareComparison}
              className="flex-1"
              hapticFeedback
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </MobileButton>
          )}
          <MobileButton
            variant="outline"
            onClick={() => {
              const text = `Style Transfer: ${transferResult.fromStyle} → ${transferResult.toStyle}\n\nOriginal: ${transferResult.originalPrompt}\n\nTransferred: ${transferResult.transferredPrompt}`;
              navigator.clipboard.writeText(text);
              toast.success('Comparison copied to clipboard!');
            }}
            className="flex-1"
            hapticFeedback
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </MobileButton>
        </div>
      </CardContent>
    </MobileCard>
  );
};

export default StyleComparisonView;
