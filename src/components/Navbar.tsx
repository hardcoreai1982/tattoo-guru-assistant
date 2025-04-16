
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { supabase } from '@/integrations/supabase/client';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="relative py-4 px-6 md:px-10 border-b z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <span className="font-bold text-2xl gradient-text">Tattoo Buddy</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="font-medium hover:text-tattoo-purple transition-colors">
            Home
          </Link>
          <Link to="/features" className="font-medium hover:text-tattoo-purple transition-colors">
            Features
          </Link>
          <Link to="/analyze" className="font-medium hover:text-tattoo-purple transition-colors">
            Analyze Tattoo
          </Link>
          <Link to="/create" className="font-medium hover:text-tattoo-purple transition-colors">
            Create Tattoo
          </Link>
          <Link to="/chat" className="font-medium hover:text-tattoo-purple transition-colors">
            AI Chat
          </Link>
          <Link to="/about" className="font-medium hover:text-tattoo-purple transition-colors">
            About Us
          </Link>
          <ThemeToggle />
          {user ? (
            <Button className="bg-tattoo-purple hover:bg-tattoo-purple/90">
              <Link to="/profile" className="flex items-center gap-2">
                <User size={16} /> Profile
              </Link>
            </Button>
          ) : (
            <Button className="bg-tattoo-purple hover:bg-tattoo-purple/90">
              <Link to="/signin">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="flex items-center md:hidden">
          <ThemeToggle />
          <button
            onClick={toggleMenu}
            className="p-2 ml-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background shadow-lg p-4 z-50 animate-fade-in">
          <div className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="px-4 py-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/features" 
              className="px-4 py-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              to="/analyze" 
              className="px-4 py-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Analyze Tattoo
            </Link>
            <Link 
              to="/create" 
              className="px-4 py-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Create Tattoo
            </Link>
            <Link 
              to="/chat" 
              className="px-4 py-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              AI Chat
            </Link>
            <Link 
              to="/about" 
              className="px-4 py-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            {user ? (
              <Button className="bg-tattoo-purple hover:bg-tattoo-purple/90 w-full">
                <Link to="/profile" className="flex items-center gap-2 justify-center w-full">
                  <User size={16} /> Profile
                </Link>
              </Button>
            ) : (
              <Button className="bg-tattoo-purple hover:bg-tattoo-purple/90 w-full">
                <Link to="/signin">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
