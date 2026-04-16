
"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/client/accommodations", label: "Accommodations" },
  { href: "/client/gallery", label: "Gallery" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userRole, setUserRole] = React.useState("");
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const isHomePage = pathname === '/';

  React.useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (token && user) {
      setIsLoggedIn(true);
      try {
        const userData = JSON.parse(user);
        setUserName(userData.name || "User");
        setUserRole(userData.role || "");
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }

    // Scroll detection
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("");
    setIsLoggingOut(false);
    router.push("/");
  };

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
      isScrolled || !isHomePage
        ? "glass-dark shadow-lg" 
        : ""
    )}>
      <div className={cn(
        "w-full max-w-[1400px] mx-auto flex h-20 items-center px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20",
        !isScrolled && isHomePage ? "text-white" : "text-foreground"
      )}>
        {/* Desktop Nav: Left side */}
        <div className="flex-1 hidden md:flex">
          <Link href="/" className="flex items-center group" onClick={scrollToTop}>
            <Image
              src="/assets/header.svg"
              alt="Elimar Spring Garden Resort"
              width={100}
              height={20}
              className="transition-opacity group-hover:opacity-80"
              priority
            />
          </Link>
        </div>

        {/* Desktop Nav: Center */}
        <div className="flex-1 justify-center hidden md:flex">
            <nav className="flex items-center space-x-4 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={link.href === '/' ? scrollToTop : undefined}
                  className={cn(
                    "px-6 py-2.5 rounded-full transition-all duration-300 font-medium",
                    !isScrolled && isHomePage && pathname === link.href && "bg-white/20 text-white backdrop-blur-sm shadow-lg",
                    !isScrolled && isHomePage && pathname !== link.href && "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-md",
                    (isScrolled || !isHomePage) && pathname === link.href && "bg-primary text-primary-foreground shadow-lg",
                    (isScrolled || !isHomePage) && pathname !== link.href && "text-foreground/80 hover:bg-primary/10 hover:text-primary hover:shadow-md"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isLoggedIn && userRole !== 'admin' && (
                <Link
                  href="/client/my-bookings"
                  className={cn(
                    "px-6 py-2.5 rounded-full transition-all duration-300 font-medium",
                    !isScrolled && isHomePage && "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-md",
                    (isScrolled || !isHomePage) && pathname === "/client/my-bookings" && "bg-primary text-primary-foreground shadow-lg",
                    (isScrolled || !isHomePage) && pathname !== "/client/my-bookings" && "text-foreground/80 hover:bg-primary/10 hover:text-primary hover:shadow-md"
                  )}
                >
                  My Bookings
                </Link>
              )}
            </nav>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={!isScrolled && isHomePage ? "text-white hover:bg-white/20 hover:text-white" : ""}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                 <Link href="/" className="flex items-center gap-2 mb-6" onClick={(e) => { setOpen(false); scrollToTop(e); }}>
                    <Image
                      src="/assets/header.svg"
                      alt="Elimar Spring Garden Resort"
                      width={100}
                      height={20}
                    />
                </Link>
                <nav className="grid gap-4 text-lg">
                    {navLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                            <Link
                              href={link.href}
                              onClick={link.href === '/' ? scrollToTop : undefined}
                              className={cn(
                                "transition-colors hover:text-foreground",
                                pathname === link.href ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {link.label}
                            </Link>
                        </SheetClose>
                    ))}
                    {isLoggedIn && userRole !== 'admin' && (
                        <SheetClose asChild key="/client/my-bookings">
                            <Link
                              href="/client/my-bookings"
                              className={cn(
                                "transition-colors hover:text-foreground font-medium",
                                pathname === "/client/my-bookings" ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              My Bookings
                            </Link>
                        </SheetClose>
                    )}
                </nav>
              </SheetContent>
            </Sheet>
        </div>
        
        {/* Mobile Title */}
        <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
             <Link href="/" className="flex items-center" onClick={scrollToTop}>
                <Image
                  src="/assets/header.svg"
                  alt="Elimar Spring Garden Resort"
                  width={100}
                  height={20}
                  priority
                />
            </Link>
        </div>
        
        <div className="flex-1 flex items-center justify-end gap-3">
          <ThemeToggle className={!isScrolled && isHomePage ? "text-white hover:bg-white/20 hover:text-white" : ""} />
          {isLoggedIn ? (
            <>
              <span className={cn(
                "text-sm hidden sm:inline transition-colors",
                !isScrolled && isHomePage ? "text-white" : "text-muted-foreground"
              )}>
                Welcome, {userName}
              </span>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 shadow-lg hover:shadow-xl transition-all">
              <Link href="/login">Log-In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
