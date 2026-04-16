'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { API_URL } from '@/lib/utils';

interface GalleryItem {
  id: number;
  image_url: string;
  description: string | null;
  uploaded_at: string;
}

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/gallery`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gallery');
      }

      const data = await response.json();
      setGalleryItems(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  // Parse images from gallery item
  const getImagesFromItem = (item: GalleryItem): string[] => {
    try {
      const parsedImages = JSON.parse(item.image_url);
      if (Array.isArray(parsedImages)) {
        return parsedImages.map(img => 
          img.startsWith('http') ? img : `${API_URL}${img}`
        );
      }
    } catch {
      // If not JSON, treat as single image
      if (item.image_url) {
        return [item.image_url.startsWith('http') ? item.image_url : `${API_URL}${item.image_url}`];
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="page-container-wide">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="page-container-wide">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <p className="text-xl text-muted-foreground">{error}</p>
            <Button onClick={fetchGalleryItems}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="page-container-wide">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Photo Gallery
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore the beauty of Elimar Spring Garden Resort through our collection of stunning photos
          </p>
        </div>

      {galleryItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-2xl font-semibold mb-2">No Photos Available</h3>
          <p className="text-muted-foreground max-w-md">
            We're currently updating our gallery. Please check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4 pb-10">
          {galleryItems.map((item, index) => {
            const images = getImagesFromItem(item);
            const imageUrl = images[0] || '/placeholder-room.svg';
            
            // Bento box grid layout pattern (same as admin)
            const getGridClass = (idx: number) => {
              // Reset pattern every 10 items for variety
              const pattern = idx % 10;
              switch (pattern) {
                case 0: return "md:col-span-2 md:row-span-2"; // Large feature
                case 1: return "md:col-span-1 md:row-span-1"; // Standard
                case 2: return "md:col-span-1 md:row-span-1"; // Standard
                case 3: return "md:col-span-1 md:row-span-2"; // Tall portrait
                case 4: return "md:col-span-1 md:row-span-1"; // Standard
                case 5: return "md:col-span-2 md:row-span-1"; // Wide landscape
                case 6: return "md:col-span-1 md:row-span-1"; // Standard
                case 7: return "md:col-span-1 md:row-span-1"; // Standard
                case 8: return "md:col-span-2 md:row-span-1"; // Wide landscape
                case 9: return "md:col-span-1 md:row-span-1"; // Standard
                default: return "md:col-span-1 md:row-span-1";
              }
            };

            return (
              <Card 
                key={item.id} 
                className={`${getGridClass(index)} relative group overflow-hidden cursor-pointer hover:shadow-2xl transition-all border-2 hover:border-primary`}
                onClick={() => {
                  setSelectedItem(item);
                  setSelectedImageIndex(0);
                }}
              >
                <div className="relative w-full h-full">
                  <Image 
                    src={imageUrl} 
                    alt={item.description || 'Gallery item'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-room.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {item.description && (
                        <p className="text-white/90 text-sm line-clamp-2">{item.description}</p>
                      )}
                      {images.length > 1 && (
                        <p className="text-white/80 text-sm mt-2 flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          {images.length} photos
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Gallery Item Viewer Modal */}
      {selectedItem && (() => {
        const images = getImagesFromItem(selectedItem);
        const currentImage = images[selectedImageIndex] || '/placeholder-room.svg';

        return (
          <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>Gallery Image Viewer</DialogTitle>
                {selectedItem.description && (
                  <DialogDescription>{selectedItem.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="relative">
                {/* Main Image */}
                <div className="relative w-full aspect-video bg-black">
                  <Image
                    src={currentImage}
                    alt={`Gallery - ${selectedImageIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="95vw"
                    priority
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-room.svg';
                    }}
                  />
                  
                  {/* Navigation Arrows for multiple images */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all"
                        aria-label="Previous image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all"
                        aria-label="Next image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Info Section */}
                <div className="p-6 bg-background">
                  {selectedItem.description && (
                    <p className="text-muted-foreground text-lg">{selectedItem.description}</p>
                  )}
                  
                  {/* Thumbnail Grid for multiple images */}
                  {images.length > 1 && (
                    <div className="mt-4 grid grid-cols-6 gap-2">
                      {images.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                            selectedImageIndex === idx ? 'border-primary scale-105' : 'border-transparent hover:border-primary/50'
                          }`}
                          aria-label={`View image ${idx + 1}`}
                        >
                          <Image
                            src={url}
                            alt={`Thumbnail ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="100px"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-room.svg';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all z-10"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
      </div>
    </div>
  );
}
