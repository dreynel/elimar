'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { PlaceHolderImages } from "../lib/placeholder-images";
import Tour3D from "../components/Tour3D";
import { MapPin, Award, Star } from "lucide-react";

function StarRating() {
  const [rating, setRating] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Small delay before starting animations
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
      
      const duration = 1500;
      const target = 4.1;
      const startTime = Date.now();
      
      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = (x: number): number => {
          return 1 - Math.pow(1 - x, 3);
        };
        
        const currentValue = easeOutCubic(progress) * target;
        setRating(parseFloat(currentValue.toFixed(1)));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setRating(target);
        }
      };
      
      requestAnimationFrame(animate);
    }, 800);
    
    return () => clearTimeout(initialDelay);
  }, []);

  return (
    <div 
      className={`flex flex-col items-center mt-8 transition-opacity duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-5xl md:text-6xl font-bold text-white font-headline tracking-tighter">{rating}</span>
        <div className="flex flex-col">
            <div className="flex text-yellow-400 gap-1">
            {[1, 2, 3, 4].map((star) => (
                <Star key={star} className="w-5 h-5 fill-current text-yellow-400" />
            ))}
            <div className="relative w-5 h-5">
                <Star className="w-5 h-5 text-white/30 fill-current absolute" />
                <div className="overflow-hidden absolute top-0 left-0 w-[10%]">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
            </div>
            </div>
        </div>
      </div>
      <p className="text-white/90 text-sm mt-2 font-medium tracking-wide uppercase">on Google Maps</p>
    </div>
  );
}

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  const tourImages = PlaceHolderImages.filter(p => p.id.startsWith('tour-'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const aboutRef = useRef<HTMLElement>(null);
  const [isAboutVisible, setIsAboutVisible] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAboutVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (aboutRef.current) {
      observer.observe(aboutRef.current);
    }

    return () => {
      if (aboutRef.current) {
        observer.unobserve(aboutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* Enhanced Hero Section */}
      <section className="relative w-full h-screen">
        {heroImage && (
          <Image
            src="/assets/main.svg"
            alt="Elimar Spring Garden Resort Hero Image"
            fill
            className="object-cover"
            priority
          />
        )}
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        
        {/* Centered hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
          <div className="flex flex-col items-center text-center fade-in max-w-5xl mx-auto">
            
            {/* Badge similar to the example image */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 mb-8 hover:bg-white/20 transition-colors cursor-default">
               <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
               <span className="text-sm font-medium text-white font-headline">Trusted by our guests</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight drop-shadow-2xl font-headline font-bold text-white mb-6 leading-tight">
              Elimar Spring <br className="hidden md:block" /> Garden Resort
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 max-w-2xl font-light leading-relaxed mb-8">
              Experience the perfect blend of nature and luxury. Your escape to paradise begins here.
            </p>

            <StarRating />
          </div>
          
          {/* Enhanced CTA Button */}
          <Button 
            asChild 
            size="lg" 
            className="mt-12 bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-7 text-lg rounded-xl shadow-2xl transition-all duration-300 font-semibold hover:scale-105 relative overflow-hidden group"
          >
            <Link href={isLoggedIn ? "/client/accommodations" : "/signup"} className="flex items-center gap-2 relative z-10">
              <span className="absolute inset-0 -left-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:left-full transition-all duration-700 ease-out"></span>
              Book Your Escape <span className="text-xl">→</span>
            </Link>
          </Button>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/80 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/80 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section 
        ref={aboutRef}
        className="bg-background py-28 md:py-36"
      >
        <div className="page-container">
          <div className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center ${isAboutVisible ? 'fade-in' : 'opacity-75'}`}>
            {/* Left Column - Text Content */}
            <div className={`space-y-6 ${isAboutVisible ? 'slide-in-left' : 'opacity-0'}`}>
              <div className="inline-block">
                <span className="text-primary font-semibold text-sm tracking-wider uppercase bg-primary/10 px-4 py-2 rounded-full">
                  About Us
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline leading-tight">
                Where Nature Meets Luxury
              </h2>
              <p className="text-lg md:text-lg text-muted-foreground/80 leading-relaxed">
                Discover a hidden gem in the heart of Dumangas, Iloilo — Elimar Spring Garden Resort. Established in 2009 and lovingly owned by Mr. Elisio Deza and Mrs. Marina Deza, this 970-square-meter paradise in Sitio Binaobao, Barangay Cali, offers the perfect blend of nature, privacy, and relaxation.
              </p>
              <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                Surrounded by lush gardens and a refreshing natural setting, Elimar Spring Garden Resort is more than just a destination — it’s an escape. With its peaceful ambience and close-to-nature feel, it is the ideal place to celebrate special occasions, bond with family and friends, or simply take a break from the fast-paced city life. 
              </p>
              <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                Whether you’re looking for a quiet retreat or a memorable gathering spot, Elimar Spring Garden Resort welcomes you with the beauty of nature and the warmth of home.
              </p>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <a 
                  href="https://maps.app.goo.gl/Jf6CqFdMuWySYNWHA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:bg-primary/5 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Prime Location</h3>
                    <p className="text-sm text-muted-foreground">Nestled in Dumangas</p>
                  </div>
                </a>
                <div className="flex items-start gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Award Winning</h3>
                    <p className="text-sm text-muted-foreground">Excellence in service</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className={`relative ${isAboutVisible ? 'slide-in-right' : 'opacity-0'}`}>
              <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/assets/main.png"
                  alt="Resort view"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <p className="text-lg font-semibold">Experience tranquility</p>
                  <p className="text-sm opacity-90">In the heart of nature</p>
                </div>
              </div>
              
              {/* Decorative element */}
              <div className="absolute -z-10 top-8 -right-8 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Tour Section with spacing */}
      <section className="page-container py-28 md:py-36">
        <Tour3D />
      </section>
    </div>
  );
}
