import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  History, 
  ArrowRight, 
  Eye, 
  Download,
  Heart,
  Share2,
  Sparkles,
  GitBranch,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileCard } from '@/components/MobileOptimizedLayout';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { DesignIterationService, type DesignLineage } from '@/services/designIterationService';
import DesignIterationPanel from '@/components/DesignIterationPanel';
import type { Database } from '@/integrations/supabase/types';

type GeneratedDesign = Database['public']['Tables']['generated_designs']['Row'];

export interface DesignIterationWorkflowProps {
  design: GeneratedDesign;
  onDesignSelect: (design: GeneratedDesign) => void;
  onClose?: () => void;
}

const DesignIterationWorkflow: React.FC<DesignIterationWorkflowProps> = ({
  design,
  onDesignSelect,
  onClose
}) => {
  const [lineage, setLineage] = useState<DesignLineage | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<GeneratedDesign>(design);
  const [showIterationPanel, setShowIterationPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mobile = useMobileOptimizations();
  const { handleError } = useErrorHandler({ context: 'Design Iteration Workflow' });

  useEffect(() => {
    loadLineage();
  }, [design.id]);

  const loadLineage = async () => {
    setIsLoading(true);
    try {
      const lineageData = await DesignIterationService.getDesignLineage(design.id);
      setLineage(lineageData);
    } catch (error) {
      handleError(error, 'Failed to load design lineage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIterationComplete = (newDesign: GeneratedDesign) => {
    setSelectedDesign(newDesign);
    setShowIterationPanel(false);
    loadLineage(); // Refresh lineage
    onDesignSelect(newDesign);
    toast.success('Design iteration completed!');
  };

  const handleDesignClick = (clickedDesign: GeneratedDesign) => {
    setSelectedDesign(clickedDesign);
    onDesignSelect(clickedDesign);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIterationType = (design: GeneratedDesign) => {
    return design.metadata?.iteration_type || 'original';
  };

  const getIterationNumber = (design: GeneratedDesign) => {
    return design.metadata?.iteration_number || 0;
  };

  if (isLoading) {
    return (
      <MobileCard className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading design history...</span>
          </div>
        </CardContent>
      </MobileCard>
    );
  }

  if (!lineage) {
    return (
      <MobileCard className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Unable to load design lineage</p>
        </CardContent>
      </MobileCard>
    );
  }

  const allDesigns = [lineage.originalDesign, ...lineage.iterations];

  return (
    <div className="space-y-6">
      <MobileCard className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Design Evolution
              </CardTitle>
              <CardDescription>
                Explore the evolution of your design through iterations
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
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className={`grid w-full ${mobile.isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              {!mobile.isMobile && <TabsTrigger value="compare">Compare</TabsTrigger>}
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-4">
                {allDesigns.map((designItem, index) => (
                  <div key={designItem.id} className="relative">
                    {/* Timeline connector */}
                    {index < allDesigns.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-8 bg-border" />
                    )}
                    
                    <div className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                      selectedDesign.id === designItem.id 
                        ? 'bg-accent border-primary' 
                        : 'hover:bg-accent/50 cursor-pointer'
                    }`}
                    onClick={() => handleDesignClick(designItem)}
                    >
                      {/* Timeline dot */}
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                        selectedDesign.id === designItem.id 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground'
                      }`} />
                      
                      {/* Design preview */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-md overflow-hidden border">
                          <img 
                            src={designItem.image_url} 
                            alt={`Design iteration ${index}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* Design info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? 'Original' : `Iteration ${getIterationNumber(designItem)}`}
                          </Badge>
                          {getIterationType(designItem) !== 'original' && (
                            <Badge variant="outline" className="text-xs">
                              {getIterationType(designItem).replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {designItem.metadata?.feedback || designItem.prompt}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(designItem.created_at)}
                        </div>
                      </div>
                      
                      {/* Action indicator */}
                      {selectedDesign.id === designItem.id && (
                        <div className="flex-shrink-0 flex items-center">
                          <Eye className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4">
              <div className={`grid gap-4 ${mobile.isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {allDesigns.map((designItem, index) => (
                  <div 
                    key={designItem.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedDesign.id === designItem.id 
                        ? 'border-primary shadow-lg' 
                        : 'border-transparent hover:border-accent'
                    }`}
                    onClick={() => handleDesignClick(designItem)}
                  >
                    <div className="aspect-square">
                      <img 
                        src={designItem.image_url} 
                        alt={`Design iteration ${index}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    
                    {/* Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                        {index === 0 ? 'Original' : `v${getIterationNumber(designItem)}`}
                      </Badge>
                    </div>
                    
                    {/* Selected indicator */}
                    {selectedDesign.id === designItem.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Eye className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compare" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Original Design</h4>
                  <div className="aspect-square rounded-lg overflow-hidden border">
                    <img 
                      src={lineage.originalDesign.image_url} 
                      alt="Original design"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Current Selection</h4>
                  <div className="aspect-square rounded-lg overflow-hidden border">
                    <img 
                      src={selectedDesign.image_url} 
                      alt="Selected design"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              
              {selectedDesign.id !== lineage.originalDesign.id && (
                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Changes Made:</h5>
                  <p className="text-sm text-muted-foreground">
                    {selectedDesign.metadata?.feedback || 'No feedback recorded'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <MobileButton
              onClick={() => setShowIterationPanel(true)}
              className="flex-1"
              hapticFeedback
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Create Iteration
            </MobileButton>
            
            <MobileButton variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </MobileButton>
            
            <MobileButton variant="outline" size="sm">
              <Heart className="h-4 w-4" />
            </MobileButton>
            
            <MobileButton variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
            </MobileButton>
          </div>
        </CardContent>
      </MobileCard>

      {/* Iteration Panel */}
      {showIterationPanel && (
        <DesignIterationPanel
          design={selectedDesign}
          onIterationComplete={handleIterationComplete}
          onClose={() => setShowIterationPanel(false)}
        />
      )}
    </div>
  );
};

export default DesignIterationWorkflow;
