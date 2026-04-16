"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

const images = [
  '/assets/boarding/0.png',
  '/assets/boarding/1.png',
  '/assets/boarding/2.png',
  '/assets/boarding/3.png',
]

export default function AuthCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on('select', onSelect)
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  return (
    <div className="relative h-full w-full bg-muted overflow-hidden">
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent" />
      
      <div className="w-full h-full" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((src, index) => (
            <div key={index} className="relative flex-[0_0_100%] h-full min-w-0">
              <Image
                src={src}
                alt={`Slide ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-20 left-8 right-8 z-20 text-white">
        <h2 className="text-3xl font-bold mb-2">Elimar Spring Garden Resort</h2>
        <p className="text-lg text-white/90">Experience tranquility and comfort in our beautiful resort.</p>
      </div>
    </div>
  )
}
