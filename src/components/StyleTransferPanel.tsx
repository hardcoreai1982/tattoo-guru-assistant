import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  Shuffle, 
  Eye, 
  Play, 
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  Palette,
  Target,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileCard } from '@/components/MobileOptimizedLayout';
import { StyleTransferService, type StyleTransferRequest, type StyleTransferResult } from '@/services/styleTransferService';
import type { AIModel } from '@/services/aiModelOptimizationService';

export interface StyleTransferPanelProps {
  originalPrompt: string;
  originalStyle: string;
  onTransferComplete: (result: StyleTransferResult) => void;
  onPromptUpdate?: (prompt: string) => void;
  availableModels: AIModel[];
  currentModel: AIModel;
}

const StyleTransferPanel: React.FC<StyleTransferPanelProps> = ({
  originalPrompt,
  originalStyle,
  onTransferComplete,
  onPromptUpdate,
  availableModels,
  currentModel
}) => {
  const [targetStyle, setTargetStyle] = useState<string>('');
  const [preserveSubject, setPreserveSubject] = useState(true);
  const [preserveComposition, setPreserveComposition] = useState(true);
  const [preserveColorScheme, setPreserveColorScheme] = useState(false);
  const [targetModel, setTargetModel] = useState<AIModel>(currentModel);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [transferResult, setTransferResult] = useState<StyleTransferResult | null>(null);

  const mobile = useMobileOptimizations();

  const availableStyles = [
    { id: 'traditional', name: 'Traditional', icon: '🌹', description: 'Bold lines, solid colors, classic imagery' },
    { id: 'realistic', name: 'Realistic', icon: '👤', description: 'Photorealistic detail and shading' },
    { id: 'geometric', name: 'Geometric', icon: '🔷', description: 'Mathematical patterns and precision' },
    { id: 'watercolor', name: 'Watercolor', icon: '🎨', description: 'Flowing colors and soft edges' },
    { id: 'minimalist', name: 'Minimalist', icon: '✨', description: 'Clean, simple designs' },
    { id: 'blackwork', name: 'Blackwork', icon: '⚫', description: 'Bold black ink designs' },
    { id: 'neo-traditional', name: 'Neo-Traditional', icon: '🌺', description: 'Modern twist on traditional' },
    { id: 'tribal', name: 'Tribal', icon: '🗿', description: 'Bold tribal patterns' }
  ];

  useEffect(() => {
    if (targetStyle && targetStyle !== originalStyle) {
      updatePreview();
    }
  }, [targetStyle, preserveSubject, preserveComposition, preserveColorScheme]);

  const updatePreview = () => {
    const preview = StyleTransferService.previewTransfer(originalStyle, targetStyle);
    setPreviewData(preview);
  };

  const handleStyleTransfer = async () => {
    if (!targetStyle) {
      toast.error('Please select a target style');
      return;
    }

    if (targetStyle === originalStyle) {
      toast.error('Target style must be different from original style');
      return;
    }

    setIsTransferring(true);
    try {
      const request: StyleTransferRequest = {
        originalPrompt,
        originalStyle,
        targetStyle,
        preserveSubject,
        preserveComposition,
        preserveColorScheme,
        targetModel,
        customInstructions: customInstructions.trim() || undefined
      };

      const result = await StyleTransferService.transferStyle(request);
      setTransferResult(result);
      onTransferComplete(result);

      if (result.confidence > 70) {
        toast.success(`Style transfer completed! Confidence: ${result.confidence}%`);
      } else {
        toast.warning(`Style transfer completed with ${result.confidence}% confidence. Review suggestions.`);
      }
    } catch (error) {
      console.error('Style transfer error:', error);
      toast.error('Style transfer failed. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleUseTransferredPrompt = () => {
    if (transferResult && onPromptUpdate) {
      onPromptUpdate(transferResult.transferredPrompt);
      toast.success('Transferred prompt applied!');
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompatibilityIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return Info;
    return AlertTriangle;
  };

  const filteredStyles = availableStyles.filter(style => style.id !== originalStyle);

  return (
    <MobileCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="h-5 w-5" />
          Style Transfer
        </CardTitle>
        <CardDescription>
          Transform your design from {originalStyle} to a different tattoo style
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Style Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <div className="p-3 border rounded-lg bg-muted">
                <div className="text-lg font-medium capitalize">{originalStyle}</div>
                <div className="text-xs text-muted-foreground">Current Style</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Select value={targetStyle} onValueChange={setTargetStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target style..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredStyles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      <div className="flex items-center gap-2">
                        <span>{style.icon}</span>
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-muted-foreground">{style.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Compatibility Preview */}
          {previewData && (
            <div className="p-3 border rounded-lg bg-accent/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Transfer Compatibility</span>
                <div className="flex items-center gap-2">
                  {React.createElement(getCompatibilityIcon(previewData.compatibility), {
                    className: `h-4 w-4 ${getCompatibilityColor(previewData.compatibility)}`
                  })}
                  <span className={`font-medium ${getCompatibilityColor(previewData.compatibility)}`}>
                    {previewData.compatibility}%
                  </span>
                </div>
              </div>
              
              <Progress value={previewData.compatibility} className="h-2 mb-3" />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-medium text-green-600 mb-1">Preserved</div>
                  <div className="space-y-1">
                    {previewData.preservedElements.map((element: string, index: number) => (
                      <div key={index} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {element}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-blue-600 mb-1">Modified</div>
                  <div className="space-y-1">
                    {previewData.modifiedElements.slice(0, 3).map((element: string, index: number) => (
                      <div key={index} className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-600" />
                        {element}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {previewData.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="font-medium text-orange-600 mb-1 text-xs">Warnings</div>
                  {previewData.warnings.map((warning: string, index: number) => (
                    <div key={index} className="text-xs text-orange-600 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transfer Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Transfer Options</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-subject" className="text-sm">Preserve Subject</Label>
              <Switch
                id="preserve-subject"
                checked={preserveSubject}
                onCheckedChange={setPreserveSubject}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-composition" className="text-sm">Preserve Composition</Label>
              <Switch
                id="preserve-composition"
                checked={preserveComposition}
                onCheckedChange={setPreserveComposition}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-colors" className="text-sm">Preserve Color Scheme</Label>
              <Switch
                id="preserve-colors"
                checked={preserveColorScheme}
                onCheckedChange={setPreserveColorScheme}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-model" className="text-sm">Target AI Model</Label>
            <Select value={targetModel} onValueChange={(value) => setTargetModel(value as AIModel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-instructions" className="text-sm">Custom Instructions (Optional)</Label>
            <Textarea
              id="custom-instructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Add specific requirements or modifications..."
              className="min-h-[60px] text-sm"
            />
          </div>
        </div>

        {/* Transfer Result */}
        {transferResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Transfer Result</h4>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {transferResult.confidence}% confidence
              </Badge>
            </div>

            <div className="p-3 border rounded-lg bg-accent/50">
              <div className="text-sm font-medium mb-2">Transferred Prompt</div>
              <div className="text-xs text-muted-foreground mb-3 line-clamp-3">
                {transferResult.transferredPrompt}
              </div>
              
              <div className="flex gap-2">
                <MobileButton
                  size="sm"
                  onClick={handleUseTransferredPrompt}
                  className="flex-1"
                  hapticFeedback
                >
                  <Play className="h-3 w-3 mr-1" />
                  Use This Prompt
                </MobileButton>
                <MobileButton
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(transferResult.transferredPrompt)}
                  hapticFeedback
                >
                  Copy
                </MobileButton>
              </div>
            </div>

            {transferResult.transformedElements.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Transformations Applied</div>
                <div className="space-y-2">
                  {transferResult.transformedElements.slice(0, 3).map((element, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="font-medium">{element.reason}</span>
                      </div>
                      {element.original && (
                        <div className="text-muted-foreground">
                          "{element.original}" → "{element.transformed}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transferResult.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-blue-600">Suggestions</div>
                <ul className="space-y-1">
                  {transferResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-blue-700 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <MobileButton
            onClick={handleStyleTransfer}
            disabled={!targetStyle || isTransferring || targetStyle === originalStyle}
            loading={isTransferring}
            className="flex-1"
            hapticFeedback
          >
            <Palette className="h-4 w-4 mr-2" />
            {isTransferring ? 'Transferring...' : 'Transfer Style'}
          </MobileButton>
        </div>
      </CardContent>
    </MobileCard>
  );
};

export default StyleTransferPanel;
