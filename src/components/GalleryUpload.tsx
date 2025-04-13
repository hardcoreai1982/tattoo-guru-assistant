
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Trash2, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GalleryUploadProps {
  userId: string;
}

type GalleryImage = {
  id: string;
  url: string;
  name: string;
};

const GalleryUpload: React.FC<GalleryUploadProps> = ({ userId }) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchGalleryImages();
    }
  }, [userId]);

  const fetchGalleryImages = async () => {
    try {
      setLoadingGallery(true);
      
      const { data, error } = await supabase.storage
        .from('gallery')
        .list(`${userId}`);
        
      if (error) throw error;
      
      if (data) {
        const galleryImages = await Promise.all(
          data.map(async (item) => {
            const { data: urlData } = supabase.storage
              .from('gallery')
              .getPublicUrl(`${userId}/${item.name}`);
              
            return {
              id: item.id,
              name: item.name,
              url: urlData.publicUrl
            };
          })
        );
        
        setImages(galleryImages);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      toast({
        title: "Failed to load gallery",
        description: "There was a problem loading your images",
        variant: "destructive"
      });
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const filesArray = Array.from(e.target.files);
    const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== filesArray.length) {
      toast({
        title: "Invalid file type",
        description: "Some files were skipped because they are not images",
        variant: "destructive"
      });
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0 || !userId) return;
    
    try {
      setUploading(true);
      
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        return filePath;
      });
      
      await Promise.all(uploadPromises);
      
      toast({
        title: "Images uploaded",
        description: `Successfully uploaded ${selectedFiles.length} images`
      });
      
      setSelectedFiles([]);
      fetchGalleryImages();
      
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageName: string) => {
    try {
      const { error } = await supabase.storage
        .from('gallery')
        .remove([`${userId}/${imageName}`]);
        
      if (error) throw error;
      
      setImages(prev => prev.filter(img => img.name !== imageName));
      
      toast({
        title: "Image deleted",
        description: "The image has been removed from your gallery"
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the image",
        variant: "destructive"
      });
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Selected Images ({selectedFiles.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Selected ${index}`}
                  className="h-40 w-full object-cover rounded-md"
                />
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <Button
            onClick={uploadImages}
            className="w-full bg-tattoo-purple hover:bg-tattoo-purple/90"
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
                Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'}
              </>
            )}
          </Button>
        </div>
      )}
      
      <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
        <input
          type="file"
          id="gallery-upload"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="gallery-upload" className="cursor-pointer text-center px-4">
          <Upload className="h-10 w-10 mb-2 mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Drag and drop or click to upload
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG, GIF up to 5MB each
          </p>
        </label>
      </Card>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Your Gallery</h3>
        {loadingGallery ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-tattoo-purple" />
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="h-40 w-full object-cover rounded-md"
                />
                <button
                  onClick={() => deleteImage(image.name)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <label
              htmlFor="gallery-upload"
              className="h-40 w-full border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
            >
              <Plus className="h-8 w-8 mb-2 text-gray-400" />
              <span className="text-sm text-gray-500">Add More</span>
            </label>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No images in your gallery yet. Upload some!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryUpload;
