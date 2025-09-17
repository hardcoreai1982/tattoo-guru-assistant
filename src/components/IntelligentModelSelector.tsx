import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Zap, 
  DollarSign, 
  Clock, 
  Star, 
  Info,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileCard } from '@/components/MobileOptimizedLayout';
import { 
  AIModelOptimizationService, 
  type AIModel, 
  type ModelRecommendation, 
  type PromptAnalysis,
  type ModelCapabilities
} from '@/services/aiModelOptimizationService';

export interface IntelligentModelSelectorProps {
  prompt: string;
  style?: string;
  technique?: string;
  subject?: string;
  colorPalette?: string;
  bodyZone?: string;
  currentModel: AIModel;
  onModelSelect: (model: AIModel) => void;
  onPromptEnhance?: (enhancedPrompt: string) => void;
}

const IntelligentModelSelector: React.FC<IntelligentModelSelectorProps> = ({
  prompt,
  style,
  technique,
  subject,
  colorPalette,
  bodyZone,
  currentModel,
  onModelSelect,
  onPromptEnhance
}) => {
  const [promptAnalysis, setPromptAnalysis] = useState<PromptAnalysis | null>(null);
  const [recommendation, setRecommendation] = useState<ModelRecommendation | null>(null);
  const [allModels, setAllModels] = useState<ModelCapabilities[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const mobile = useMobileOptimizations();

  useEffect(() => {
    if (prompt.trim()) {
      analyzePromptAndRecommend();
    }
    loadModelsAndPreferences();
  }, [prompt, style, technique, subject]);

  const analyzePromptAndRecommend = async () => {
    const analysis = AIModelOptimizationService.analyzePrompt(prompt, style, technique, subject);
    setPromptAnalysis(analysis);

    const rec = AIModelOptimizationService.recommendModel(analysis, userPreferences);
    setRecommendation(rec);
  };

  const loadModelsAndPreferences = async () => {
    const models = AIModelOptimizationService.getAllModels();
    setAllModels(models);

    const prefs = await AIModelOptimizationService.loadUserPreferences();
    setUserPreferences(prefs);
  };

  const handleModelSelect = (model: AIModel) => {
    onModelSelect(model);
    
    if (onPromptEnhance && promptAnalysis) {
      const enhancedPrompt = AIModelOptimizationService.enhancePromptForModel(
        prompt,
        model,
        promptAnalysis,
        { style, technique, colorPalette, bodyZone, subject }
      );
      onPromptEnhance(enhancedPrompt);
    }
  };

  const handleUseRecommendation = () => {
    if (recommendation) {
      handleModelSelect(recommendation.model);
      toast.success(`Switched to ${recommendation.model.toUpperCase()} - ${recommendation.reasoning[0]}`);
    }
  };

  const getModelIcon = (model: AIModel) => {
    const icons = {
      flux: Sparkles,
      openai: Star,
      stablediffusion: TrendingUp,
      ideogram: Target,
      gptimage: Brain
    };
    return icons[model] || Star;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'complex': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDetailLevelColor = (level: string) => {
    switch (level) {
      case 'minimal': return 'text-blue-600';
      case 'moderate': return 'text-green-600';
      case 'high': return 'text-orange-600';
      case 'ultra': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!promptAnalysis || !recommendation) {
    return (
      <MobileCard>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 animate-pulse" />
            <span>Analyzing prompt...</span>
          </div>
        </CardContent>
      </MobileCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Recommendation Banner */}
      {recommendation.model !== currentModel && (
        <MobileCard className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  AI Recommendation: {recommendation.model.toUpperCase()}
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  {recommendation.reasoning[0]} ({recommendation.confidence}% confidence)
                </p>
                <MobileButton
                  size="sm"
                  onClick={handleUseRecommendation}
                  className="bg-blue-600 hover:bg-blue-700"
                  hapticFeedback
                >
                  Use Recommended Model
                </MobileButton>
              </div>
            </div>
          </CardContent>
        </MobileCard>
      )}

      <MobileCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Intelligent Model Selection
          </CardTitle>
          <CardDescription>
            AI-powered model recommendations based on your prompt analysis
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="recommendation" className="w-full">
            <TabsList className={`grid w-full ${mobile.isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              {!mobile.isMobile && <TabsTrigger value="compare">Compare</TabsTrigger>}
            </TabsList>

            <TabsContent value="recommendation" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Recommended Model</h4>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {recommendation.confidence}% match
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3 mb-3">
                    {React.createElement(getModelIcon(recommendation.model), { 
                      className: "h-6 w-6 text-primary" 
                    })}
                    <div>
                      <h5 className="font-medium">{recommendation.model.toUpperCase()}</h5>
                      <p className="text-xs text-muted-foreground">
                        Quality: {recommendation.expectedQuality}/10 • 
                        Time: ~{recommendation.estimatedTime}s
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h6 className="text-xs font-medium text-muted-foreground">Why this model?</h6>
                    <ul className="space-y-1">
                      {recommendation.reasoning.map((reason, index) => (
                        <li key={index} className="text-xs flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {recommendation.alternativeModels.length > 0 && (
                  <div>
                    <h6 className="text-xs font-medium text-muted-foreground mb-2">
                      Alternative Options
                    </h6>
                    <div className="flex gap-2 flex-wrap">
                      {recommendation.alternativeModels.map((altModel) => (
                        <Badge 
                          key={altModel} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleModelSelect(altModel)}
                        >
                          {altModel.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Complexity</span>
                    <Badge variant="outline" className={getComplexityColor(promptAnalysis.complexity)}>
                      {promptAnalysis.complexity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Detail Level</span>
                    <Badge variant="outline" className={getDetailLevelColor(promptAnalysis.detailLevel)}>
                      {promptAnalysis.detailLevel}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Color Type</span>
                    <Badge variant="outline">
                      {promptAnalysis.colorRequirement.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tokens</span>
                    <Badge variant="outline">
                      ~{promptAnalysis.estimatedTokens}
                    </Badge>
                  </div>
                </div>
              </div>

              {promptAnalysis.keywords.length > 0 && (
                <div>
                  <h6 className="text-xs font-medium text-muted-foreground mb-2">Key Elements</h6>
                  <div className="flex flex-wrap gap-1">
                    {promptAnalysis.keywords.slice(0, 8).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(promptAnalysis.style || promptAnalysis.subject || promptAnalysis.technique) && (
                <div className="p-3 bg-muted rounded-lg">
                  <h6 className="text-xs font-medium mb-2">Detected Attributes</h6>
                  <div className="space-y-1">
                    {promptAnalysis.style && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Style:</span> {promptAnalysis.style}
                      </div>
                    )}
                    {promptAnalysis.subject && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Subject:</span> {promptAnalysis.subject}
                      </div>
                    )}
                    {promptAnalysis.technique && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Technique:</span> {promptAnalysis.technique}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="compare" className="space-y-4">
              <div className="space-y-3">
                {allModels.map((model) => {
                  const isRecommended = model.model === recommendation.model;
                  const isCurrent = model.model === currentModel;
                  
                  return (
                    <div 
                      key={model.model}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isRecommended ? 'border-blue-500 bg-blue-50' :
                        isCurrent ? 'border-green-500 bg-green-50' :
                        'hover:bg-accent'
                      }`}
                      onClick={() => handleModelSelect(model.model)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {React.createElement(getModelIcon(model.model), { 
                            className: "h-4 w-4" 
                          })}
                          <span className="font-medium text-sm">{model.model.toUpperCase()}</span>
                          {isRecommended && <Badge variant="default" className="text-xs">Recommended</Badge>}
                          {isCurrent && <Badge variant="secondary" className="text-xs">Current</Badge>}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Quality</div>
                          <Progress value={model.qualityScore * 10} className="h-1 mt-1" />
                          <div className="text-xs font-medium">{model.qualityScore}/10</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Speed</div>
                          <Progress value={model.speedScore * 10} className="h-1 mt-1" />
                          <div className="text-xs font-medium">{model.speedScore}/10</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Cost</div>
                          <Progress value={model.costScore * 10} className="h-1 mt-1" />
                          <div className="text-xs font-medium">{model.costScore}/10</div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Best for: {model.bestFor.slice(0, 2).join(', ')}
                        {model.bestFor.length > 2 && '...'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </MobileCard>
    </div>
  );
};

export default IntelligentModelSelector;
