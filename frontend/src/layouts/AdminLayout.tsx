'use client';

import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationPoller } from '@/components/NotificationPoller';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, Upload } from 'lucide-react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

interface AdminUser {
  name: string;
  email: string;
}

export default function AdminLayout({
  children,
  pageTitle,
  pageDescription,
}: AdminLayoutProps) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser>({ name: 'Admin User', email: 'admin@elimarspring.com' });
  
  // Fetch admin user info from localStorage on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setAdminUser({
          name: user.name || user.full_name || 'Admin User',
          email: user.email || 'admin@elimarspring.com',
        });
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Logout handler
  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    router.push('/login');
  };
  
  // Derive page title from pathname if not provided
  const pathname = usePathname();
  const inferredTitle = React.useMemo(() => {
    if (pageTitle) return pageTitle;
    if (!pathname) return 'Dashboard';
    const parts = pathname.split('/').filter(Boolean);
    // expected: ['admin', 'bookings'] -> title 'Bookings'
    if (parts.length >= 2 && parts[0] === 'admin') {
      const name = parts[1];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Dashboard';
  }, [pathname, pageTitle]);

  return (
    <SidebarProvider defaultOpen>
      <NotificationPoller />
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AdminSidebar />
        
        <SidebarInset className="flex flex-col flex-1">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
            <div className="flex h-16 items-center gap-4 pl-6 pr-8">
              {/* Sidebar Trigger */}
              <SidebarTrigger className="lg:hidden" />

              {/* Page Title */}
              <div className="flex-1">
                <h1 className="text-xl font-bold font-headline">
                  {inferredTitle}
                </h1>
                {pageDescription && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {pageDescription}
                  </p>
                )}
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                {/* Show gallery action in header when on the gallery page */}
                {pathname && pathname.startsWith('/admin/gallery') && (
                  <Button className="hidden sm:inline-flex bg-blue-600 text-white hover:bg-blue-700 mr-2">
                    <Upload className="mr-2 h-4 w-4" />
                    Add New Gallery
                  </Button>
                )}
                <ThemeToggle />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                      aria-label="User menu"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/assets/avatar-placeholder.png" alt="User" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-sky-400 text-white font-semibold">
                            {getInitials(adminUser.name)}
                          </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{adminUser.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {adminUser.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {/* Use full width for admin content so dashboard fills the available space */}
            <div className="w-full p-6 lg:p-8">
              {children}
            </div>
          </main>
          
          {/* Footer removed as requested */}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
