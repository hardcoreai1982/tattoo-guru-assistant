
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeys {
  fluxApiKey: string;
  openAiApiKey: string;
  useOpenAI: boolean;
  stableDiffusionApiKey?: string;
  ideogramApiKey?: string;
}

interface ApiKeysContextType {
  apiKeys: ApiKeys;
  updateApiKey: (key: keyof ApiKeys, value: string | boolean) => void;
  isConfigured: boolean;
}

const defaultApiKeys: ApiKeys = {
  fluxApiKey: '',
  openAiApiKey: '',
  useOpenAI: true,
  stableDiffusionApiKey: '',
  ideogramApiKey: '',
};

const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined);

export const ApiKeysProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>(defaultApiKeys);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  // Load keys from localStorage on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('tattooAiApiKeys');
    if (savedKeys) {
      const parsedKeys = JSON.parse(savedKeys) as ApiKeys;
      setApiKeys(parsedKeys);
      setIsConfigured(!!parsedKeys.fluxApiKey || !!parsedKeys.openAiApiKey);
    }
  }, []);

  const updateApiKey = (key: keyof ApiKeys, value: string | boolean) => {
    const updatedKeys = { ...apiKeys, [key]: value };
    setApiKeys(updatedKeys);
    localStorage.setItem('tattooAiApiKeys', JSON.stringify(updatedKeys));
    
    // Check if we have at least one API key configured
    setIsConfigured(!!updatedKeys.fluxApiKey || !!updatedKeys.openAiApiKey);
  };

  return (
    <ApiKeysContext.Provider value={{ apiKeys, updateApiKey, isConfigured }}>
      {children}
    </ApiKeysContext.Provider>
  );
};

export const useApiKeys = (): ApiKeysContextType => {
  const context = useContext(ApiKeysContext);
  if (context === undefined) {
    throw new Error('useApiKeys must be used within an ApiKeysProvider');
  }
  return context;
};
