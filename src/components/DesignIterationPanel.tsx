import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  RefreshCw, 
  Lightbulb, 
  History, 
  Palette, 
  Brush, 
  Move3D,
  Plus,
  Minus,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileTextarea } from '@/components/ui/mobile-input';
import { MobileCard } from '@/components/MobileOptimizedLayout';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { DesignIterationService, type IterationRequest, type DesignLineage } from '@/services/designIterationService';
import type { Database } from '@/integrations/supabase/types';

type GeneratedDesign = Database['public']['Tables']['generated_designs']['Row'];

export interface DesignIterationPanelProps {
  design: GeneratedDesign;
  onIterationComplete: (newDesign: GeneratedDesign) => void;
  onClose?: () => void;
}

const DesignIterationPanel: React.FC<DesignIterationPanelProps> = ({
  design,
  onIterationComplete,
  onClose
}) => {
  const [feedback, setFeedback] = useState('');
  const [iterationType, setIterationType] = useState<IterationRequest['iterationType']>('refine');
  const [isIterating, setIsIterating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lineage, setLineage] = useState<DesignLineage | null>(null);
  const [preserveElements, setPreserveElements] = useState<string[]>([]);
  const [removeElements, setRemoveElements] = useState<string[]>([]);
  const [addElements, setAddElements] = useState<string[]>([]);
  const [specificChanges, setSpecificChanges] = useState<IterationRequest['specificChanges']>({});

  const mobile = useMobileOptimizations();
  const { handleError } = useErrorHandler({ context: 'Design Iteration' });

  useEffect(() => {
    loadSuggestions();
    loadLineage();
  }, [design.id]);

  const loadSuggestions = async () => {
    try {
      const suggestions = await DesignIterationService.getIterationSuggestions(design.id);
      setSuggestions(suggestions);
    } catch (error) {
      handleError(error, 'Failed to load iteration suggestions');
    }
  };

  const loadLineage = async () => {
    try {
      const lineage = await DesignIterationService.getDesignLineage(design.id);
      setLineage(lineage);
    } catch (error) {
      handleError(error, 'Failed to load design lineage');
    }
  };

  const handleIterate = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback for the iteration');
      return;
    }

    setIsIterating(true);
    try {
      const request: IterationRequest = {
        originalDesignId: design.id,
        feedback: feedback.trim(),
        iterationType,
        specificChanges,
        preserveElements: preserveElements.length > 0 ? preserveElements : undefined,
        removeElements: removeElements.length > 0 ? removeElements : undefined,
        addElements: addElements.length > 0 ? addElements : undefined
      };

      const newDesign = await DesignIterationService.iterateDesign(request);
      
      if (newDesign) {
        toast.success('Design iteration created successfully!');
        onIterationComplete(newDesign);
        setFeedback('');
        setPreserveElements([]);
        setRemoveElements([]);
        setAddElements([]);
        setSpecificChanges({});
        loadLineage(); // Refresh lineage
      } else {
        toast.error('Failed to create design iteration');
      }
    } catch (error) {
      handleError(error, 'Failed to iterate design');
    } finally {
      setIsIterating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFeedback(suggestion);
  };

  const addElement = (element: string, type: 'preserve' | 'remove' | 'add') => {
    if (!element.trim()) return;
    
    switch (type) {
      case 'preserve':
        if (!preserveElements.includes(element)) {
          setPreserveElements([...preserveElements, element]);
        }
        break;
      case 'remove':
        if (!removeElements.includes(element)) {
          setRemoveElements([...removeElements, element]);
        }
        break;
      case 'add':
        if (!addElements.includes(element)) {
          setAddElements([...addElements, element]);
        }
        break;
    }
  };

  const removeElement = (element: string, type: 'preserve' | 'remove' | 'add') => {
    switch (type) {
      case 'preserve':
        setPreserveElements(preserveElements.filter(e => e !== element));
        break;
      case 'remove':
        setRemoveElements(removeElements.filter(e => e !== element));
        break;
      case 'add':
        setAddElements(addElements.filter(e => e !== element));
        break;
    }
  };

  const iterationTypeOptions = [
    { value: 'refine', label: 'Refine Details', icon: Sparkles, description: 'Enhance and polish existing elements' },
    { value: 'style_change', label: 'Change Style', icon: Brush, description: 'Modify the artistic style' },
    { value: 'element_modification', label: 'Modify Elements', icon: Move3D, description: 'Change specific design elements' },
    { value: 'color_adjustment', label: 'Adjust Colors', icon: Palette, description: 'Modify color scheme and palette' },
    { value: 'composition_change', label: 'Change Layout', icon: RefreshCw, description: 'Alter the overall composition' }
  ];

  return (
    <MobileCard className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Iterate Design
            </CardTitle>
            <CardDescription>
              Refine and improve your tattoo design with AI assistance
            </CardDescription>
          </div>
          {onClose && (
            <MobileButton variant="ghost" size="sm" onClick={onClose}>
              ×
            </MobileButton>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="iterate" className="w-full">
          <TabsList className={`grid w-full ${mobile.isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="iterate">Iterate</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            {!mobile.isMobile && <TabsTrigger value="history">History</TabsTrigger>}
          </TabsList>

          <TabsContent value="iterate" className="space-y-4">
            {/* Iteration Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Iteration Type</label>
              <Select value={iterationType} onValueChange={(value: any) => setIterationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iterationTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Feedback Input */}
            <div className="space-y-2">
              <MobileTextarea
                label="Describe the changes you want"
                placeholder="e.g., Make the design more detailed, change the color to blue, add flowers around the main element..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                minRows={mobile.isMobile ? 3 : 2}
                maxRows={mobile.isMobile ? 6 : 4}
                autoResize
              />
            </div>

            {/* Element Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-600">Keep Elements</label>
                <div className="flex flex-wrap gap-1">
                  {preserveElements.map((element) => (
                    <Badge key={element} variant="secondary" className="text-xs">
                      {element}
                      <button
                        onClick={() => removeElement(element, 'preserve')}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-red-600">Remove Elements</label>
                <div className="flex flex-wrap gap-1">
                  {removeElements.map((element) => (
                    <Badge key={element} variant="destructive" className="text-xs">
                      {element}
                      <button
                        onClick={() => removeElement(element, 'remove')}
                        className="ml-1 hover:text-white"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-600">Add Elements</label>
                <div className="flex flex-wrap gap-1">
                  {addElements.map((element) => (
                    <Badge key={element} variant="outline" className="text-xs">
                      {element}
                      <button
                        onClick={() => removeElement(element, 'add')}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <MobileButton
              onClick={handleIterate}
              disabled={!feedback.trim() || isIterating}
              loading={isIterating}
              className="w-full"
              hapticFeedback
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isIterating ? 'Creating Iteration...' : 'Create Iteration'}
            </MobileButton>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-3">
            <div className="text-sm text-muted-foreground mb-3">
              <Lightbulb className="h-4 w-4 inline mr-1" />
              Click on a suggestion to use it as feedback
            </div>
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className="p-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <p className="text-sm">{suggestion}</p>
              </Card>
            ))}
            {suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No suggestions available for this design
              </p>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <div className="text-sm text-muted-foreground mb-3">
              <History className="h-4 w-4 inline mr-1" />
              Design iteration history
            </div>
            {lineage && (
              <div className="space-y-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Original</Badge>
                    <span className="text-sm font-medium">Base Design</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {lineage.originalDesign.prompt}
                  </p>
                </Card>
                
                {lineage.iterations.map((iteration, index) => (
                  <Card key={iteration.id} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">Iteration {index + 1}</Badge>
                      <span className="text-sm font-medium">
                        {iteration.metadata?.iteration_type || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {iteration.metadata?.feedback || 'No feedback recorded'}
                    </p>
                  </Card>
                ))}
              </div>
            )}
            {!lineage?.iterations.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No iterations yet. Create your first iteration above!
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </MobileCard>
  );
};

export default DesignIterationPanel;
