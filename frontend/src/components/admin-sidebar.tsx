
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  GalleryHorizontal,
  Settings,
  Home,
  FileText,
  LogOut,
  UserPlus,
  UserCog
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from './ui/sidebar';
import { Separator } from './ui/separator';
import { Button } from './ui/button';

const mainNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/calendar', label: 'Calendar', icon: LayoutDashboard },
  { href: '/admin/walk-in', label: 'Walk-In', icon: UserPlus },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal },
];

const contentLinks = [
  { href: '/admin/accommodations', label: 'Accommodations', icon: Home },
  { href: '/admin/reports', label: 'Logs and Reports', icon: FileText },
];

const settingsLinks = [
  { href: '/admin/settings', label: 'Pricing Settings', icon: Settings },
  { href: '/admin/assign-admin', label: 'Assign Admin', icon: UserCog },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarContent className="px-4 pt-2 pb-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.label}
                      className={`transition-all duration-150 rounded-lg ${
                        isActive
                          ? '!bg-blue-600 !text-white font-semibold dark:!bg-blue-500 [&>svg]:!text-white'
                          : 'hover:!bg-blue-100 hover:!text-blue-700 dark:hover:!bg-blue-900/50 dark:hover:!text-blue-300'
                      }`}
                    >
                      <Link href={link.href}>
                        <link.icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        {/* Content Management */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Content
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.label}
                      className={`transition-all duration-150 rounded-lg ${
                        isActive
                          ? '!bg-blue-600 !text-white font-semibold dark:!bg-blue-500 [&>svg]:!text-white'
                          : 'hover:!bg-blue-100 hover:!text-blue-700 dark:hover:!bg-blue-900/50 dark:hover:!text-blue-300'
                      }`}
                    >
                      <Link href={link.href}>
                        <link.icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.label}
                      className={`transition-all duration-150 rounded-lg ${
                        isActive
                          ? '!bg-blue-600 !text-white font-semibold dark:!bg-blue-500 [&>svg]:!text-white'
                          : 'hover:!bg-blue-100 hover:!text-blue-700 dark:hover:!bg-blue-900/50 dark:hover:!text-blue-300'
                      }`}
                    >
                      <Link href={link.href}>
                        <link.icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Quick Actions */}
      <SidebarFooter className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <Button
          variant="destructive"
          className="w-full justify-start group-data-[collapsible=icon]:justify-center"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2 group-data-[collapsible=icon]:mr-0" />
          <span className="group-data-[collapsible=icon]:hidden">
            Logout
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
