/**
 * Elimar Spring Garden Resort - Data Constants
 * All prices in Philippine Peso (₱)
 */

export type AccommodationType = 'cottage' | 'room';

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  description: string;
  capacity: string;
  price: string;
  priceDetails?: {
    morning?: number;
    evening?: number;
    wholeDay?: number;
  };
  image: string;
  panoramicImage?: string;
  gallery?: string[];
  inclusions?: string[];
}

// Cottages Data
export const COTTAGES: Accommodation[] = [
  {
    id: 'back-cottage',
    name: 'Back Side Cottage',
    type: 'cottage',
    description: 'Spacious cottage perfect for large gatherings and family reunions.',
    capacity: '15-20 persons',
    price: '₱500',
    priceDetails: { wholeDay: 500 },
    image: '/cottages/back/back1.png',
    panoramicImage: '/cottages/back/back3D.png',
    gallery: ['/cottages/back/back1.png', '/cottages/back/back2.png', '/cottages/back/back3.png'],
    inclusions: ['Tables and chairs', 'Covered area', 'Nearby comfort rooms']
  },
  {
    id: 'cottage-1',
    name: 'Cottage 1',
    type: 'cottage',
    description: 'Cozy cottage with pool access, ideal for small to medium groups.',
    capacity: '5-10 persons',
    price: '₱250',
    priceDetails: { wholeDay: 250 },
    image: '/cottages/cottage 1/cottage1.1.png',
    panoramicImage: '/cottages/cottage 1/cottage1-3D.png',
    gallery: ['/cottages/cottage 1/cottage1.1.png', '/cottages/cottage 1/cottage1.2.png'],
    inclusions: ['Pool access', 'Tables and chairs', 'Shaded area']
  },
  {
    id: 'cottage-2',
    name: 'Cottage 2',
    type: 'cottage',
    description: 'Comfortable cottage with scenic views and pool access.',
    capacity: '5-10 persons',
    price: '₱250',
    priceDetails: { wholeDay: 250 },
    image: '/cottages/cottage 2/cottage2.1.png',
    panoramicImage: '/cottages/cottage 2/cottage2-3D.png',
    gallery: ['/cottages/cottage 2/cottage2.1.png', '/cottages/cottage 2/cottage2.2.png'],
    inclusions: ['Pool access', 'Tables and chairs', 'Shaded area']
  },
  {
    id: 'cottage-3',
    name: 'Cottage 3',
    type: 'cottage',
    description: 'Well-maintained cottage offering comfort and convenience.',
    capacity: '5-10 persons',
    price: '₱250',
    priceDetails: { wholeDay: 250 },
    image: '/cottages/cottage 3/cottage3-3D.png',
    panoramicImage: '/cottages/cottage 3/cottage3-3D.png',
    gallery: ['/cottages/cottage 3/cottage3-3D.png'],
    inclusions: ['Pool access', 'Tables and chairs', 'Shaded area']
  },
  {
    id: 'cottage-4',
    name: 'Cottage 4',
    type: 'cottage',
    description: 'Pleasant cottage with easy access to resort amenities.',
    capacity: '5-10 persons',
    price: '₱250',
    priceDetails: { wholeDay: 250 },
    image: '/cottages/cottage 4/cottage4.1.png',
    panoramicImage: '/cottages/cottage 4/cottage4-3D.png',
    gallery: ['/cottages/cottage 4/cottage4.1.png', '/cottages/cottage 4/cottage4.2.png'],
    inclusions: ['Pool access', 'Tables and chairs', 'Shaded area']
  },
  {
    id: 'top-cottage',
    name: 'Top Cottage',
    type: 'cottage',
    description: 'Elevated cottage with panoramic views of the resort.',
    capacity: '5-10 persons',
    price: '₱300',
    priceDetails: { wholeDay: 300 },
    image: '/cottages/back/back1.png',
    panoramicImage: '/cottages/back/back3D.png',
    gallery: ['/cottages/back/back1.png'],
    inclusions: ['Elevated view', 'Pool access', 'Tables and chairs']
  },
  {
    id: 'left-pool-cottage-1',
    name: 'Left Side Pool Cottage 1',
    type: 'cottage',
    description: 'Prime poolside location with direct swimming access.',
    capacity: '5-10 persons',
    price: '₱300',
    priceDetails: { wholeDay: 300 },
    image: '/cottages/left/left1.1.png',
    panoramicImage: '/cottages/left/left-3D.png',
    gallery: ['/cottages/left/left1.1.png', '/cottages/left/left1.2.png'],
    inclusions: ['Direct pool access', 'Tables and chairs', 'Premium location']
  },
  {
    id: 'left-pool-cottage-2',
    name: 'Left Side Pool Cottage 2',
    type: 'cottage',
    description: 'Poolside cottage offering relaxation and convenience.',
    capacity: '5-10 persons',
    price: '₱300',
    priceDetails: { wholeDay: 300 },
    image: '/cottages/left/left1.2.png',
    panoramicImage: '/cottages/left/left-3D.png',
    gallery: ['/cottages/left/left1.1.png', '/cottages/left/left1.2.png'],
    inclusions: ['Direct pool access', 'Tables and chairs', 'Premium location']
  },
  {
    id: 'front-pool-cottage-1',
    name: 'Front Pool Cottage 1',
    type: 'cottage',
    description: 'Premier front-facing cottage with excellent pool views.',
    capacity: '5-10 persons',
    price: '₱400',
    priceDetails: { wholeDay: 400 },
    image: '/cottages/front/front1.png',
    panoramicImage: '/cottages/front/front-3D.png',
    gallery: ['/cottages/front/front1.png'],
    inclusions: ['Premium pool view', 'Direct access', 'Tables and chairs']
  },
  {
    id: 'front-pool-cottage-2',
    name: 'Front Pool Cottage 2',
    type: 'cottage',
    description: 'Exclusive front pool cottage with superior amenities.',
    capacity: '5-10 persons',
    price: '₱400',
    priceDetails: { wholeDay: 400 },
    image: '/cottages/front/front1.png',
    panoramicImage: '/cottages/front/front-3D.png',
    gallery: ['/cottages/front/front1.png'],
    inclusions: ['Premium pool view', 'Direct access', 'Tables and chairs']
  },
  {
    id: 'right-cottage',
    name: 'Right Side Cottage',
    type: 'cottage',
    description: 'Peaceful cottage in a quiet area of the resort.',
    capacity: '5-10 persons',
    price: '₱300',
    priceDetails: { wholeDay: 300 },
    image: '/cottages/right/right1.1.png',
    panoramicImage: '/cottages/right/right-3D.png',
    gallery: ['/cottages/right/right1.1.png', '/cottages/right/right1.2.png'],
    inclusions: ['Pool access', 'Tables and chairs', 'Quiet location']
  }
];

// Rooms Data
export const ROOMS: Accommodation[] = [
  {
    id: 'cabana-1',
    name: 'Cabana 1',
    type: 'room',
    description: 'Comfortable cabana perfect for small families. Includes free swimming access.',
    capacity: '3-4 persons',
    price: 'Morning: ₱1,000 | Evening & Whole Day: ₱1,500',
    priceDetails: {
      morning: 1000,
      evening: 1500,
      wholeDay: 1500
    },
    image: '/rooms/cabana/1/cabana1.1.png',
    panoramicImage: '/rooms/cabana/1/Cabana1-3D.png',
    gallery: ['/rooms/cabana/1/cabana1.1.png', '/rooms/cabana/1/cabana1.2.png'],
    inclusions: ['Free swimming', 'Air conditioning', 'Private bathroom', 'Cable TV']
  },
  {
    id: 'cabana-2',
    name: 'Cabana 2',
    type: 'room',
    description: 'Cozy cabana ideal for couples or small groups. Free swimming included.',
    capacity: '2-3 persons',
    price: 'Morning: ₱700 | Evening & Whole Day: ₱1,200',
    priceDetails: {
      morning: 700,
      evening: 1200,
      wholeDay: 1200
    },
    image: '/rooms/cabana/2/Cabana 2.2.png',
    panoramicImage: '/rooms/cabana/2/Cabana 2-3D.png',
    gallery: ['/rooms/cabana/2/cabana 2.1.png', '/rooms/cabana/2/Cabana 2.2.png'],
    inclusions: ['Free swimming', 'Air conditioning', 'Private bathroom', 'Cable TV']
  },
  {
    id: 'castle-house',
    name: 'Castle House',
    type: 'room',
    description: 'Luxurious castle-themed house perfect for large groups and special events. Includes complimentary swimming.',
    capacity: '10-15 persons',
    price: 'Morning: ₱2,000 | Evening & Whole Day: ₱5,000',
    priceDetails: {
      morning: 2000,
      evening: 5000,
      wholeDay: 5000
    },
    image: '/rooms/castle/Castle house.png',
    panoramicImage: '/rooms/castle/Castle house-3D.png',
    gallery: ['/rooms/castle/Castle house.png'],
    inclusions: ['Free swimming', 'Multiple rooms', 'Air conditioning', 'Kitchen facilities', 'Living area', 'Cable TV']
  }
];

// All accommodations combined
export const ALL_ACCOMMODATIONS = [...COTTAGES, ...ROOMS];

// Entrance and Swimming Fees
export const FEES = {
  entrance: {
    kidsSeniorPWD: 50,
    adult: 70
  },
  swimming: {
    kidsSeniorPWD: 50,
    adult: 80
  },
  nightSwimming: 200 // includes entrance and swimming, cottage separate
};

// Private Event Rates
export const PRIVATE_EVENT_RATES = {
  wholeDay: 15000, // 9am-5pm
  evening: 10000, // 5:30-10pm
  morning: 10000 // 9am-5pm
};

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH')}`;
}

// Helper function to get accommodation by ID
export function getAccommodationById(id: string): Accommodation | undefined {
  return ALL_ACCOMMODATIONS.find(acc => acc.id === id);
}

// Helper function to get accommodations by type
export function getAccommodationsByType(type: AccommodationType): Accommodation[] {
  return ALL_ACCOMMODATIONS.filter(acc => acc.type === type);
}
