import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wand2, 
  Template, 
  Settings, 
  Play, 
  Copy, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Target,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileCard } from '@/components/MobileOptimizedLayout';
import { PromptEnhancementPipeline, type EnhancementContext, type PipelineResult } from '@/services/promptEnhancementPipeline';
import { PromptTemplateService, type PromptTemplate, type TemplateCategory } from '@/services/promptTemplateService';
import type { AIModel } from '@/services/aiModelOptimizationService';

export interface AdvancedPromptBuilderProps {
  initialPrompt?: string;
  targetModel: AIModel;
  style?: string;
  technique?: string;
  subject?: string;
  colorPalette?: string;
  bodyZone?: string;
  isPreviewMode?: boolean;
  onPromptGenerated: (prompt: string, metadata?: any) => void;
  onTemplateSelected?: (template: PromptTemplate) => void;
}

const AdvancedPromptBuilder: React.FC<AdvancedPromptBuilderProps> = ({
  initialPrompt = '',
  targetModel,
  style,
  technique,
  subject,
  colorPalette,
  bodyZone,
  isPreviewMode,
  onPromptGenerated,
  onTemplateSelected
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'templates' | 'pipeline'>('builder');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string | string[]>>({});
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);

  const mobile = useMobileOptimizations();

  useEffect(() => {
    const templateCategories = PromptTemplateService.getTemplateCategories();
    setCategories(templateCategories);
  }, []);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleProcessPipeline = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsProcessing(true);
    try {
      const context: EnhancementContext = {
        originalPrompt: prompt,
        targetModel,
        style,
        technique,
        subject,
        colorPalette,
        bodyZone,
        isPreviewMode
      };

      const result = await PromptEnhancementPipeline.processPrompt(prompt, context);
      setPipelineResult(result);
      
      if (result.confidenceScore > 70) {
        setPrompt(result.enhancedPrompt);
        toast.success(`Prompt enhanced! Confidence: ${result.confidenceScore}%`);
      } else {
        toast.warning(`Enhancement completed with ${result.confidenceScore}% confidence. Review suggestions.`);
      }
    } catch (error) {
      console.error('Pipeline processing error:', error);
      toast.error('Failed to process prompt through pipeline');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setTemplateVariables({});
    onTemplateSelected?.(template);
  };

  const handleTemplateRender = () => {
    if (!selectedTemplate) return;

    const validation = PromptTemplateService.validateTemplateVariables(selectedTemplate, templateVariables);
    
    if (!validation.isValid) {
      toast.error(`Template validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    const renderedPrompt = PromptTemplateService.renderTemplate(selectedTemplate, templateVariables);
    setPrompt(renderedPrompt);
    toast.success('Template applied successfully!');
  };

  const handleVariableChange = (variableName: string, value: string | string[]) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleGeneratePrompt = () => {
    if (!prompt.trim()) {
      toast.error('Please enter or build a prompt first');
      return;
    }

    onPromptGenerated(prompt, {
      template: selectedTemplate?.id,
      pipelineResult,
      confidence: pipelineResult?.confidenceScore || 0
    });
  };

  const handleCopyPrompt = async () => {
    if (!prompt.trim()) return;
    
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy prompt');
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertCircle;
    return AlertCircle;
  };

  return (
    <MobileCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Advanced Prompt Builder
        </CardTitle>
        <CardDescription>
          Build sophisticated prompts using templates and AI enhancement pipeline
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className={`grid w-full ${mobile.isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            {!mobile.isMobile && <TabsTrigger value="pipeline">Pipeline</TabsTrigger>}
          </TabsList>

          <TabsContent value="builder" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your tattoo design prompt..."
                  className="min-h-[100px]"
                />
              </div>

              {pipelineResult && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Enhancement Result</span>
                    <div className="flex items-center gap-2">
                      {React.createElement(getConfidenceIcon(pipelineResult.confidenceScore), {
                        className: `h-4 w-4 ${getConfidenceColor(pipelineResult.confidenceScore)}`
                      })}
                      <span className={`text-sm font-medium ${getConfidenceColor(pipelineResult.confidenceScore)}`}>
                        {pipelineResult.confidenceScore}%
                      </span>
                    </div>
                  </div>
                  
                  {pipelineResult.stagesApplied.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">Stages Applied:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pipelineResult.stagesApplied.map((stage, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {stage.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {pipelineResult.suggestions.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Suggestions:</span>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        {pipelineResult.suggestions.slice(0, 2).map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <MobileButton
                  onClick={handleProcessPipeline}
                  disabled={isProcessing || !prompt.trim()}
                  loading={isProcessing}
                  className="flex-1"
                  hapticFeedback
                >
                  <Layers className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Enhance'}
                </MobileButton>
                <MobileButton
                  variant="outline"
                  onClick={handleCopyPrompt}
                  disabled={!prompt.trim()}
                  hapticFeedback
                >
                  <Copy className="h-4 w-4" />
                </MobileButton>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id}>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </h4>
                  <div className="grid gap-2">
                    {category.templates.map((template) => (
                      <Card 
                        key={template.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium">{template.name}</h5>
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {template.successRate}% success
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                ⭐ {template.averageRating}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {selectedTemplate && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Template Variables</h4>
                  <div className="space-y-3">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable.name}>
                        <Label htmlFor={variable.name} className="text-xs">
                          {variable.description}
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        
                        {variable.type === 'text' && (
                          <Input
                            id={variable.name}
                            value={templateVariables[variable.name] as string || ''}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                            placeholder={variable.placeholder || variable.defaultValue}
                            className="text-xs"
                          />
                        )}

                        {variable.type === 'select' && (
                          <Select
                            value={templateVariables[variable.name] as string || variable.defaultValue}
                            onValueChange={(value) => handleVariableChange(variable.name, value)}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Select option..." />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.options?.map((option) => (
                                <SelectItem key={option} value={option} className="text-xs">
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {variable.type === 'multiselect' && (
                          <div className="space-y-1">
                            {variable.options?.map((option) => (
                              <label key={option} className="flex items-center space-x-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={(templateVariables[variable.name] as string[] || []).includes(option)}
                                  onChange={(e) => {
                                    const current = templateVariables[variable.name] as string[] || [];
                                    if (e.target.checked) {
                                      handleVariableChange(variable.name, [...current, option]);
                                    } else {
                                      handleVariableChange(variable.name, current.filter(v => v !== option));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <MobileButton
                    onClick={handleTemplateRender}
                    className="w-full mt-4"
                    hapticFeedback
                  >
                    <Template className="h-4 w-4 mr-2" />
                    Apply Template
                  </MobileButton>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Pipeline Configuration
                </h4>
                <p className="text-xs text-muted-foreground">
                  The enhancement pipeline processes your prompt through multiple stages to optimize it for better AI generation results.
                </p>
              </div>

              {pipelineResult && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Processing Results</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{pipelineResult.confidenceScore}%</div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{pipelineResult.processingTime}ms</div>
                      <div className="text-xs text-muted-foreground">Processing Time</div>
                    </div>
                  </div>

                  {pipelineResult.improvements.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium mb-2">Improvements Applied</h5>
                      <div className="space-y-2">
                        {pipelineResult.improvements.map((improvement, index) => (
                          <div key={index} className="p-2 bg-accent rounded text-xs">
                            <div className="font-medium">{improvement.stage.replace('_', ' ')}</div>
                            <div className="text-muted-foreground">Impact: +{improvement.impact}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pipelineResult.warnings.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium mb-2 text-orange-600">Warnings</h5>
                      <ul className="space-y-1">
                        {pipelineResult.warnings.map((warning, index) => (
                          <li key={index} className="text-xs text-orange-600 flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <MobileButton
            onClick={handleGeneratePrompt}
            disabled={!prompt.trim()}
            className="flex-1"
            hapticFeedback
          >
            <Play className="h-4 w-4 mr-2" />
            Use This Prompt
          </MobileButton>
        </div>
      </CardContent>
    </MobileCard>
  );
};

export default AdvancedPromptBuilder;
