
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, User, Image as ImageIcon } from 'lucide-react';
import ProfileImageUpload from '@/components/ProfileImageUpload';
import GalleryUpload from '@/components/GalleryUpload';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/signin');
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    }
    
    getUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/signin');
        } else if (session) {
          setUser(session.user);
        }
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account"
      });
      navigate('/signin');
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was a problem signing out",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 bg-gray-50 dark:bg-tattoo-black">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                    <AvatarFallback className="text-2xl bg-tattoo-purple text-white">
                      {(user?.email?.[0] || "").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{user?.user_metadata?.full_name || user?.email}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{user?.email}</p>
                  <Button 
                    variant="outline" 
                    className="w-full mb-2"
                    onClick={() => navigate('/profile/edit')}
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:w-2/3">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid grid-cols-2 mb-8">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User size={16} /> Profile Picture
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="flex items-center gap-2">
                    <ImageIcon size={16} /> Gallery
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Picture</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProfileImageUpload userId={user?.id} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="gallery" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Gallery</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <GalleryUpload userId={user?.id} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
