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
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar as CalendarComponent } from "./ui/calendar"
import { Calendar, Loader2, Sparkles, Info, AlertCircle, FileText, X, QrCode } from "lucide-react"
import { API_URL } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAvailability } from "@/hooks/use-availability";
import { Alert, AlertDescription } from "./ui/alert";

import { Checkbox } from "./ui/checkbox"
import { ScrollArea } from "./ui/scroll-area"

interface EventBookingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DynamicPricing {
  event: {
    whole_day: number;
    evening: number;
    morning: number;
  };
}

export default function EventBookingModal({ isOpen, onClose }: EventBookingModalProps) {
  const router = useRouter()
  const { checkEventAvailability, getEventConflicts } = useAvailability()
  
  const [selectedEvent, setSelectedEvent] = useState<'whole_day' | 'evening' | 'morning' | null>(null)
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined)
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null)
  const [proofOfPaymentPreview, setProofOfPaymentPreview] = useState<string | null>(null)
  const [eventDetails, setEventDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Availability state
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null)
  const [availabilityType, setAvailabilityType] = useState<'info' | 'warning' | 'error'>('info')
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  
  // Dynamic pricing state
  const [pricing, setPricing] = useState<DynamicPricing | null>(null)
  const [loadingPricing, setLoadingPricing] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  
  // Terms and Conditions state
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

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
          event: { whole_day: 15000, evening: 10000, morning: 10000 },
        }

        settings.forEach((setting: any) => {
          if (setting.category === 'event') {
            grouped.event[setting.type as 'whole_day' | 'evening' | 'morning'] = Number(setting.price)
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
          event: { whole_day: 15000, evening: 10000, morning: 10000 },
        })
      } finally {
        setLoadingPricing(false)
      }
    }

    if (isOpen) {
      fetchPricing()
    }
  }, [isOpen])

  // Check availability when date or event type changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!bookingDate || !selectedEvent) {
        setAvailabilityMessage(null)
        setIsAvailable(true)
        return
      }
      
      setCheckingAvailability(true)
      const dateStr = bookingDate.toISOString().split('T')[0]
      
      const result = await checkEventAvailability(dateStr, selectedEvent)
      
      if (result) {
        setIsAvailable(result.available)
        
        if (!result.available) {
          setAvailabilityMessage(`⚠️ ${result.reason || 'This slot is not available'}`)
          setAvailabilityType('error')
        } else {
          setAvailabilityMessage('✅ This date and time slot is available for your event!')
          setAvailabilityType('info')
        }
      }
      
      setCheckingAvailability(false)
    }
    
    checkAvailability()
  }, [bookingDate, selectedEvent, checkEventAvailability])

  // Calculate total price dynamically
  const totalPrice = useMemo(() => {
    if (!pricing || !selectedEvent) return 0
    return pricing.event[selectedEvent]
  }, [pricing, selectedEvent])

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

  const handleBookEvent = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const isLoggedIn = !!(token && userStr);

    if (!isLoggedIn) {
      // Store booking data in sessionStorage
      const bookingData = {
        eventType: selectedEvent,
        bookingDate: bookingDate?.toISOString(),
        eventDetails,
        totalPrice,
        timestamp: new Date().toISOString()
      }
      sessionStorage.setItem('pendingEventBooking', JSON.stringify(bookingData))
      
      // Redirect to signup/login
      toast({
        title: "Login Required",
        description: "Please sign up or log in to complete your event booking",
      });
      router.push('/signup')
      return
    }

    // Validate required fields
    if (!selectedEvent || !bookingDate) {
      toast({
        title: "Missing Information",
        description: "Please select an event type and booking date",
        variant: "destructive",
      });
      return;
    }

    if (!proofOfPayment) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload proof of payment to proceed",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('event_type', selectedEvent);
      
      // Format date properly to avoid timezone offset issues
      const year = bookingDate.getFullYear();
      const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(bookingDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      formData.append('booking_date', localDateString);
      formData.append('event_details', eventDetails || '');
      formData.append('total_price', totalPrice.toString());
      formData.append('proof_of_payment', proofOfPayment);

      const response = await fetch(`${API_URL}/api/event_bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create event booking');
      }

      toast({
        title: "Booking Submitted Successfully! 🎉",
        description: `Your event booking for ₱${totalPrice.toLocaleString('en-PH')} has been submitted. Please wait for admin confirmation.`,
      });
      
      handleClose();
      
      // Refresh page to show updated bookings
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Event booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || 'Failed to book event. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const resetForm = () => {
    setSelectedEvent(null)
    setBookingDate(undefined)
    setProofOfPayment(null)
    setProofOfPaymentPreview(null)
    setEventDetails("")
    setAcceptedTerms(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

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
            <p className="text-lg font-medium">Loading event pricing...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto" style={{maxWidth: '800px'}}>
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Book Entire Resort for Your Event
          </DialogTitle>
          <DialogDescription className="text-base">
            Reserve the entire resort exclusively for your special occasion
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Event Type Selection */}
          <div>
            <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Select Event Package
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your preferred event time slot
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant={selectedEvent === 'whole_day' ? 'default' : 'outline'}
                className="h-auto flex-col items-start p-4 gap-1"
                onClick={() => setSelectedEvent(selectedEvent === 'whole_day' ? null : 'whole_day')}
              >
                <span className="font-bold text-base">Whole Day</span>
                <span className="text-xs opacity-80">9:00 AM - 5:00 PM</span>
                <span className="text-lg font-bold mt-1">
                  ₱{pricing.event.whole_day.toLocaleString('en-PH')}
                </span>
              </Button>

              <Button
                variant={selectedEvent === 'evening' ? 'default' : 'outline'}
                className="h-auto flex-col items-start p-4 gap-1"
                onClick={() => setSelectedEvent(selectedEvent === 'evening' ? null : 'evening')}
              >
                <span className="font-bold text-base">Evening</span>
                <span className="text-xs opacity-80">5:30 PM - 10:00 PM</span>
                <span className="text-lg font-bold mt-1">
                  ₱{pricing.event.evening.toLocaleString('en-PH')}
                </span>
              </Button>

              <Button
                variant={selectedEvent === 'morning' ? 'default' : 'outline'}
                className="h-auto flex-col items-start p-4 gap-1"
                onClick={() => setSelectedEvent(selectedEvent === 'morning' ? null : 'morning')}
              >
                <span className="font-bold text-base">Morning</span>
                <span className="text-xs opacity-80">9:00 AM - 5:00 PM</span>
                <span className="text-lg font-bold mt-1">
                  ₱{pricing.event.morning.toLocaleString('en-PH')}
                </span>
              </Button>
            </div>

            {selectedEvent && (
              <div className="mt-4 p-3 bg-primary/10 rounded-md">
                <p className="text-sm font-medium text-primary">
                  ✓ Event package selected: {selectedEvent === 'whole_day' ? 'Whole Day' : selectedEvent === 'evening' ? 'Evening' : 'Morning'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Entire resort will be exclusively yours during this time
                </p>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <h4 className="text-lg font-bold mb-3">Select Event Date</h4>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full h-12 justify-start text-left font-normal ${!bookingDate && "text-muted-foreground"}`}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  {bookingDate ? format(bookingDate, "PPPP") : "Pick your event date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={bookingDate}
                  onSelect={setBookingDate}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Availability Message */}
            {checkingAvailability && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking availability...</span>
              </div>
            )}
            
            {!checkingAvailability && availabilityMessage && (
              <Alert variant={availabilityType === 'error' ? 'destructive' : 'default'} className="mt-2">
                {availabilityType === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
                <AlertDescription className="text-sm">
                  {availabilityMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Event Details */}
          <div>
            <h4 className="text-lg font-bold mb-3">Event Details (Optional)</h4>
            <textarea
              placeholder="Tell us about your event (e.g., birthday party, corporate event, wedding reception, etc.)"
              value={eventDetails}
              onChange={(e) => setEventDetails(e.target.value)}
              className="w-full min-h-[100px] p-3 border rounded-md resize-y"
            />
          </div>

          {/* Payment Section */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4">Payment Summary</h4>
            
            {/* Price Breakdown */}
            <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
              {selectedEvent ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-primary">Event Booking</span>
                    <span className="font-semibold text-primary">
                      {selectedEvent === 'whole_day' ? 'Whole Day' : selectedEvent === 'evening' ? 'Evening' : 'Morning'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Time</span>
                    <span className="font-medium">
                      {selectedEvent === 'whole_day' ? '9:00 AM - 5:00 PM' : selectedEvent === 'evening' ? '5:30 PM - 10:00 PM' : '9:00 AM - 5:00 PM'}
                    </span>
                  </div>
                  {bookingDate && (
                    <div className="flex justify-between text-sm">
                      <span>Date</span>
                      <span className="font-medium">{format(bookingDate, "PPPP")}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-lg text-primary">₱{totalPrice.toLocaleString('en-PH')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Event package includes exclusive access to entire resort with all accommodations
                  </p>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Please select an event package to see pricing
                </p>
              )}
            </div>

            {selectedEvent && (
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
                    Amount: ₱{totalPrice.toLocaleString('en-PH')}
                  </p>
                </div>

                {/* Right: Upload Proof */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-proof-of-payment" className="text-base font-medium">
                      Upload Proof of Payment *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload a screenshot of your payment confirmation
                    </p>
                    <Input 
                      id="event-proof-of-payment"
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
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-2 py-2">
            <Checkbox
              id="event-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <label htmlFor="event-terms" className="text-sm text-muted-foreground leading-tight">
              By submitting a reservation, guests acknowledge that they have read, understood, and agreed to comply with these {" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-primary hover:underline font-medium"
              >
                Terms and Conditions
              </button>
              {" "}These policies are implemented to ensure a safe, organized, and hassle-free booking experience for all guests.
            </label>
          </div>

          {/* Book Now Button */}
          <Button 
            onClick={handleBookEvent} 
            className="w-full h-12 text-lg"
            disabled={
              !selectedEvent || 
              !bookingDate || 
              !proofOfPayment || 
              isSubmitting || 
              checkingAvailability ||
              !isAvailable ||
              !acceptedTerms
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : checkingAvailability ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Checking Availability...
              </>
            ) : selectedEvent ? (
              `Book Event - ₱${totalPrice.toLocaleString('en-PH')}`
            ) : (
              'Select Event Package'
            )}
          </Button>
          
          {!selectedEvent && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please select an event package to proceed
            </p>
          )}
          {selectedEvent && !bookingDate && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please select an event date to proceed
            </p>
          )}
          {selectedEvent && bookingDate && !proofOfPayment && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please upload proof of payment to proceed
            </p>
          )}
          {selectedEvent && bookingDate && !isAvailable && (
            <p className="text-sm text-center text-destructive mt-2">
              This date and time slot is not available. Please select another date or time slot.
            </p>
          )}
          {selectedEvent && bookingDate && proofOfPayment && isAvailable && !acceptedTerms && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please accept the Terms and Conditions to proceed
            </p>
          )}
        </div>
      </DialogContent>

      {/* Terms and Conditions Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Terms and Conditions - Event Booking
            </DialogTitle>
            <DialogDescription>
              To ensure a smooth, fair, and secure booking process at Elimar Spring Garden Resort, all guests are required to comply with the following terms and conditions:
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2 text-primary">1. Advance Payment Requirement</h3>
                <p className="text-muted-foreground">
                  All bookings must be fully paid during the reservation process. Guests are required to upload a valid proof of payment directly through the booking form before submitting their reservation. Late, delayed, or partial payments are not accepted. Any reservation submitted without full payment and verified proof of payment will not be confirmed.
                </p>
              </section>
              
              <section>
                <h3 className="font-semibold text-base mb-2 text-primary">2. Upload Proof of Payment</h3>
                <p className="text-muted-foreground">
                  Guests must upload a clear and valid proof of payment, such as an official receipt, screenshot, or confirmation from the selected payment channel. The uploaded proof must match the exact amount required for the reservation. Incorrect, unclear, or mismatched proof of payment may result in the booking being invalid.
                </p>
              </section>
              
              <section>
                <h3 className="font-semibold text-base mb-2 text-primary">3. Incomplete or Incorrect Payment</h3>
                <p className="text-muted-foreground">
                  If the submitted payment is less than the required amount or does not match the booking details, the reservation will not be processed. The guest will be notified, and the payment will either be refunded or corrected as necessary <strong>before the booking can be confirmed.</strong>
                </p>
              </section>
              
              <section>
                <h3 className="font-semibold text-base mb-2 text-primary">4. Payment Verification for Assistance</h3>
                <p className="text-muted-foreground">
                  <strong>Any booking assistance or processing by resort staff will only begin after full payment</strong> and valid proof of payment have been verified. No assistance will be provided for unpaid or unverified reservations.
                </p>
              </section>
              
              <section>
                <h3 className="font-semibold text-base mb-2 text-primary">5. Senior Citizen and PWD Discount Validation</h3>
                <p className="text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elimar Spring Garden Resort shall not be held liable for any injuries, accidents, or loss of personal belongings during the event. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit. Event organizers are advised to secure their own event insurance.
                </p>
              </section>
              
              <section>
                <h3 className="font-semibold text-base mb-2 text-primary">6. Force Majeure</h3>
                <p className="text-muted-foreground">
                  Guests who indicate Senior Citizen or PWD discounts during booking are required to present a valid Senior Citizen ID or PWD ID upon arrival at the resort. Failure to present a valid ID, or providing incorrect or misleading information, will result in the discount being revoked. Any misinformation will be discussed with the guest on-site and corrected accordingly.
                </p>
              </section>
              
              <section>
                <h3 className="font-semibold text-base mb-2 text-primary">7. Booking the Entire Resort</h3>
                <p className="text-muted-foreground">
                  Guests who wish to book the entire resort may place their reservation through the online booking system. However, due to the nature of exclusive bookings, additional arrangements and specific details—such as pricing adjustments, special requests, event requirements, and resort policies—must be discussed directly with the resort owner or authorized representative. After the online booking is submitted, the guest will be contacted by the owner, or the guest may contact the resort using the provided contact number to finalize and confirm all remaining details.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2 text-primary">8. Non-Refundable Payment and Rescheduling Policy</h3>
                <p className="text-muted-foreground">
                  All confirmed payments are non-refundable. However, if a guest is unable to arrive on the scheduled date, the resort may allow a one-time rescheduling to another available date. Rescheduling is subject to availability and must follow resort policies. Guests may contact the resort directly, or the resort may reach out to coordinate rescheduling arrangements.
                </p>
              </section> 
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowTermsModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setAcceptedTerms(true)
              setShowTermsModal(false)
            }}>
              I Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
