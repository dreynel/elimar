
"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, Home, Sparkles, Check, Star } from 'lucide-react'
import BookingModal from '@/components/BookingModal'
import EventBookingModal from '@/components/EventBookingModal'
import ReviewsModal from '@/components/ReviewsModal'
import { API_URL } from '@/lib/utils';

interface Accommodation {
  id: number;
  name: string;
  type: 'room' | 'cottage';
  description: string;
  capacity: string;
  price: number | string;
  inclusions: string;
  image_url: string;
  panoramic_url?: string;
}

export default function AccommodationsPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/accommodations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accommodations');
      }

      const data = await response.json();
      setAccommodations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accommodations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    setIsBookingModalOpen(true)
  }

  const handleCloseBooking = () => {
    setIsBookingModalOpen(false)
    setSelectedAccommodation(null)
  }

  const handleOpenEventModal = () => {
    setIsEventModalOpen(true)
  }

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false)
  }

  const AccommodationCard = ({ accommodation }: { accommodation: Accommodation }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [reviewCount, setReviewCount] = useState<number>(0);
    
    const refreshRating = () => {
      fetch(`${API_URL}/api/reviews/${accommodation.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setAverageRating(data.data.average || 0);
            setReviewCount(data.data.total || 0);
          }
        })
        .catch(err => console.error("Failed to load reviews", err));
    };

    useEffect(() => {
      refreshRating();
    }, [accommodation.id]);
    
    // Parse inclusions (split by newline if it's a string)
    const inclusionsList = accommodation.inclusions 
      ? accommodation.inclusions.split('\n').filter(item => item.trim()) 
      : [];

    // Format price (ensure it's a number)
    const formattedPrice = `₱${Number(accommodation.price).toFixed(2)}`;

    // Get full image URLs - handle JSON array or single image
    let imageUrls: string[] = ['/placeholder-room.svg'];
    try {
      if (accommodation.image_url) {
        // Try to parse as JSON array
        const parsedImages = JSON.parse(accommodation.image_url);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          imageUrls = parsedImages.map(img => 
            img.startsWith('http') ? img : `${API_URL}${img}`
          );
        } else {
          throw new Error('Not an array');
        }
      }
    } catch {
      // If not JSON, treat as single image path
      if (accommodation.image_url) {
        const singleImage = accommodation.image_url.startsWith('http') 
          ? accommodation.image_url 
          : `${API_URL}${accommodation.image_url}`;
        imageUrls = [singleImage];
      }
    }

    const handlePreviousImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
    };

    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 flex flex-col h-full">
        <div className="relative w-full aspect-[4/3] bg-muted group/image">
          <Image
            src={imageUrls[currentImageIndex]}
            alt={`${accommodation.name} - Image ${currentImageIndex + 1}`}
            fill
            style={{objectFit: "cover"}}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = '/placeholder-room.svg';
            }}
          />
          
          {/* Navigation Arrows - Only show if multiple images */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={handlePreviousImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Image Counter */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1} / {imageUrls.length}
              </div>
            </>
          )}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl font-bold">{accommodation.name}</CardTitle>
            <Badge variant="secondary" className="shrink-0">{accommodation.capacity}</Badge>
          </div>
          
          <div 
            className="flex items-center gap-1 mt-1 font-medium text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
            onClick={() => setIsReviewsOpen(true)}
          >
            <Star className={`w-4 h-4 ${averageRating > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            <span className={averageRating > 0 ? "text-foreground" : ""}>
              {averageRating > 0 ? averageRating.toFixed(1) : "New"}
            </span>
            <span>({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>

          <CardDescription className="line-clamp-2 text-base mt-2">{accommodation.description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-4 flex-1">
          <div className="space-y-3">
            <div className="text-2xl font-bold text-primary">{formattedPrice}</div>
            {accommodation.type === 'room' && inclusionsList.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2 text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Inclusions:
                </p>
                <ul className="text-sm space-y-1">
                  {inclusionsList.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                  {inclusionsList.length > 3 && (
                    <li className="text-xs italic text-muted-foreground ml-6">+ {inclusionsList.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-auto flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsReviewsOpen(true)} 
            className="w-1/3 h-11 border-primary/50 text-primary hover:bg-primary/5 font-semibold"
          >
            Reviews
          </Button>
          <Button 
            onClick={() => handleViewDetails(accommodation)} 
            className="w-2/3 h-11 text-base font-semibold transition-transform active:scale-95"
            size="lg"
          >
            Book Now
          </Button>
        </CardFooter>

        <ReviewsModal 
          isOpen={isReviewsOpen} 
          onClose={() => {
            setIsReviewsOpen(false);
            refreshRating();
          }} 
          accommodationId={accommodation.id} 
          accommodationName={accommodation.name} 
        />
      </Card>
    );
  };

  // Filter accommodations by type
  const cottages = accommodations.filter(acc => acc.type === 'cottage');
  const rooms = accommodations.filter(acc => acc.type === 'room');

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
            <Button onClick={fetchAccommodations}>Try Again</Button>
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
            Our Accommodations
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose from our selection of comfortable cottages and luxurious rooms for your perfect getaway
          </p>
        </div>

      {/* Book for an Event Button */}
      <div className="mb-8 flex justify-center">
        <Button 
          onClick={handleOpenEventModal}
          size="lg"
          className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
        >
          <Sparkles className="mr-2 h-6 w-6" />
          Book Entire Resort for an Event
        </Button>
      </div>

      <Tabs defaultValue="cottages" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10 h-12">
          <TabsTrigger value="cottages" className="text-base font-semibold">
            Cottages ({cottages.length})
          </TabsTrigger>
          <TabsTrigger value="rooms" className="text-base font-semibold">
            Rooms ({rooms.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="cottages">
          {cottages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Home className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No Cottages Available</h3>
              <p className="text-muted-foreground max-w-md">
                We currently don't have any cottages available. Please check back later or explore our rooms.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cottages.map((cottage) => (
                <AccommodationCard key={cottage.id} accommodation={cottage} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rooms">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Home className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No Rooms Available</h3>
              <p className="text-muted-foreground max-w-md">
                We currently don't have any rooms available. Please check back later or explore our cottages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map((room) => (
                <AccommodationCard key={room.id} accommodation={room} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      <BookingModal 
        accommodation={selectedAccommodation}
        isOpen={isBookingModalOpen}
        onClose={handleCloseBooking}
      />

      {/* Event Booking Modal */}
      <EventBookingModal 
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
      />
      </div>
    </div>
  )
}
