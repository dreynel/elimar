
'use client';

import type { Metadata } from 'next';
import { ThemeProvider, useTheme } from '../components/theme-provider';
import { TimeSlotProvider } from '../contexts/TimeSlotContext';
import { Header } from '../components/header';
import { Toaster } from '../components/ui/toaster';
import { cn } from '../lib/utils';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { MapPin, Phone, Home, ImageIcon, LogIn } from 'lucide-react';


function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
     <>
        {children}
        <div className="fixed top-4 left-4">
          <ThemeToggle />
        </div>
        <Toaster />
     </>
  )
}

function AdminPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster />
        </>
    )
}

function ClientPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Toaster />
    </>
  )
}

function MainPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      
      {/* Enhanced Footer with curved divider */}
      <footer className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground mt-28 md:mt-36 overflow-hidden">
        {/* Curved divider */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden -mt-1">
          <svg
            className="relative block w-full h-16 md:h-20"
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              className="fill-current text-primary"
            />
          </svg>
        </div>
        
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 pt-20 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-12">
            {/* Column 1 - Brand */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold font-headline text-2xl mb-2">Elimar Spring Garden Resort</h3>
              <p className="text-base text-primary-foreground/90 leading-relaxed">
                A sanctuary of peace and tranquility where nature meets luxury. Experience unforgettable moments in paradise.
              </p>
            </div>
            
            {/* Column 2 - Quick Links */}
            <div>
              <h3 className="font-bold font-headline text-xl mb-6">Quick Links</h3>
              <nav className="flex flex-col gap-4 text-base">
                <Link 
                  href="/" 
                  className="hover:underline flex items-center gap-3 text-primary-foreground/90 hover:text-primary-foreground transition-all group"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors">
                    <Home className="w-4 h-4" />
                  </div>
                  Home
                </Link>
                <Link href="/client/accommodations" className="hover:underline flex items-center gap-3 text-primary-foreground/90 hover:text-primary-foreground transition-all group">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors">
                    <Home className="w-4 h-4" />
                  </div>
                  Accommodations
                </Link>
                <Link href="/client/gallery" className="hover:underline flex items-center gap-3 text-primary-foreground/90 hover:text-primary-foreground transition-all group">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  Gallery
                </Link>
                <Link href="/login" className="hover:underline flex items-center gap-3 text-primary-foreground/90 hover:text-primary-foreground transition-all group">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors">
                    <LogIn className="w-4 h-4" />
                  </div>
                  Login
                </Link>
              </nav>
            </div>
            
            {/* Column 3 - Contact */}
            <div>
              <h3 className="font-bold font-headline text-xl mb-6">Contact Us</h3>
              <div className="space-y-5 text-base">
                <a 
                  href="https://maps.app.goo.gl/Jf6CqFdMuWySYNWHA"
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="flex items-start gap-4 text-primary-foreground/90 hover:text-primary-foreground transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0 group-hover:bg-primary-foreground/20 transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary-foreground mb-1">Location</p>
                    <p className="leading-relaxed">Barangay Binaobao, Dumangas, Philippines, 5006</p>
                  </div>
                </a>
                <div className="flex items-start gap-4 text-primary-foreground/90">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary-foreground mb-1">Phone</p>
                    <p>+(63) 905 556 5755</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="pt-8 border-t border-primary-foreground/20 text-center">
            <p className="text-sm text-primary-foreground/80">
              &copy; {new Date().getFullYear()} Elimar Spring Garden Resort. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <Toaster />
    </>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/verify-email' || pathname === '/forgot-password';
  const isAdminPage = pathname.startsWith('/admin');
  const isClientPage = pathname.startsWith('/client');

  return (
    <html lang="en" suppressHydrationWarning className={!isAuthPage && !isAdminPage ? "scroll-smooth" : ""}>
      <head>
        <title>{`${isAdminPage ? 'Admin - ' : ''}Elimar Spring Garden Resort`}</title>
        <meta name="description" content="A serene resort nestled in nature. Book your escape." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background text-foreground font-body antialiased', isClientPage || (!isAuthPage && !isAdminPage) ? 'flex flex-col' : '')}>
        <ThemeProvider>
          <TimeSlotProvider>
            {isAuthPage && <AuthLayout>{children}</AuthLayout>}
            {isAdminPage && <AdminPageLayout>{children}</AdminPageLayout>}
            {isClientPage && <ClientPageLayout>{children}</ClientPageLayout>}
            {!isAuthPage && !isAdminPage && !isClientPage && <MainPageLayout>{children}</MainPageLayout>}
          </TimeSlotProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
