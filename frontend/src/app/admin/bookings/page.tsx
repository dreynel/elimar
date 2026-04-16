'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MoreVertical, 
  LogOut,
  Calendar,
  User,
  Home,
  Banknote,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { API_URL } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Time slot type and labels
type TimeSlotType = 'morning' | 'night' | 'whole_day';

const TIME_SLOT_LABELS: Record<TimeSlotType, string> = {
  morning: 'Morning (9 AM - 5 PM)',
  night: 'Night (5:30 PM - 8 AM)',
  whole_day: 'Whole Day (9 AM - 8 AM)'
};

interface Booking {
  id: number;
  user_id: number;
  accommodation_id?: number;
  check_in_date: string;
  booking_time?: string; // Legacy time field for regular bookings
  time_slot?: TimeSlotType; // New time slot field
  check_out_date?: string;
  checked_out_at?: string;
  adults?: number;
  kids?: number;
  pwd?: number;
  senior?: number;
  guest_names?: string;
  overnight_stay?: boolean;
  overnight_swimming?: boolean;
  total_price: number;
  status: string;
  proof_of_payment_url: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_contact?: string;
  accommodation_name?: string;
  accommodation_type?: string;
  accommodation_capacity?: string;
  // Event booking specific fields
  booking_type?: 'regular' | 'event' | 'walk-in';
  event_type?: 'whole_day' | 'evening' | 'morning';
  booking_date?: string;
  event_details?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Fetch both regular bookings and event bookings
      const [regularResponse, eventResponse] = await Promise.all([
        fetch(`${API_URL}/api/bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/api/event_bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      if (!regularResponse.ok || !eventResponse.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const regularData = await regularResponse.json();
      const eventData = await eventResponse.json();

      // Mark booking types and combine
      const regularBookings = (regularData.data || []).map((booking: any) => ({
        ...booking,
        booking_type: 'regular' as const,
        check_in_date: booking.check_in_date,
      }));

      const eventBookings = (eventData.data || []).map((booking: any) => ({
        ...booking,
        booking_type: 'event' as const,
        check_in_date: booking.booking_date, // Map booking_date to check_in_date for consistent rendering
        accommodation_name: `Event: ${booking.event_type?.replace('_', ' ').toUpperCase()}`,
      }));

      // Combine and sort by created_at
      const allBookings = [...regularBookings, ...eventBookings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setBookings(allBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (booking: Booking) => {
    try {
      const token = localStorage.getItem('token');
      const isEventBooking = booking.booking_type === 'event';
      const endpoint = isEventBooking 
        ? `${API_URL}/api/event_bookings/${booking.id}`
        : `${API_URL}/api/bookings/${booking.id}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }

      const data = await response.json();
      const bookingData = {
        ...data.data,
        booking_type: isEventBooking ? 'event' : 'regular',
        // For event bookings, map booking_date to check_in_date for consistent display
        check_in_date: isEventBooking ? data.data.booking_date : data.data.check_in_date,
        accommodation_name: isEventBooking 
          ? `Event: ${data.data.event_type?.replace('_', ' ').toUpperCase()}` 
          : data.data.accommodation_name,
      };
      
      setSelectedBooking(bookingData);
      setIsDetailsModalOpen(true);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (booking: Booking) => {
    try {
      const token = localStorage.getItem('token');
      const isEventBooking = booking.booking_type === 'event';
      const endpoint = isEventBooking
        ? `${API_URL}/api/event_bookings/${booking.id}/approve`
        : `${API_URL}/api/bookings/${booking.id}/approve`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve booking');
      }

      // Show success message including auto-rejection count if any
      const rejectedCount = data.data?.rejectedCount || 0;
      const baseMessage = isEventBooking 
        ? "Event booking approved successfully" 
        : "Booking approved successfully";
      const description = rejectedCount > 0 
        ? `${baseMessage}. ${rejectedCount} conflicting request(s) were automatically rejected and clients notified.`
        : baseMessage;

      toast({
        title: "Success",
        description,
      });

      setIsApproveModalOpen(false);
      setActionBooking(null);
      await fetchBookings();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to approve booking',
        variant: "destructive",
      });
    }
  };

  const handleReject = async (booking: Booking) => {
    try {
      const token = localStorage.getItem('token');
      const isEventBooking = booking.booking_type === 'event';
      const endpoint = isEventBooking
        ? `${API_URL}/api/event_bookings/${booking.id}/reject`
        : `${API_URL}/api/bookings/${booking.id}/reject`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject booking');
      }

      toast({
        title: "Success",
        description: isEventBooking 
          ? "Event booking rejected successfully" 
          : "Booking rejected successfully",
      });

      setIsRejectModalOpen(false);
      setActionBooking(null);
      await fetchBookings();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to reject booking',
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async (booking: Booking) => {
    try {
      const token = localStorage.getItem('token');
      const isEventBooking = booking.booking_type === 'event';
      const endpoint = isEventBooking
        ? `${API_URL}/api/event_bookings/${booking.id}/checkout`
        : `${API_URL}/api/bookings/${booking.id}/checkout`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check out booking');
      }

      toast({
        title: "Success",
        description: isEventBooking 
          ? "Event checked out successfully. Resort is now available." 
          : "Guest checked out successfully. Accommodation is now available.",
      });

      setIsCheckOutModalOpen(false);
      setActionBooking(null);
      await fetchBookings();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to check out',
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (booking: Booking) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const isEventBooking = booking.booking_type === 'event';
      const endpoint = isEventBooking
        ? `${API_URL}/api/event_bookings/${booking.id}`
        : `${API_URL}/api/bookings/${booking.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete booking');
      }

      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });

      await fetchBookings();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete booking',
        variant: "destructive",
      });
    }
  };

  // Sort requests by created_at ascending (earliest first - first come, first served)
  const requestsData = bookings
    .filter(b => b.status === 'pending')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const approvedData = bookings.filter(b => b.status === 'approved');
  const completedData = bookings.filter(b => b.status === 'completed');
  const cancelledData = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected');

  const formatDate = (dateString: string) => {
    // Handle date-only strings (YYYY-MM-DD) to avoid timezone offset issues
    if (dateString && dateString.length === 10 && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    // Handle full datetime strings
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string | undefined) => {
    // If no time string is provided, return default
    if (!timeString) {
      return '09:00 AM';
    }
    
    // If it's a TIME string (HH:MM:SS format)
    if (timeString.includes(':')) {
      // Parse the time string (e.g., "14:30:00" or "09:00:00")
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Fallback for datetime strings
    if (timeString.includes('T')) {
      return new Date(timeString).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
    
    return '09:00 AM';
  };

  // Format time slot for display
  const formatTimeSlot = (booking: Booking) => {
    // Use time_slot if available (new system)
    if (booking.time_slot) {
      const shortLabels: Record<TimeSlotType, string> = {
        morning: 'Morning',
        night: 'Night',
        whole_day: 'Whole Day'
      };
      return shortLabels[booking.time_slot] || booking.time_slot;
    }
    
    // For event bookings, use event_type
    if (booking.booking_type === 'event' && booking.event_type) {
      const eventLabels: Record<string, string> = {
        morning: 'Morning',
        evening: 'Evening',
        whole_day: 'Whole Day'
      };
      return eventLabels[booking.event_type] || booking.event_type;
    }
    
    // Fallback to legacy booking_time
    return formatTime(booking.booking_time);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={fetchBookings}>Try Again</Button>
      </div>
    );
  }

  const renderBookingRow = (booking: Booking, showCheckout: boolean = false) => (
    <TableRow key={`${booking.booking_type || 'regular'}-${booking.id}`} className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            booking.status === 'confirmed' || booking.status === 'completed'
              ? 'bg-green-100 dark:bg-green-900/30'
              : booking.status === 'cancelled'
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-primary/10'
          }`}>
            <User className={`w-4 h-4 ${
              booking.status === 'confirmed' || booking.status === 'completed'
                ? 'text-green-600'
                : booking.status === 'cancelled'
                ? 'text-red-600'
                : 'text-primary'
            }`} />
          </div>
          <div>
            <p className="font-medium">{booking.user_name || 'Unknown User'}</p>
            <p className="text-xs text-muted-foreground">{booking.user_email || 'No email'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-muted-foreground" />
          {booking.accommodation_name || `Accommodation #${booking.accommodation_id}`}
        </div>
      </TableCell>
      <TableCell className="text-sm">{formatDate(booking.check_in_date)}</TableCell>
      {showCheckout && (
        <TableCell className="text-sm">
          {booking.checked_out_at 
            ? formatDate(booking.checked_out_at) 
            : booking.check_out_date 
              ? formatDate(booking.check_out_date) 
              : 'Day use'}
        </TableCell>
      )}
      <TableCell>{formatTimeSlot(booking)}</TableCell>
      <TableCell>
        {booking.booking_type === 'event' 
          ? 'Exclusive Event' 
          : `${(booking.adults || 0) + (booking.kids || 0) + (booking.pwd || 0)} guests`}
      </TableCell>
      <TableCell>
        <div className="font-semibold text-green-600">
          ₱{booking.total_price.toLocaleString()}
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={
            booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'approved'
              ? 'default'
              : booking.status === 'pending'
              ? 'outline'
              : 'destructive'
          }
          className={
            booking.status === 'approved'
              ? 'bg-green-50 text-green-700 border-green-200'
              : booking.status === 'completed'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : booking.status === 'pending'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : booking.status === 'cancelled'
              ? 'bg-red-50 text-red-700 border-red-200'
              : ''
          }
        >
          {booking.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
              <Eye className="mr-2 h-4 w-4" />
              <span>View Details</span>
            </DropdownMenuItem>
            {booking.status === 'pending' && (
              <>
                <DropdownMenuItem 
                  className="text-green-600"
                  onClick={() => {
                    setActionBooking(booking);
                    setIsApproveModalOpen(true);
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Approve</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => {
                    setActionBooking(booking);
                    setIsRejectModalOpen(true);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  <span>Reject</span>
                </DropdownMenuItem>
              </>
            )}
            {(booking.status === 'approved') && (
              <DropdownMenuItem
                className="text-blue-600"
                onClick={() => {
                  setActionBooking(booking);
                  setIsCheckOutModalOpen(true);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Check Out</span>
              </DropdownMenuItem>
            )}
            {(booking.status === 'cancelled' || booking.status === 'rejected') && (
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDelete(booking)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">Bookings</h2>
        <p className="text-sm text-muted-foreground">Manage your booking requests and reservations</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests" className="gap-2">
            <Calendar className="w-4 h-4" />
            Requests ({requestsData.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({approvedData.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <LogOut className="w-4 h-4" />
            Completed ({completedData.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({cancelledData.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Requests
              </CardTitle>
              <CardDescription className="mt-1">Pending booking requests awaiting approval</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Room/Cottage</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsData.length > 0 ? (
                    requestsData.map((booking) => renderBookingRow(booking, false))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="w-12 h-12 text-muted-foreground/50" />
                          <p>No booking requests at the moment.</p>
                          <p className="text-sm">Pending bookings will appear here.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="approved">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approved Bookings
              </CardTitle>
              <CardDescription className="mt-1">Active and confirmed reservations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedData.length > 0 ? (
                    approvedData.map((booking) => renderBookingRow(booking, false))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="w-12 h-12 text-muted-foreground/50" />
                          <p>No approved bookings yet.</p>
                          <p className="text-sm">Confirmed bookings will appear here.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-blue-600" />
                Completed Bookings
              </CardTitle>
              <CardDescription className="mt-1">Checked-out and completed reservations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Room/Cottage</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedData.length > 0 ? (
                    completedData.map((booking) => renderBookingRow(booking, true))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-2">
                          <LogOut className="w-12 h-12 text-muted-foreground/50" />
                          <p>No completed bookings yet.</p>
                          <p className="text-sm">Checked-out bookings will appear here.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cancelled">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30">
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Rejected Bookings
              </CardTitle>
              <CardDescription className="mt-1">Rejected or cancelled reservations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelledData.length > 0 ? (
                    cancelledData.map((booking) => renderBookingRow(booking, false))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-2">
                          <XCircle className="w-12 h-12 text-muted-foreground/50" />
                          <p>No rejected bookings.</p>
                          <p className="text-sm">Rejected or cancelled bookings will appear here.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Booking Details</DialogTitle>
            <DialogDescription>
              Booking ID: #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 mt-4">
              {/* Client Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Client Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedBooking.user_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedBooking.user_email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Number</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedBooking.user_contact || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={
                        selectedBooking.status === 'approved'
                          ? 'default'
                          : selectedBooking.status === 'completed'
                          ? 'default'
                          : selectedBooking.status === 'pending'
                          ? 'outline'
                          : 'destructive'
                      }
                      className={
                        selectedBooking.status === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : selectedBooking.status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : selectedBooking.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : ''
                      }
                    >
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Accommodation/Event Information */}
              {selectedBooking.booking_type === 'event' ? (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Event Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Event Type</p>
                      <p className="font-medium capitalize">
                        {selectedBooking.event_type?.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Event Date</p>
                      <p className="font-medium">{formatDate(selectedBooking.check_in_date)}</p>
                    </div>
                    {selectedBooking.event_details && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Event Description</p>
                        <p className="font-medium">{selectedBooking.event_details}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    Accommodation Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedBooking.accommodation_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedBooking.accommodation_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-medium">{selectedBooking.accommodation_capacity || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Booking Information
                </h3>
                <div className={`grid ${selectedBooking.status === 'completed' ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in Date</p>
                    <p className="font-medium">{formatDate(selectedBooking.check_in_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Slot</p>
                    <p className="font-medium">
                      {selectedBooking.time_slot 
                        ? TIME_SLOT_LABELS[selectedBooking.time_slot]
                        : selectedBooking.event_type 
                          ? selectedBooking.event_type.replace('_', ' ').toUpperCase()
                          : formatTime(selectedBooking.booking_time)}
                    </p>
                  </div>
                  {selectedBooking.status === 'completed' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out Date</p>
                      <p className="font-medium">
                        {selectedBooking.checked_out_at 
                          ? formatDate(selectedBooking.checked_out_at) 
                          : selectedBooking.check_out_date 
                            ? formatDate(selectedBooking.check_out_date) 
                            : 'Day use'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Booking Created</p>
                    <p className="font-medium">{formatDate(selectedBooking.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Guest Information - Only for regular bookings */}
              {selectedBooking.booking_type !== 'event' && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Guest Information
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Adults</p>
                      <p className="font-medium text-lg">{selectedBooking.adults || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kids</p>
                      <p className="font-medium text-lg">{selectedBooking.kids || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PWD</p>
                      <p className="font-medium text-lg">{selectedBooking.pwd || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Senior</p>
                      <p className="font-medium text-lg">{selectedBooking.senior || 0}</p>
                    </div>
                  </div>
                  {selectedBooking.guest_names && (() => {
                    try {
                      const guests = JSON.parse(selectedBooking.guest_names);
                      return (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-3">Guest Names</p>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {guests.map((guest: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                                <span className="font-medium">{guest.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {guest.type.toUpperCase()}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Additional Options</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.overnight_stay && (
                        <Badge variant="outline">Overnight Stay</Badge>
                      )}
                      {selectedBooking.overnight_swimming && (
                        <Badge variant="outline">Night Swimming</Badge>
                      )}
                      {!selectedBooking.overnight_stay && !selectedBooking.overnight_swimming && (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-primary" />
                  Payment Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-bold text-2xl text-green-600">
                      ₱{selectedBooking.total_price.toLocaleString('en-PH')}
                    </p>
                  </div>
                  
                  {selectedBooking.proof_of_payment_url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Proof of Payment</p>
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2">
                        <Image
                          src={selectedBooking.proof_of_payment_url.startsWith('http') 
                            ? selectedBooking.proof_of_payment_url 
                            : `${API_URL}${selectedBooking.proof_of_payment_url}`}
                          alt="Proof of payment"
                          fill
                          className="object-contain bg-muted"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-room.svg';
                          }}
                        />
                      </div>
                      <a 
                        href={selectedBooking.proof_of_payment_url.startsWith('http') 
                          ? selectedBooking.proof_of_payment_url 
                          : `${API_URL}${selectedBooking.proof_of_payment_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        View full size →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedBooking.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      setActionBooking(selectedBooking);
                      setIsDetailsModalOpen(false);
                      setIsApproveModalOpen(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Booking
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => {
                      setActionBooking(selectedBooking);
                      setIsDetailsModalOpen(false);
                      setIsRejectModalOpen(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Booking
                  </Button>
                </div>
              )}
              {selectedBooking.status === 'approved' && (
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      setActionBooking(selectedBooking);
                      setIsDetailsModalOpen(false);
                      setIsCheckOutModalOpen(true);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Check Out Guest
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Approve Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this booking request?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ Important Notice
              </p>
              <p className="text-sm text-amber-700 mt-1">
                All other requests with the same accommodation, date, and time slot will be automatically rejected.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              This will confirm the reservation and send a confirmation email to the client. 
              Rejected clients will receive an email notification about their payment refund.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsApproveModalOpen(false);
                setActionBooking(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => actionBooking && handleApprove(actionBooking)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Approval
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-6 h-6" />
              Reject Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this booking?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will cancel the reservation and notify the client. 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectModalOpen(false);
                setActionBooking(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => actionBooking && handleReject(actionBooking)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check Out Confirmation Modal */}
      <Dialog open={isCheckOutModalOpen} onOpenChange={setIsCheckOutModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <LogOut className="w-6 h-6" />
              Check Out Guest
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to check out this guest?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will mark the booking as completed and make the accommodation available 
              for new bookings.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCheckOutModalOpen(false);
                setActionBooking(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => actionBooking && handleCheckOut(actionBooking)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Confirm Check Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
