/**
 * Elimar Spring Garden Resort - Type Definitions
 */

export type AccommodationType = 'cottage' | 'room';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export type GuestType = 'adult' | 'kid' | 'pwd' | 'senior';

export interface PriceDetails {
  morning?: number;
  evening?: number;
  wholeDay?: number;
}

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  description: string;
  capacity: string;
  price: string;
  priceDetails?: PriceDetails;
  image: string;
  panoramicImage?: string;
  gallery?: string[];
  inclusions?: string[];
}

export interface Guest {
  type: GuestType;
  count: number;
}

export interface BookingData {
  accommodationId: string;
  guests: {
    adults: number;
    kids: number;
    pwd: number;
  };
  options: {
    overnightStay: boolean;
    overnightSwimming: boolean;
  };
  checkInDate?: Date;
  checkOutDate?: Date;
  totalAmount?: number;
  proofOfPayment?: File | string;
}

export interface Reservation {
  id: number | string;
  date: Date;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  accommodation: string;
  accommodationType: AccommodationType;
  guests: number;
  time: string;
  status: BookingStatus;
  revenue: number;
  contact: {
    email: string;
    phone: string;
  };
  paymentProof?: string;
  specialRequests?: string;
}

export interface FeeStructure {
  entrance: {
    kidsSeniorPWD: number;
    adult: number;
  };
  swimming: {
    kidsSeniorPWD: number;
    adult: number;
  };
  nightSwimming: number;
}

export interface PrivateEventRates {
  wholeDay: number;
  evening: number;
  morning: number;
}
