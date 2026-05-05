export interface EventBooking {
  id: number;
  user_id: number;
  event_type: 'whole_day' | 'evening' | 'morning';
  booking_date: Date;
  event_details: string | null;
  total_price: number;
  proof_of_payment_url: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'approved' | 'completed';
  guest_names: string | null;
  created_at: Date;
  updated_at: Date;
  // JOIN fields
  user_name?: string;
  user_email?: string;
  user_contact?: string;
}

export interface EventBookingCreate {
  user_id: number;
  event_type: 'whole_day' | 'evening' | 'morning';
  booking_date: string;
  event_details?: string;
  total_price: number;
  proof_of_payment_url?: string;
  guest_names?: string;
}

export interface EventBookingUpdate {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'approved' | 'completed';
  proof_of_payment_url?: string;
  event_details?: string;
  guest_names?: string;
}
