
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import FeaturesPage from "./pages/FeaturesPage";
import ChatPage from "./pages/ChatPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import TattooAnalyzePage from "./pages/TattooAnalyzePage";
import TattooCreationPage from "./pages/TattooCreationPage";
import SignInPage from "./pages/SignInPage";
import ProfilePage from "./pages/ProfilePage";
import VoiceChatPage from "./pages/VoiceChatPage";
import DesignGalleryPage from "./pages/DesignGalleryPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/voice-chat" element={<VoiceChatPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/analyze" element={<TattooAnalyzePage />} />
          <Route path="/create" element={<TattooCreationPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/login" element={<SignInPage />} /> {/* Alias for backward compatibility */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/gallery" element={<DesignGalleryPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
