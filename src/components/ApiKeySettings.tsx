
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Check, X } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { toast } from 'sonner';

interface ApiKeySettingsProps {
  className?: string;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ className }) => {
  const { apiKeys, updateApiKey, isConfigured } = useApiKeys();
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    toast.success('API Keys saved successfully!');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
        >
          <Settings className="h-4 w-4 mr-2" />
          API Settings
          {isConfigured ? (
            <Check className="h-4 w-4 ml-2 text-green-500" />
          ) : (
            <X className="h-4 w-4 ml-2 text-red-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Service API Keys</DialogTitle>
          <DialogDescription>
            Enter your API keys for the AI services you want to use.
            These will be stored in your browser's local storage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fluxApiKey">Flux API Key</Label>
            <Input 
              id="fluxApiKey" 
              value={apiKeys.fluxApiKey} 
              onChange={(e) => updateApiKey('fluxApiKey', e.target.value)}
              type="password"
              placeholder="r8_xxxxxxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">Used for tattoo design generation</p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="useOpenAI">Use OpenAI</Label>
              <Switch 
                id="useOpenAI" 
                checked={apiKeys.useOpenAI}
                onCheckedChange={(checked) => updateApiKey('useOpenAI', checked)}
              />
            </div>
            
            {apiKeys.useOpenAI && (
              <div className="space-y-2">
                <Label htmlFor="openAiApiKey">OpenAI API Key</Label>
                <Input 
                  id="openAiApiKey" 
                  value={apiKeys.openAiApiKey} 
                  onChange={(e) => updateApiKey('openAiApiKey', e.target.value)}
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">Used for chat and tattoo analysis</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="stableDiffusionApiKey">Stable Diffusion API Key (Optional)</Label>
            <Input 
              id="stableDiffusionApiKey" 
              value={apiKeys.stableDiffusionApiKey} 
              onChange={(e) => updateApiKey('stableDiffusionApiKey', e.target.value)}
              type="password"
              placeholder="Enter API key"
            />
            <p className="text-xs text-muted-foreground">For alternative tattoo design generation</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ideogramApiKey">Ideogram API Key (Optional)</Label>
            <Input 
              id="ideogramApiKey" 
              value={apiKeys.ideogramApiKey} 
              onChange={(e) => updateApiKey('ideogramApiKey', e.target.value)}
              type="password"
              placeholder="Enter API key"
            />
            <p className="text-xs text-muted-foreground">Used for lettering tattoo designs</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySettings;
