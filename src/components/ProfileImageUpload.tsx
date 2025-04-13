
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileImageUploadProps {
  userId: string;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ userId }) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    // Preview the image
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
    setAvatarFile(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !userId) return;
    
    try {
      setUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully"
      });
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const clearSelectedImage = () => {
    if (avatarUrl) {
      URL.revokeObjectURL(avatarUrl);
    }
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <Avatar className="w-40 h-40 mb-6">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} />
          ) : (
            <AvatarFallback className="text-4xl bg-tattoo-purple text-white">
              {userId ? userId[0].toUpperCase() : "U"}
            </AvatarFallback>
          )}
        </Avatar>
        
        {avatarUrl && (
          <div className="flex space-x-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelectedImage}
              className="flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
            
            <Button
              onClick={uploadAvatar}
              className="flex items-center bg-tattoo-purple hover:bg-tattoo-purple/90"
              size="sm"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="avatar-upload" className="cursor-pointer text-center px-4">
          <Upload className="h-10 w-10 mb-2 mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Drag and drop or click to upload
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG, GIF up to 5MB
          </p>
        </label>
      </Card>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>Your profile picture will be visible to other users on the platform.</p>
      </div>
    </div>
  );
};

export default ProfileImageUpload;
