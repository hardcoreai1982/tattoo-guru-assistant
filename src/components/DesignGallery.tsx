import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Heart, 
  Search, 
  Download, 
  Share2, 
  Trash2, 
  Filter,
  Grid3X3,
  List,
  Calendar,
  Palette,
  Sparkles,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { DesignService, designEvents } from '@/services/designService';
import { supabase } from '@/integrations/supabase/client';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import MobileButton from '@/components/ui/mobile-button';
import { MobileGridLayout } from '@/components/MobileOptimizedLayout';
import type { Database } from '@/integrations/supabase/types';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { GalleryLoading } from '@/components/LoadingState';

type GeneratedDesign = Database['public']['Tables']['generated_designs']['Row'];
type AnalyzedTattoo = Database['public']['Tables']['analyzed_tattoos']['Row'];

const DesignGallery: React.FC = () => {
  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [analyses, setAnalyses] = useState<AnalyzedTattoo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { handleError, createRetryAction } = useErrorHandler({
    context: 'Design Gallery'
  });

  const mobile = useMobileOptimizations();

  useEffect(() => {
    checkAuthAndLoadData();

    // Listen for design events
    const handleDesignCreated = () => {
      loadDesigns();
    };

    const handleDesignUpdated = () => {
      loadDesigns();
    };

    const handleDesignDeleted = () => {
      loadDesigns();
    };

    const handleAnalysisCreated = () => {
      loadAnalyses();
    };

    designEvents.addEventListener('designCreated', handleDesignCreated);
    designEvents.addEventListener('designUpdated', handleDesignUpdated);
    designEvents.addEventListener('designDeleted', handleDesignDeleted);
    designEvents.addEventListener('analysisCreated', handleAnalysisCreated);

    return () => {
      designEvents.removeEventListener('designCreated', handleDesignCreated);
      designEvents.removeEventListener('designUpdated', handleDesignUpdated);
      designEvents.removeEventListener('designDeleted', handleDesignDeleted);
      designEvents.removeEventListener('analysisCreated', handleAnalysisCreated);
    };
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        await loadDesigns();
        await loadAnalyses();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDesigns = async () => {
    try {
      const filters = {
        style: selectedStyle !== 'all' ? selectedStyle : undefined,
        aiModel: selectedModel !== 'all' ? selectedModel : undefined,
        isFavorite: showFavoritesOnly ? true : undefined
      };

      const userDesigns = await DesignService.getUserDesigns(50, 0, filters);
      setDesigns(userDesigns);
    } catch (error) {
      handleError(error, 'Load Designs', [
        createRetryAction(() => loadDesigns(), 'Retry')
      ]);
    }
  };

  const loadAnalyses = async () => {
    try {
      const userAnalyses = await DesignService.getUserAnalyses(50, 0);
      setAnalyses(userAnalyses);
    } catch (error) {
      console.error('Error loading analyses:', error);
      toast.error('Failed to load analyses');
    }
  };

  const handleToggleFavorite = async (designId: string) => {
    try {
      const success = await DesignService.toggleFavorite(designId);
      if (success) {
        await loadDesigns(); // Reload to reflect changes
        toast.success('Favorite status updated');
      } else {
        toast.error('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await DesignService.deleteDesign(designId);
      if (success) {
        await loadDesigns(); // Reload to reflect changes
        toast.success('Design deleted successfully');
      } else {
        toast.error('Failed to delete design');
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Failed to delete design');
    }
  };

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleShareDesign = async (design: GeneratedDesign) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out my tattoo design!',
          text: `Generated with ${design.ai_model}: ${design.prompt}`,
          url: design.image_url
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(design.image_url);
        toast.success('Image URL copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing design:', error);
      toast.error('Failed to share design');
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = searchQuery === '' || 
      design.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.style?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUniqueStyles = () => {
    const styles = designs.map(d => d.style).filter(Boolean);
    return [...new Set(styles)];
  };

  const getUniqueModels = () => {
    const models = designs.map(d => d.ai_model).filter(Boolean);
    return [...new Set(models)];
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Palette className="h-12 w-12 mx-auto mb-4 text-tattoo-purple" />
            <CardTitle>Design Gallery</CardTitle>
            <CardDescription>
              Sign in to view and manage your tattoo designs
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Your generated designs and analyses will appear here once you're signed in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GalleryLoading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Design Gallery</h1>
        <p className="text-muted-foreground">
          Browse and manage your generated tattoo designs and analyses
        </p>
      </div>

      <Tabs defaultValue="designs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="designs" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generated Designs ({designs.length})
          </TabsTrigger>
          <TabsTrigger value="analyses" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Analyzed Tattoos ({analyses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="designs" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  {getUniqueStyles().map(style => (
                    <SelectItem key={style} value={style!}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {getUniqueModels().map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={`flex items-center gap-2 ${mobile.isMobile ? 'flex-col w-full' : ''}`}>
              <MobileButton
                variant={showFavoritesOnly ? "default" : "outline"}
                size={mobile.isMobile ? "mobile-sm" : "sm"}
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly);
                  loadDesigns();
                }}
                className={mobile.isMobile ? "w-full" : ""}
                hapticFeedback
              >
                <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                {mobile.isMobile && <span className="ml-2">Favorites</span>}
                {!mobile.isMobile && "Favorites"}
              </MobileButton>

              <MobileButton
                variant="outline"
                size={mobile.isMobile ? "mobile-sm" : "sm"}
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className={mobile.isMobile ? "w-full" : ""}
                hapticFeedback
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                {mobile.isMobile && <span className="ml-2">{viewMode === 'grid' ? 'List View' : 'Grid View'}</span>}
              </MobileButton>
            </div>
          </div>

          {/* Designs Grid/List */}
          {filteredDesigns.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No designs found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedStyle !== 'all' || selectedModel !== 'all' || showFavoritesOnly
                    ? 'Try adjusting your filters or search terms'
                    : 'Start creating tattoo designs to see them here'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid'
              ? `grid gap-6 ${mobile.isMobile ? 'grid-cols-1' : mobile.isTablet ? 'grid-cols-2' : 'grid-cols-3 xl:grid-cols-4'}`
              : "space-y-4"
            }>
              {filteredDesigns.map((design) => (
                <Card key={design.id} className={viewMode === 'list' ? "flex" : ""}>
                  {viewMode === 'grid' ? (
                    <>
                      <div className="relative aspect-square">
                        <img
                          src={design.image_url}
                          alt={design.prompt}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                          onClick={() => handleToggleFavorite(design.id)}
                        >
                          <Heart className={`h-4 w-4 ${design.is_favorite ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {design.prompt}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {design.ai_model}
                          </Badge>
                          {design.style && (
                            <Badge variant="outline" className="text-xs">
                              {design.style}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(design.created_at!)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownloadImage(design.image_url, `tattoo-${design.id}.png`)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleShareDesign(design)}
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteDesign(design.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <>
                      <div className="w-32 h-32 flex-shrink-0">
                        <img
                          src={design.image_url}
                          alt={design.prompt}
                          className="w-full h-full object-cover rounded-l-lg"
                        />
                      </div>
                      <CardContent className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium line-clamp-2 flex-1">
                            {design.prompt}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(design.id)}
                          >
                            <Heart className={`h-4 w-4 ${design.is_favorite ? 'fill-current text-red-500' : ''}`} />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {design.ai_model}
                          </Badge>
                          {design.style && (
                            <Badge variant="outline" className="text-xs">
                              {design.style}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(design.created_at!)}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadImage(design.image_url, `tattoo-${design.id}.png`)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShareDesign(design)}
                            >
                              <Share2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDesign(design.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analyses" className="space-y-6">
          {analyses.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No analyses found</h3>
                <p className="text-muted-foreground">
                  Upload tattoo images for analysis to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-6 ${mobile.isMobile ? 'grid-cols-1' : mobile.isTablet ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {analyses.map((analysis) => (
                <Card key={analysis.id}>
                  <div className="relative aspect-square">
                    <img
                      src={analysis.image_url}
                      alt="Analyzed tattoo"
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                  <CardContent className="p-4">
                    {analysis.subject && (
                      <p className="text-sm font-medium mb-2">{analysis.subject}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(analysis.created_at!)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {analysis.analysis_mode}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownloadImage(analysis.image_url, `analysis-${analysis.id}.png`)}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignGallery;
