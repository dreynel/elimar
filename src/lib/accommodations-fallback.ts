import { ALL_ACCOMMODATIONS } from '@/lib/resort-data'

export interface FallbackAccommodation {
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

export const FALLBACK_ACCOMMODATIONS: FallbackAccommodation[] = ALL_ACCOMMODATIONS.map((accommodation, index) => ({
  id: index + 1,
  name: accommodation.name,
  type: accommodation.type,
  description: accommodation.description,
  capacity: accommodation.capacity,
  price: accommodation.priceDetails?.wholeDay ?? accommodation.price,
  inclusions: (accommodation.inclusions ?? []).join('\n'),
  image_url: JSON.stringify(
    accommodation.gallery && accommodation.gallery.length > 0
      ? accommodation.gallery
      : [accommodation.image]
  ),
  panoramic_url: accommodation.panoramicImage,
}))
