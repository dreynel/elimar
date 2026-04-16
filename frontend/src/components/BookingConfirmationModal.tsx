"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"
import { ScrollArea } from "./ui/scroll-area"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"

interface BookingConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  totalPrice: number
  isLoading?: boolean
}

export default function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  totalPrice,
  isLoading = false,
}: BookingConfirmationModalProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleConfirm = async () => {
    if (agreedToTerms) {
      await onConfirm()
      // Reset checkbox after confirmation
      setAgreedToTerms(false)
    }
  }

  const handleClose = () => {
    setAgreedToTerms(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            Confirm Booking Submission
          </DialogTitle>
          <DialogDescription>
            Please review the booking terms and conditions before confirming your reservation
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-280px)] pr-4">
          <div className="space-y-6 py-4">
            <Alert className="border-primary/50 bg-primary/5">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base font-semibold">
                Total Amount: ₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="text-xl font-bold mb-4 text-primary">
                Booking Terms & Conditions
              </h3>
              <p className="text-base leading-relaxed mb-4">
                To ensure a smooth and secure booking process at Elimar Spring Garden Resort, 
                all guests are required to follow the payment guidelines below:
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-2 text-primary">
                  ADVANCE PAYMENT REQUIREMENT
                </h4>
                <p className="text-sm leading-relaxed">
                  All bookings must be fully paid during the booking process. Guests are required to 
                  upload the proof of payment directly in the booking form before submitting their reservation.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  We do not accept late, delayed, or partial payments. Any booking submitted without full 
                  payment and proof of payment will not be confirmed.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 text-primary">
                  UPLOAD PROOF OF PAYMENT
                </h4>
                <p className="text-sm leading-relaxed">
                  Guests must upload a valid proof of payment (receipt, screenshot, or confirmation from 
                  the payment channel) through the designated upload section in the booking form.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  Make sure the proof of payment is clear, correct, and matches the exact amount required. 
                  Incorrect, unclear, or mismatched payments may result in the booking being invalid.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 text-primary">
                  INCOMPLETE OR INCORRECT PAYMENT
                </h4>
                <p className="text-sm leading-relaxed">
                  If the submitted payment is less than the required amount, the reservation will not be processed.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  The guest will be notified, and the payment will be refunded or corrected as needed before 
                  a booking can be confirmed.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 text-primary">
                  PAYMENT VERIFICATION FOR ASSISTANCE
                </h4>
                <p className="text-sm leading-relaxed">
                  Any booking assistance or staff processing will only begin after full payment and verified 
                  proof of payment are received.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  No assistance will be provided for unpaid or unverified reservations.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 text-primary">
                  NON-REFUNDABLE PAYMENT & RESCHEDULING POLICY
                </h4>
                <p className="text-sm leading-relaxed">
                  All confirmed payments are non-refundable. However, if the guest cannot make it on the 
                  scheduled date, the resort will contact the guest (or the guest may contact the resort) 
                  to arrange a one-time rescheduling to another available date.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  Rescheduling is subject to availability and must follow resort guidelines.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg border-l-4 border-primary">
                <p className="text-sm leading-relaxed font-medium">
                  By submitting a reservation, guests acknowledge and agree to comply with these Terms and Conditions. 
                  This policy ensures a safe, fair, and hassle-free booking experience for everyone.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t pt-4">
          <div className="flex items-start space-x-3 mb-4">
            <Checkbox
              id="booking-terms-checkbox"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              disabled={isLoading}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="booking-terms-checkbox"
                className="text-base font-medium leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                You must accept the terms and conditions to proceed with your booking
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!agreedToTerms || isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Processing...</span>
                  <span className="animate-spin">⏳</span>
                </>
              ) : (
                "Confirm & Submit"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
