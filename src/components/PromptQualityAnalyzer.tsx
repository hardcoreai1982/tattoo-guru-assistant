import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Lightbulb, 
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileCard } from '@/components/MobileOptimizedLayout';
import { PromptEnhancementService } from '@/services/promptEnhancementService';

export interface PromptQualityAnalyzerProps {
  prompt: string;
  onPromptSuggestion: (suggestion: string) => void;
  onApplyEnhancement: (enhanced: string) => void;
}

const PromptQualityAnalyzer: React.FC<PromptQualityAnalyzerProps> = ({
  prompt,
  onPromptSuggestion,
  onApplyEnhancement
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mobile = useMobileOptimizations();

  useEffect(() => {
    if (prompt.trim()) {
      analyzePrompt();
    } else {
      setAnalysis(null);
      setSuggestions([]);
    }
  }, [prompt]);

  const analyzePrompt = async () => {
    setIsAnalyzing(true);
    try {
      const quality = PromptEnhancementService.analyzePromptQuality(prompt);
      setAnalysis(quality);

      const promptSuggestions = PromptEnhancementService.generatePromptSuggestions(prompt, 3);
      setSuggestions(promptSuggestions);
    } catch (error) {
      console.error('Error analyzing prompt:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertCircle;
    return XCircle;
  };

  const handleApplyEnhancement = () => {
    const enhancement = PromptEnhancementService.enhancePrompt(prompt);
    onApplyEnhancement(enhancement.enhancedPrompt);
  };

  if (!prompt.trim()) {
    return (
      <MobileCard>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Enter a prompt to analyze its quality and get suggestions
            </p>
          </div>
        </CardContent>
      </MobileCard>
    );
  }

  if (isAnalyzing) {
    return (
      <MobileCard>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 animate-pulse" />
            <span>Analyzing prompt quality...</span>
          </div>
        </CardContent>
      </MobileCard>
    );
  }

  if (!analysis) return null;

  const ScoreIcon = getScoreIcon(analysis.score);

  return (
    <MobileCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Prompt Quality Analysis
        </CardTitle>
        <CardDescription>
          AI-powered analysis to help you create better prompts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Quality</span>
            <div className="flex items-center gap-2">
              <ScoreIcon className={`h-4 w-4 ${getScoreColor(analysis.score)}`} />
              <span className={`font-medium ${getScoreColor(analysis.score)}`}>
                {analysis.score}/100
              </span>
            </div>
          </div>
          <Progress value={analysis.score} className="h-2" />
        </div>

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Strengths
            </h4>
            <div className="space-y-1">
              {analysis.strengths.map((strength: string, index: number) => (
                <div key={index} className="text-xs text-green-700 flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {strength}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Elements */}
        {analysis.missingElements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-orange-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Missing Elements
            </h4>
            <div className="flex flex-wrap gap-1">
              {analysis.missingElements.map((element: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs text-orange-600">
                  {element}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Suggestions for Improvement
            </h4>
            <div className="space-y-1">
              {analysis.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="text-xs text-blue-700 flex items-start gap-2">
                  <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-Enhancement */}
        <div className="pt-2 border-t">
          <MobileButton
            onClick={handleApplyEnhancement}
            className="w-full"
            hapticFeedback
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Auto-Enhance Prompt
          </MobileButton>
        </div>

        {/* Prompt Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Alternative Prompts
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Card 
                  key={index}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onPromptSuggestion(suggestion)}
                >
                  <p className="text-xs line-clamp-2">{suggestion}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="p-3 bg-muted rounded-lg">
          <h5 className="text-xs font-medium mb-2 flex items-center gap-1">
            <Target className="h-3 w-3" />
            Pro Tips
          </h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Be specific about style (traditional, realistic, etc.)</li>
            <li>• Include technical terms (bold lines, detailed shading)</li>
            <li>• Specify color preferences (black & gray, vibrant colors)</li>
            <li>• Mention body placement for better composition</li>
            <li>• Keep prompts focused but descriptive (5-30 words)</li>
          </ul>
        </div>
      </CardContent>
    </MobileCard>
  );
};

export default PromptQualityAnalyzer;
