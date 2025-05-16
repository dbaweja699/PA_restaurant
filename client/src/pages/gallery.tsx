import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, Camera, RefreshCw, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";

// Type definition for photo gallery items
interface PhotoGallery {
  id: number;
  created_at: string;
  caption: string | null;
  image_url: string | null;
  status: string | null;
}

export default function GalleryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoGallery | null>(null);
  const [captionDialog, setCaptionDialog] = useState(false);
  const [caption, setCaption] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  
  // Fetch gallery photos
  const { data: photos = [], isLoading, isError } = useQuery<PhotoGallery[]>({
    queryKey: ['/api/gallery'],
    queryFn: async () => {
      const response = await fetch('/api/gallery');
      if (!response.ok) {
        throw new Error('Failed to fetch gallery');
      }
      return response.json();
    },
  });

  // Mutation to generate AI caption
  const generateCaptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/gallery/${id}/generate-caption`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to generate caption');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCaption(data.caption);
      setIsGeneratingCaption(false);
      toast({
        title: "Caption Generated",
        description: "AI has successfully generated a caption for your image",
      });
    },
    onError: (error) => {
      setIsGeneratingCaption(false);
      toast({
        title: "Failed to Generate Caption",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to post photo to social media
  const postPhotoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/gallery/${id}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error('Failed to post photo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      toast({
        title: "Photo Posted",
        description: "Your photo has been successfully posted",
      });
      setCaptionDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Post Photo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to update photo caption
  const updateCaptionMutation = useMutation({
    mutationFn: async ({ id, caption }: { id: number, caption: string }) => {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption }),
      });
      if (!response.ok) {
        throw new Error('Failed to update caption');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      toast({
        title: "Caption Updated",
        description: "Photo caption has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Caption",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGenerateCaption = (photo: PhotoGallery) => {
    setSelectedPhoto(photo);
    setCaption(photo.caption || "");
    setCaptionDialog(true);
    setIsGeneratingCaption(true);
    generateCaptionMutation.mutate(photo.id);
  };

  const handleSaveCaption = () => {
    if (!selectedPhoto) return;
    
    updateCaptionMutation.mutate({
      id: selectedPhoto.id,
      caption: caption,
    });
  };

  const handlePostPhoto = () => {
    if (!selectedPhoto) return;
    postPhotoMutation.mutate(selectedPhoto.id);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-6">
          <h1 className="text-2xl font-bold mb-6">Photo Gallery</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="container py-6">
          <h1 className="text-2xl font-bold mb-6">Photo Gallery</h1>
          <div className="p-6 bg-red-50 rounded-lg">
            <p className="text-red-500">
              Error loading gallery. Please try again later.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Prince Albert Hotel Gallery</h1>
        
        <Tabs defaultValue="gallery">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gallery">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="relative h-64 bg-gray-100">
                    {photo.image_url ? (
                      <img
                        src={photo.image_url}
                        alt={photo.caption || "Gallery image"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Image className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm line-clamp-2">
                      {photo.caption || "No caption provided"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateCaption(photo)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Caption
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setCaption(photo.caption || "");
                        setCaptionDialog(true);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {photos.length === 0 && (
              <div className="p-6 bg-gray-50 rounded-lg text-center">
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No photos in gallery yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="social">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Social Media Photos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos
                  .filter(photo => photo.status === 'posted')
                  .map((photo) => (
                    <Card key={photo.id} className="overflow-hidden">
                      <div className="relative h-64 bg-gray-100">
                        {photo.image_url ? (
                          <img
                            src={photo.image_url}
                            alt={photo.caption || "Gallery image"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Image className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                          Posted
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm line-clamp-2">
                          {photo.caption || "No caption provided"}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(photo.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {photos.filter(photo => photo.status === 'posted').length === 0 && (
                <div className="p-6 bg-gray-100 rounded-lg text-center">
                  <p className="text-gray-500">No photos have been posted to social media yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Caption Dialog */}
      <Dialog open={captionDialog} onOpenChange={setCaptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Caption & Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {selectedPhoto?.image_url && (
              <div className="w-full h-48 rounded-md overflow-hidden">
                <img 
                  src={selectedPhoto.image_url} 
                  alt="Selected" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <div className="relative">
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="pr-20"
                  disabled={isGeneratingCaption}
                />
                {isGeneratingCaption && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                This caption will be used when posting to social media
              </p>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={handleSaveCaption}
              disabled={isGeneratingCaption}
            >
              Save Caption
            </Button>
            <Button 
              variant="default" 
              onClick={handlePostPhoto}
              disabled={isGeneratingCaption || !caption.trim()}
            >
              Post to Social Media
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}