"use client"

import React, { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar as CalendarComponent } from "./ui/calendar"
import { Plus, Minus, Clock, Calendar, Loader2, AlertCircle, Info, Droplet, Sparkles, Check, Sun, Moon, QrCode } from "lucide-react"
import Accommodation3D from "./Accommodation3D"
import { API_URL } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAvailability, TimeSlotType } from "@/hooks/use-availability";
import { useTimeSlotSettings } from "@/contexts/TimeSlotContext";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import BookingConfirmationModal from "./BookingConfirmationModal";

interface Accommodation {
  id: number;
  name: string;
  type: 'room' | 'cottage';
  description: string;
  capacity: string;
  price: number | string;
  add_price?: number | string | null;
  inclusions: string;
  image_url: string;
  panoramic_url?: string;
  supports_morning?: boolean;
  supports_night?: boolean;
  supports_whole_day?: boolean;
}

interface BookingModalProps {
  accommodation: Accommodation | null
  isOpen: boolean
  onClose: () => void
}

interface DynamicPricing {
  entrance: {
    adult: number;
    kids: number;
    pwd: number;
    senior: number;
  };
  swimming: {
    adult: number;
    kids: number;
    pwd: number;
    senior: number;
  };
  night_swimming: {
    per_head: number;
  };
}

export default function BookingModal({ accommodation, isOpen, onClose }: BookingModalProps) {
  const router = useRouter()
  const { checkRegularAvailability, getUnavailableDates, getEventConflicts, getAvailableSlots } = useAvailability()
  const { getTimeSlotLabel, getTimeSlotDescription } = useTimeSlotSettings()
  
  const [adultCount, setAdultCount] = useState(0)
  const [kidCount, setKidCount] = useState(0)
  const [pwdCount, setPwdCount] = useState(0)
  const [seniorCount, setSeniorCount] = useState(0)
  const [adultSwimming, setAdultSwimming] = useState(0)
  const [kidSwimming, setKidSwimming] = useState(0)
  const [pwdSwimming, setPwdSwimming] = useState(0)
  const [seniorSwimming, setSeniorSwimming] = useState(0)
  const [overnightSwimming, setOvernightSwimming] = useState(false)
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null)
  const [proofOfPaymentPreview, setProofOfPaymentPreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotType | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Availability state
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])
  const [partiallyAvailableDates, setPartiallyAvailableDates] = useState<Map<string, TimeSlotType[]>>(new Map())
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null)
  const [availabilityType, setAvailabilityType] = useState<'info' | 'warning' | 'error'>('info')
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlotType[]>([])
  
  // Dynamic pricing state
  const [pricing, setPricing] = useState<DynamicPricing | null>(null)
  const [loadingPricing, setLoadingPricing] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  // Fetch dynamic pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoadingPricing(true)
        const [pricingRes, paymentRes] = await Promise.all([
          fetch(`${API_URL}/api/pricing`),
          fetch(`${API_URL}/api/payment-settings`)
        ])
        
        if (!pricingRes.ok) {
          throw new Error('Failed to fetch pricing')
        }

        const data = await pricingRes.json()
        const settings = data.data

        // Convert array to grouped object
        const grouped: DynamicPricing = {
          entrance: { adult: 70, kids: 50, pwd: 50, senior: 50 },
          swimming: { adult: 80, kids: 50, pwd: 50, senior: 50 },
          night_swimming: { per_head: 200 },
        }

        settings.forEach((setting: any) => {
          if (setting.category === 'entrance') {
            grouped.entrance[setting.type as 'adult' | 'kids' | 'pwd' | 'senior'] = Number(setting.price)
          } else if (setting.category === 'swimming') {
            grouped.swimming[setting.type as 'adult' | 'kids' | 'pwd' | 'senior'] = Number(setting.price)
          } else if (setting.category === 'night_swimming') {
            grouped.night_swimming.per_head = Number(setting.price)
          }
        })

        setPricing(grouped)
        
        // Fetch QR code
        if (paymentRes.ok) {
          const paymentData = await paymentRes.json()
          setQrCodeUrl(paymentData.data?.qr_code_url || null)
        }
      } catch (error) {
        console.error('Error fetching pricing:', error)
        // Use default values on error
        setPricing({
          entrance: { adult: 70, kids: 50, pwd: 50, senior: 50 },
          swimming: { adult: 80, kids: 50, pwd: 50, senior: 50 },
          night_swimming: { per_head: 200 },
        })
      } finally {
        setLoadingPricing(false)
      }
    }

    if (isOpen) {
      fetchPricing()
    }
  }, [isOpen])

  // Fetch unavailable dates when modal opens
  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (!isOpen || !accommodation) return
      
      const today = new Date()
      const threeMonthsLater = new Date()
      threeMonthsLater.setMonth(today.getMonth() + 3)
      
      const startDate = today.toISOString().split('T')[0]
      const endDate = threeMonthsLater.toISOString().split('T')[0]
      
      const result = await getUnavailableDates(accommodation.id, startDate, endDate)
      
      if (result) {
        setUnavailableDates(result.dates)
        
        // Store partially available dates
        const partialMap = new Map<string, TimeSlotType[]>()
        result.partiallyAvailable.forEach(item => {
          partialMap.set(item.date, item.availableSlots as TimeSlotType[])
        })
        setPartiallyAvailableDates(partialMap)
      }
    }
    
    fetchUnavailableDates()
  }, [isOpen, accommodation, getUnavailableDates])

  // Auto-enable overnight swimming for Night/Whole Day time slots (only for cottages, not rooms)
  useEffect(() => {
    // Rooms + Night/Whole Day = FREE swimming, so no need to auto-enable overnight swimming
    if (accommodation?.type === 'room') {
      // For rooms, don't auto-enable overnight swimming
      setOvernightSwimming(false)
    } else if (selectedTimeSlot === 'night' || selectedTimeSlot === 'whole_day') {
      // For cottages with Night/Whole Day, auto-enable overnight swimming
      setOvernightSwimming(true)
    } else {
      // Reset to false when switching to morning
      setOvernightSwimming(false)
    }
  }, [selectedTimeSlot, accommodation?.type])

  // Check availability when date changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!bookingDate || !accommodation) {
        setAvailabilityMessage(null)
        setAvailableTimeSlots([])
        setSelectedTimeSlot(null)
        return
      }
      
      setCheckingAvailability(true)
      
      // Format date properly to avoid timezone offset issues
      const year = bookingDate.getFullYear()
      const month = String(bookingDate.getMonth() + 1).padStart(2, '0')
      const day = String(bookingDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      // First check event conflicts
      const eventConflicts = await getEventConflicts(dateStr)
      
      if (eventConflicts) {
        if (eventConflicts.hasWholeDay) {
          setAvailabilityMessage('⚠️ This date is reserved for a whole-day event. Please select another date.')
          setAvailabilityType('error')
          setAvailableTimeSlots([])
          setSelectedTimeSlot(null)
          setCheckingAvailability(false)
          return
        }
        
        if (eventConflicts.hasMorning && eventConflicts.hasEvening) {
          setAvailabilityMessage('⚠️ This date has both morning and evening events. Please select another date.')
          setAvailabilityType('error')
          setAvailableTimeSlots([])
          setSelectedTimeSlot(null)
          setCheckingAvailability(false)
          return
        }
      }
      
      // Get available slots for this accommodation
      const slots = await getAvailableSlots(accommodation.id, dateStr)
      
      if (slots && slots.length > 0) {
        // Filter slots based on accommodation type
        // Cottages: morning or night only
        // Rooms: morning, night, or whole_day
        let filteredSlots = slots
        if (accommodation.type === 'cottage') {
          filteredSlots = slots.filter(s => s !== 'whole_day')
        }
        
        if (filteredSlots.length === 0) {
          setAvailabilityMessage('⚠️ No time slots available for this accommodation on this date.')
          setAvailabilityType('error')
          setAvailableTimeSlots([])
          setSelectedTimeSlot(null)
        } else if (filteredSlots.length < 3) {
          setAvailabilityMessage(`Limited availability: ${filteredSlots.map(s => getTimeSlotLabel(s)).join(', ')} slot(s) available.`)
          setAvailabilityType('info')
          setAvailableTimeSlots(filteredSlots)
          // Auto-select if only one slot
          if (filteredSlots.length === 1) {
            setSelectedTimeSlot(filteredSlots[0])
          }
        } else {
          setAvailabilityMessage('✅ This date is available!')
          setAvailabilityType('info')
          setAvailableTimeSlots(filteredSlots)
        }
      } else {
        setAvailabilityMessage('⚠️ This accommodation is fully booked for this date.')
        setAvailabilityType('error')
        setAvailableTimeSlots([])
        setSelectedTimeSlot(null)
      }
      
      setCheckingAvailability(false)
    }
    
    checkAvailability()
  }, [bookingDate, accommodation, getEventConflicts, getAvailableSlots])

  // Check if using night swimming rate (Night or Whole Day slot)
  const isNightOrWholeDay = selectedTimeSlot === 'night' || selectedTimeSlot === 'whole_day'
  
  // Check if Room type (FREE swimming for all time slots)
  const isRoomFreeSwimming = accommodation?.type === 'room'
  
  // Calculate total swimming guests
  const totalSwimmingGuests = adultSwimming + kidSwimming + pwdSwimming + seniorSwimming

  // Calculate total price dynamically
  const totalPrice = useMemo(() => {
    if (!accommodation || !pricing) return 0

    let total = 0

    // For rooms with night or whole_day slot, use add_price (which is the same for both) instead of base price
    if (accommodation.type === 'room' && (selectedTimeSlot === 'night' || selectedTimeSlot === 'whole_day') && accommodation.add_price) {
      total += Number(accommodation.add_price)
    } else {
      // Add accommodation base price (ensure it's a number)
      total += Number(accommodation.price)
    }

    // Add entrance fees only
    total += adultCount * pricing.entrance.adult
    total += kidCount * pricing.entrance.kids
    total += pwdCount * pricing.entrance.pwd
    total += seniorCount * pricing.entrance.senior

    // Swimming fees:
    // Priority 1: Rooms = FREE swimming (all time slots)
    // Priority 2: Cottages + Night/Whole Day = ₱200 per head
    // Priority 3: Cottages + Morning = Daytime rates
    if (isRoomFreeSwimming) {
      // Rooms: Swimming is FREE (included) for all time slots
      // No swimming charges added
    } else if (isNightOrWholeDay) {
      // Cottages + Night/Whole Day: ₱200 per head flat rate for all swimming guests
      total += totalSwimmingGuests * pricing.night_swimming.per_head
    } else {
      // Morning: Use individual daytime swimming rates
      total += adultSwimming * pricing.swimming.adult
      total += kidSwimming * pricing.swimming.kids
      total += pwdSwimming * pricing.swimming.pwd
      total += seniorSwimming * pricing.swimming.senior
    }

    // Add overnight swimming fee for cottages (only when not already using night rate)
    // For Night/Whole Day, the ₱200 rate already includes night swimming
    if (overnightSwimming && accommodation.type === 'cottage' && !isNightOrWholeDay) {
      total += totalSwimmingGuests * pricing.night_swimming.per_head
    }

    return total
  }, [accommodation, pricing, adultCount, kidCount, pwdCount, seniorCount, adultSwimming, kidSwimming, pwdSwimming, seniorSwimming, overnightSwimming, selectedTimeSlot, isNightOrWholeDay, isRoomFreeSwimming, totalSwimmingGuests])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProofOfPayment(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofOfPaymentPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBookNow = () => {
    // Check if user is logged in by checking localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const isLoggedIn = !!(token && userStr);

    if (!isLoggedIn) {
      // Store booking data in sessionStorage
      const bookingData = {
        accommodationId: accommodation?.id,
        accommodationName: accommodation?.name,
        adults: adultCount,
        kids: kidCount,
        pwd: pwdCount,
        senior: seniorCount,
        timeSlot: selectedTimeSlot,
        overnightSwimming,
        totalPrice,
        timestamp: new Date().toISOString()
      }
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData))
      
      // Redirect to signup/login
      toast({
        title: "Login Required",
        description: "Please sign up or log in to complete your booking",
      });
      router.push('/signup')
      return
    }

    // Validate required fields
    if (!bookingDate) {
      toast({
        title: "Missing Information",
        description: "Please select a booking date",
        variant: "destructive",
      });
      return
    }

    if (!selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select a time slot",
        variant: "destructive",
      });
      return
    }

    if (adultCount + kidCount + pwdCount + seniorCount === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one guest",
        variant: "destructive",
      });
      return
    }

    if (!proofOfPayment) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload proof of payment to proceed",
        variant: "destructive",
      });
      return
    }

    // Open confirmation modal instead of submitting directly
    setIsConfirmationModalOpen(true)
  }

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token');

      // Create FormData for multipart/form-data request
      const formData = new FormData()
      formData.append('accommodation_id', accommodation!.id.toString())
      
      // Format date properly to avoid timezone offset issues
      const year = bookingDate!.getFullYear()
      const month = String(bookingDate!.getMonth() + 1).padStart(2, '0')
      const day = String(bookingDate!.getDate()).padStart(2, '0')
      const localDateString = `${year}-${month}-${day}`
      
      formData.append('check_in_date', localDateString)
      formData.append('time_slot', selectedTimeSlot!) // Use the selected time slot
      formData.append('adults', adultCount.toString())
      formData.append('kids', kidCount.toString())
      formData.append('pwd', pwdCount.toString())
      formData.append('senior', seniorCount.toString())
      formData.append('adult_swimming', adultSwimming.toString())
      formData.append('kid_swimming', kidSwimming.toString())
      formData.append('pwd_swimming', pwdSwimming.toString())
      formData.append('senior_swimming', seniorSwimming.toString())
      formData.append('overnight_stay', (selectedTimeSlot === 'whole_day').toString())
      formData.append('overnight_swimming', overnightSwimming.toString())
      formData.append('total_price', totalPrice.toString())
      formData.append('proof_of_payment', proofOfPayment!)

      // Send booking to API
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking')
      }

      toast({
        title: "Booking Submitted Successfully! 🎉",
        description: `Your booking for ₱${totalPrice.toLocaleString('en-PH')} has been submitted. Please wait for admin confirmation.`,
      });
      
      // Close both modals
      setIsConfirmationModalOpen(false)
      handleClose()
      
      // Optionally redirect to bookings page
      setTimeout(() => router.push('/client/accommodations'), 1000)
    } catch (error) {
      console.error('Booking error:', error)
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : 'Failed to submit booking. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setAdultCount(0)
    setKidCount(0)
    setPwdCount(0)
    setSeniorCount(0)
    setAdultSwimming(0)
    setKidSwimming(0)
    setPwdSwimming(0)
    setSeniorSwimming(0)
    setOvernightSwimming(false)
    setProofOfPayment(null)
    setProofOfPaymentPreview(null)
    setBookingDate(undefined)
    setSelectedTimeSlot(null)
    setAvailableTimeSlots([])
    setCurrentImageIndex(0)
  }

  const handleClose = () => {
    resetForm()
    setActiveTab("details")
    onClose()
  }

  if (!accommodation) return null

  // Show loading state while fetching pricing
  if (loadingPricing || !pricing) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loading</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading pricing information...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Handle multiple images stored as JSON array or single image string
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

  const panoramicUrl = accommodation.panoramic_url?.startsWith('http')
    ? accommodation.panoramic_url
    : accommodation.panoramic_url ? `${API_URL}${accommodation.panoramic_url}` : null;

  // Parse inclusions (split by newline if it's a string)
  const inclusionsList = accommodation.inclusions 
    ? accommodation.inclusions.split('\n').filter(item => item.trim()) 
    : [];

  // Format price
  const formattedPrice = `₱${accommodation.price.toLocaleString()}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto" style={{maxWidth: '900px'}}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{accommodation.name}</DialogTitle>
          <DialogDescription className="text-sm">
            Complete your booking details below
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12">
            <TabsTrigger value="details" className="text-base">Booking Details</TabsTrigger>
            <TabsTrigger value="panoramic" className="text-base">360° View</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
          {/* Top Section: Image and Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left: Image */}
            <div className="w-full rounded-xl overflow-hidden shadow-lg bg-muted border">
              <div className="relative w-full aspect-[4/3] group/image">
                <Image
                  src={imageUrls[currentImageIndex]}
                  alt={`${accommodation.name} - Image ${currentImageIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{objectFit: "cover"}}
                  priority
                  onError={(e) => {
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
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-3">{accommodation.name}</h3>
                <Badge variant="outline" className="mb-3 px-3 py-1 text-sm">
                  {accommodation.type === 'room' ? 'Room' : 'Cottage'}
                </Badge>
                <p className="text-base leading-relaxed text-muted-foreground">{accommodation.description}</p>
              </div>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Capacity:</span>
                  <span className="text-sm font-medium">{accommodation.capacity}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-semibold">Base Price:</span>
                  <span className="text-xl font-bold text-primary">{formattedPrice}</span>
                </div>
              </div>

              {inclusionsList.length > 0 && (
                <div>
                  <p className="text-sm font-bold mb-3 text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Inclusions:
                  </p>
                  <ul className="space-y-2">
                    {inclusionsList.map((item, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <Check className="mr-2 h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Guest Count Controls */}
          <div className="mb-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">Number of Guests</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Adults */}
              <div className="flex items-center justify-between p-4 border-2 rounded-lg shadow-sm bg-card hover:border-primary/50 transition-colors">
                <div>
                  <Label className="text-sm font-semibold">Adults</Label>
                  <p className="text-xs text-muted-foreground">Age 18+</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setAdultCount(Math.max(0, adultCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{adultCount}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setAdultCount(adultCount + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Kids */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Kids</Label>
                  <p className="text-xs text-muted-foreground">Under 18</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setKidCount(Math.max(0, kidCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{kidCount}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setKidCount(kidCount + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* PWD */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">PWD</Label>
                  <p className="text-xs text-muted-foreground">With ID</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setPwdCount(Math.max(0, pwdCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{pwdCount}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setPwdCount(pwdCount + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Senior */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Senior</Label>
                  <p className="text-xs text-muted-foreground">With ID</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setSeniorCount(Math.max(0, seniorCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{seniorCount}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setSeniorCount(seniorCount + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Swimming Fee Checkboxes */}
          {(adultCount > 0 || kidCount > 0 || pwdCount > 0 || seniorCount > 0) && (
            <div className="mb-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Droplet className="h-5 w-5 text-blue-500" />
                Swimming Add-ons
                {isRoomFreeSwimming && (
                  <span className="text-xs font-normal bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                    Included FREE
                  </span>
                )}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                {isRoomFreeSwimming
                  ? 'Swimming is included FREE for all Room bookings'
                  : isNightOrWholeDay 
                    ? `Select which guests will be swimming (₱${pricing?.night_swimming.per_head} per head)`
                    : `Select which guests will be swimming (₱${pricing?.swimming.adult} per adult, ₱${pricing?.swimming.kids} per kid, ₱${pricing?.swimming.pwd} per PWD, ₱${pricing?.swimming.senior} per senior)`
                }
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Adult Swimming */}
                {adultCount > 0 && (
                  <div className={`p-4 border rounded-lg ${isRoomFreeSwimming ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Adult Swimming</Label>
                      <span className={`text-xs ${isRoomFreeSwimming ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
                        {isRoomFreeSwimming ? 'FREE' : `₱${isNightOrWholeDay ? pricing?.night_swimming.per_head : pricing?.swimming.adult} each`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAdultSwimming(Math.max(0, adultSwimming - 1))}
                        disabled={adultSwimming === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-16 text-center font-medium">
                        {adultSwimming} / {adultCount}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAdultSwimming(Math.min(adultCount, adultSwimming + 1))}
                        disabled={adultSwimming >= adultCount}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className={`text-xs mt-2 ${isRoomFreeSwimming ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {isRoomFreeSwimming 
                        ? 'Included in room booking'
                        : `Subtotal: ₱${(adultSwimming * (isNightOrWholeDay ? (pricing?.night_swimming.per_head || 0) : (pricing?.swimming.adult || 0))).toLocaleString()}`
                      }
                    </p>
                  </div>
                )}

                {/* Kid Swimming */}
                {kidCount > 0 && (
                  <div className={`p-4 border rounded-lg ${isRoomFreeSwimming ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Kid Swimming</Label>
                      <span className={`text-xs ${isRoomFreeSwimming ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
                        {isRoomFreeSwimming ? 'FREE' : `₱${isNightOrWholeDay ? pricing?.night_swimming.per_head : pricing?.swimming.kids} each`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setKidSwimming(Math.max(0, kidSwimming - 1))}
                        disabled={kidSwimming === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-16 text-center font-medium">
                        {kidSwimming} / {kidCount}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setKidSwimming(Math.min(kidCount, kidSwimming + 1))}
                        disabled={kidSwimming >= kidCount}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className={`text-xs mt-2 ${isRoomFreeSwimming ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {isRoomFreeSwimming 
                        ? 'Included in room booking'
                        : `Subtotal: ₱${(kidSwimming * (isNightOrWholeDay ? (pricing?.night_swimming.per_head || 0) : (pricing?.swimming.kids || 0))).toLocaleString()}`
                      }
                    </p>
                  </div>
                )}

                {/* PWD Swimming */}
                {pwdCount > 0 && (
                  <div className={`p-4 border rounded-lg ${isRoomFreeSwimming ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">PWD Swimming</Label>
                      <span className={`text-xs ${isRoomFreeSwimming ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
                        {isRoomFreeSwimming ? 'FREE' : `₱${isNightOrWholeDay ? pricing?.night_swimming.per_head : pricing?.swimming.pwd} each`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPwdSwimming(Math.max(0, pwdSwimming - 1))}
                        disabled={pwdSwimming === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-16 text-center font-medium">
                        {pwdSwimming} / {pwdCount}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPwdSwimming(Math.min(pwdCount, pwdSwimming + 1))}
                        disabled={pwdSwimming >= pwdCount}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className={`text-xs mt-2 ${isRoomFreeSwimming ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {isRoomFreeSwimming 
                        ? 'Included in room booking'
                        : `Subtotal: ₱${(pwdSwimming * (isNightOrWholeDay ? (pricing?.night_swimming.per_head || 0) : (pricing?.swimming.pwd || 0))).toLocaleString()}`
                      }
                    </p>
                  </div>
                )}

                {/* Senior Swimming */}
                {seniorCount > 0 && (
                  <div className={`p-4 border rounded-lg ${isRoomFreeSwimming ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Senior Swimming</Label>
                      <span className={`text-xs ${isRoomFreeSwimming ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
                        {isRoomFreeSwimming ? 'FREE' : `₱${isNightOrWholeDay ? pricing?.night_swimming.per_head : pricing?.swimming.senior} each`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSeniorSwimming(Math.max(0, seniorSwimming - 1))}
                        disabled={seniorSwimming === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-16 text-center font-medium">
                        {seniorSwimming} / {seniorCount}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSeniorSwimming(Math.min(seniorCount, seniorSwimming + 1))}
                        disabled={seniorSwimming >= seniorCount}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className={`text-xs mt-2 ${isRoomFreeSwimming ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {isRoomFreeSwimming 
                        ? 'Included in room booking'
                        : `Subtotal: ₱${(seniorSwimming * (isNightOrWholeDay ? (pricing?.night_swimming.per_head || 0) : (pricing?.swimming.senior || 0))).toLocaleString()}`
                      }
                    </p>
                  </div>
                )}
              </div>
              
              {/* Night/Whole Day Swimming Notice - Only for Cottages */}
              {isNightOrWholeDay && !isRoomFreeSwimming && totalSwimmingGuests > 0 && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg mt-4">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    <Moon className="h-4 w-4 inline mr-2" />
                    <strong>Night Swimming Rate Applied:</strong> All swimming guests are charged ₱{pricing?.night_swimming.per_head} per head for {selectedTimeSlot === 'whole_day' ? 'Whole Day' : 'Night'} bookings.
                  </p>
                </div>
              )}
              
              {/* Rooms FREE Swimming Notice */}
              {isRoomFreeSwimming && totalSwimmingGuests > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg mt-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <Droplet className="h-4 w-4 inline mr-2" />
                    <strong>Swimming Included FREE:</strong> All room bookings include free swimming for all guests.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Booking Time and Date Selection */}
          <div className="mb-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Booking Date & Time Slot
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-date" className="text-sm font-medium">
                  Select Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full h-11 justify-start text-left font-normal ${!bookingDate && "text-muted-foreground"}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {bookingDate ? format(bookingDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={bookingDate}
                      onSelect={setBookingDate}
                      disabled={(date) => {
                        // Disable past dates
                        if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
                          return true
                        }
                        
                        // Disable dates with whole-day events or fully booked
                        const dateStr = date.toISOString().split('T')[0]
                        return unavailableDates.includes(dateStr)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Choose your booking date
                </p>
                
                {/* Availability Message */}
                {checkingAvailability && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking availability...</span>
                  </div>
                )}
                
                {!checkingAvailability && availabilityMessage && (
                  <Alert variant={availabilityType === 'error' ? 'destructive' : 'default'} className="mt-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {availabilityMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* Time Slot Selection */}
              {bookingDate && availableTimeSlots.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Select Time Slot
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {availableTimeSlots.includes('morning') && (
                      <button
                        type="button"
                        onClick={() => setSelectedTimeSlot('morning')}
                        className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2 ${
                          selectedTimeSlot === 'morning' 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <Sun className={`h-6 w-6 ${selectedTimeSlot === 'morning' ? 'text-primary' : 'text-amber-500'}`} />
                        <span className="font-semibold">{getTimeSlotLabel('morning')}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeSlotDescription('morning', accommodation?.type)}
                        </span>
                      </button>
                    )}
                    
                    {availableTimeSlots.includes('night') && (
                      <button
                        type="button"
                        onClick={() => setSelectedTimeSlot('night')}
                        className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2 ${
                          selectedTimeSlot === 'night' 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <Moon className={`h-6 w-6 ${selectedTimeSlot === 'night' ? 'text-primary' : 'text-indigo-500'}`} />
                        <span className="font-semibold">{getTimeSlotLabel('night')}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeSlotDescription('night', accommodation?.type)}
                        </span>
                      </button>
                    )}
                    
                    {availableTimeSlots.includes('whole_day') && accommodation?.type === 'room' && (
                      <button
                        type="button"
                        onClick={() => setSelectedTimeSlot('whole_day')}
                        className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2 ${
                          selectedTimeSlot === 'whole_day' 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <div className="flex gap-1">
                          <Sun className={`h-5 w-5 ${selectedTimeSlot === 'whole_day' ? 'text-primary' : 'text-amber-500'}`} />
                          <Moon className={`h-5 w-5 ${selectedTimeSlot === 'whole_day' ? 'text-primary' : 'text-indigo-500'}`} />
                        </div>
                        <span className="font-semibold">{getTimeSlotLabel('whole_day')}</span>
                        <span className="text-xs text-muted-foreground">{getTimeSlotDescription('whole_day', accommodation?.type)}</span>
                        {accommodation?.add_price && (
                          <Badge variant="secondary" className="mt-1">
                            ₱{Number(accommodation.add_price).toLocaleString('en-PH')}
                          </Badge>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {!selectedTimeSlot && (
                    <p className="text-xs text-muted-foreground">
                      Please select a time slot for your booking
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Checkboxes for Overnight Options - Show based on accommodation type */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4">Additional Options</h4>
            <div className="space-y-3">
              {/* Overnight Swimming - Only for Cottages */}
              {accommodation.type === 'cottage' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="overnight-swimming" 
                    checked={overnightSwimming}
                    onCheckedChange={(checked) => {
                      // Only allow changes if not Night/Whole Day and not Morning
                      if (!isNightOrWholeDay && selectedTimeSlot !== 'morning') {
                        setOvernightSwimming(checked as boolean)
                      }
                    }}
                    disabled={isNightOrWholeDay || selectedTimeSlot === 'morning'}
                  />
                  <Label 
                    htmlFor="overnight-swimming" 
                    className={`text-sm font-medium leading-none cursor-pointer ${isNightOrWholeDay || selectedTimeSlot === 'morning' ? 'text-muted-foreground' : ''}`}
                  >
                    Overnight Swimming (Night Swimming - ₱{pricing.night_swimming.per_head.toLocaleString('en-PH')} per head)
                    {isNightOrWholeDay && (
                      <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                        (Auto-included for {selectedTimeSlot === 'whole_day' ? 'Whole Day' : 'Night'} bookings)
                      </span>
                    )}
                    {selectedTimeSlot === 'morning' && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Not available for Morning bookings)
                      </span>
                    )}
                  </Label>
                </div>
              )}
              
              {/* Info message about time slots */}
              {accommodation.type === 'room' && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Info className="h-4 w-4 inline mr-2" />
                    {selectedTimeSlot === 'night'
                      ? `You've selected the Night slot (₱${Number(accommodation.add_price || accommodation.price).toLocaleString('en-PH')}). Whole Day slot is available at the same price.`
                      : selectedTimeSlot === 'whole_day' 
                      ? `You've selected the Whole Day slot (₱${Number(accommodation.add_price || accommodation.price).toLocaleString('en-PH')}). This includes access from 9 AM to 10 PM.`
                      : `Night and Whole Day time slots are available at ₱${Number(accommodation.add_price || accommodation.price).toLocaleString('en-PH')}.`
                    }
                  </p>
                </div>
              )}
              
              {accommodation.type === 'cottage' && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Info className="h-4 w-4 inline mr-2" />
                    Cottages can be booked for Morning or Night slots.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="mb-6 border-t pt-6">
            <h4 className="text-lg font-semibold mb-4">Payment Summary</h4>
            
            {/* Price Breakdown */}
            <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Accommodation ({accommodation.name})
                  {selectedTimeSlot && ` - ${getTimeSlotLabel(selectedTimeSlot)}`}
                </span>
                <span className="font-medium">
                  ₱{(accommodation.type === 'room' && (selectedTimeSlot === 'night' || selectedTimeSlot === 'whole_day') && accommodation.add_price 
                    ? Number(accommodation.add_price) 
                    : Number(accommodation.price)
                  ).toFixed(2)}
                </span>
              </div>
              
              {adultCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Adults ({adultCount}) - Entrance Fee</span>
                  <span className="font-medium">
                    ₱{(adultCount * pricing.entrance.adult).toFixed(2)}
                  </span>
                </div>
              )}
              
              {kidCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Kids ({kidCount}) - Entrance Fee</span>
                  <span className="font-medium">
                    ₱{(kidCount * pricing.entrance.kids).toFixed(2)}
                  </span>
                </div>
              )}
              
              {pwdCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>PWD ({pwdCount}) - Entrance Fee</span>
                  <span className="font-medium">
                    ₱{(pwdCount * pricing.entrance.pwd).toFixed(2)}
                  </span>
                </div>
              )}
              
              {seniorCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Senior ({seniorCount}) - Entrance Fee</span>
                  <span className="font-medium">
                    ₱{(seniorCount * pricing.entrance.senior).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Morning Swimming Fees - Cottages: Individual rates, Rooms: FREE */}
              {adultSwimming > 0 && !isNightOrWholeDay && !isRoomFreeSwimming && (
                <div className="flex justify-between text-sm">
                  <span>Adults ({adultSwimming}) - Swimming Fee</span>
                  <span className="font-medium">
                    ₱{(adultSwimming * pricing.swimming.adult).toFixed(2)}
                  </span>
                </div>
              )}

              {kidSwimming > 0 && !isNightOrWholeDay && !isRoomFreeSwimming && (
                <div className="flex justify-between text-sm">
                  <span>Kids ({kidSwimming}) - Swimming Fee</span>
                  <span className="font-medium">
                    ₱{(kidSwimming * pricing.swimming.kids).toFixed(2)}
                  </span>
                </div>
              )}

              {pwdSwimming > 0 && !isNightOrWholeDay && !isRoomFreeSwimming && (
                <div className="flex justify-between text-sm">
                  <span>PWD ({pwdSwimming}) - Swimming Fee</span>
                  <span className="font-medium">
                    ₱{(pwdSwimming * pricing.swimming.pwd).toFixed(2)}
                  </span>
                </div>
              )}

              {seniorSwimming > 0 && !isNightOrWholeDay && !isRoomFreeSwimming && (
                <div className="flex justify-between text-sm">
                  <span>Senior ({seniorSwimming}) - Swimming Fee</span>
                  <span className="font-medium">
                    ₱{(seniorSwimming * pricing.swimming.senior).toFixed(2)}
                  </span>
                </div>
              )}
              
              {/* Rooms FREE Swimming - All time slots */}
              {isRoomFreeSwimming && totalSwimmingGuests > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Swimming ({totalSwimmingGuests} {totalSwimmingGuests === 1 ? 'guest' : 'guests'}) - Included</span>
                  <span className="font-medium text-green-600 dark:text-green-400">FREE</span>
                </div>
              )}
              
              {/* Night/Whole Day Swimming - Cottages only: ₱200/head */}
              {isNightOrWholeDay && !isRoomFreeSwimming && totalSwimmingGuests > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Night Swimming ({totalSwimmingGuests} {totalSwimmingGuests === 1 ? 'guest' : 'guests'}) @ ₱{pricing.night_swimming.per_head}/head</span>
                  <span className="font-medium">
                    ₱{(totalSwimmingGuests * pricing.night_swimming.per_head).toFixed(2)}
                  </span>
                </div>
              )}
              
              {/* Cottage overnight swimming add-on (only for morning slot) */}
              {overnightSwimming && accommodation.type === 'cottage' && !isNightOrWholeDay && totalSwimmingGuests > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Night Swimming Add-on ({totalSwimmingGuests} {totalSwimmingGuests === 1 ? 'guest' : 'guests'})</span>
                  <span className="font-medium">
                    ₱{(totalSwimmingGuests * pricing.night_swimming.per_head).toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2 flex justify-between">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-lg text-primary">₱{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: QR Code */}
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted">
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4 border-2 overflow-hidden">
                  {qrCodeUrl ? (
                    <Image
                      src={qrCodeUrl.startsWith('http') ? qrCodeUrl : `${API_URL}${qrCodeUrl}`}
                      alt="Payment QR Code"
                      width={180}
                      height={180}
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <QrCode className="w-24 h-24 mb-2" />
                      <p className="text-sm text-center">QR Code Not Available</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-center text-muted-foreground font-medium">
                  Scan to pay via GCash or PayMaya
                </p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Elimar Spring Garden Resort
                </p>
                <p className="text-sm text-center font-bold text-primary mt-2">
                  Amount: ₱{totalPrice.toFixed(2)}
                </p>
              </div>

              {/* Right: Upload Proof */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proof-of-payment" className="text-base font-medium">
                    Upload Proof of Payment
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload a screenshot of your payment confirmation
                  </p>
                  <Input 
                    id="proof-of-payment"
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {proofOfPayment && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-green-600">
                        ✓ {proofOfPayment.name}
                      </p>
                      {proofOfPaymentPreview && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-green-500">
                          <Image
                            src={proofOfPaymentPreview}
                            alt="Payment proof preview"
                            fill
                            style={{objectFit: "contain"}}
                            className="bg-muted"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Payment Instructions:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Scan the QR code with your payment app</li>
                    <li>Complete the payment</li>
                    <li>Take a screenshot of the confirmation</li>
                    <li>Upload the screenshot above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Book Now Button */}
          <Button 
            onClick={handleBookNow} 
            className="w-full h-12 text-lg"
            disabled={
              !bookingDate || 
              !selectedTimeSlot ||
              adultCount + kidCount + pwdCount === 0 || 
              !proofOfPayment || 
              availabilityType === 'error' ||
              availableTimeSlots.length === 0 ||
              checkingAvailability
            }
          >
            {checkingAvailability ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking Availability...
              </>
            ) : (
              `Book Now - ₱${totalPrice.toFixed(2)}`
            )}
          </Button>
          
          {!bookingDate && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please select a booking date to proceed
            </p>
          )}
          {bookingDate && !selectedTimeSlot && availableTimeSlots.length > 0 && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please select a time slot to proceed
            </p>
          )}
          {bookingDate && (adultCount + kidCount + pwdCount === 0) && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please add at least one guest to proceed
            </p>
          )}
          {bookingDate && availableTimeSlots.length === 0 && (
            <p className="text-sm text-center text-destructive mt-2">
              This date is not available. Please select another date.
            </p>
          )}
          {bookingDate && selectedTimeSlot && !proofOfPayment && (adultCount + kidCount + pwdCount > 0) && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please upload proof of payment to proceed
            </p>
          )}
          </TabsContent>

          <TabsContent value="panoramic" className="mt-6">
            {panoramicUrl ? (
              <div className="space-y-4">
                <Accommodation3D
                  imageUrl={panoramicUrl}
                  height="600px"
                  visible={activeTab === "panoramic" && isOpen}
                  className="rounded-xl overflow-hidden shadow-2xl border-4 border-primary/20"
                  onReady={() => console.log('Panorama loaded for:', accommodation.name)}
                  onError={(err) => console.error('Panorama error:', err)}
                />
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">Interactive 360° Tour</p>
                  <div className="flex justify-center gap-8 text-sm text-muted-foreground">
                    <span>Click & drag to look around</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-xl bg-muted p-16 text-center border-2 border-dashed">
                <div className="text-6xl mb-4">🚫</div>
                <p className="text-xl font-semibold text-muted-foreground">No 360° view available</p>
                <p className="text-sm text-muted-foreground mt-2">Please check the regular images in the Booking Details tab</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Booking Confirmation Modal */}
        <BookingConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          onConfirm={handleConfirmSubmit}
          totalPrice={totalPrice}
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
