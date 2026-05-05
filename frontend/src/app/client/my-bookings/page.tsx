"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Clock, History, AlertCircle } from 'lucide-react'
import { API_URL } from '@/lib/utils'
import { format } from 'date-fns'

interface Booking {
  id: number;
  accommodation_id?: number;
  accommodation_name?: string;
  event_type?: string;
  check_in_date: string;
  check_out_date: string | null;
  time_slot: string;
  booking_time: string;
  total_price: string | number;
  status: string;
  created_at: string;
  is_event?: boolean;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to view your bookings');
      }

      // Fetch both regular and event bookings
      const [bookingsRes, eventBookingsRes] = await Promise.all([
        fetch(`${API_URL}/api/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/event_bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      let regularData = [];
      let eventData = [];

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        regularData = data.data || [];
      }

      if (eventBookingsRes.ok) {
        const data = await eventBookingsRes.json();
        eventData = (data.data || []).map((eb: any) => ({
          ...eb,
          accommodation_name: `Entire Resort (${eb.event_type.replace('_', ' ').toUpperCase()})`,
          check_in_date: eb.booking_date,
          check_out_date: eb.booking_date,
          time_slot: eb.event_type,
          is_event: true
        }));
      }

      // Merge and sort by created_at descending
      const combinedBookings = [...regularData, ...eventData].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setBookings(combinedBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching your booking history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeSlotLabel = (slot: string, isEvent?: boolean) => {
    if (isEvent) {
      switch(slot) {
        case 'morning': return 'Morning (9:00 AM - 5:00 PM)';
        case 'evening': return 'Evening (5:30 PM - 10:00 PM)';
        case 'whole_day': return 'Whole Day (9:00 AM - 5:00 PM)';
        default: return slot.replace('_', ' ').toUpperCase();
      }
    }
    switch(slot) {
      case 'morning': return 'Morning (9 AM - 5 PM)';
      case 'night': return 'Night (5:30 PM - 8 AM)';
      case 'whole_day': return 'Whole Day (9 AM - 8 AM next day)';
      default: return slot;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="page-container-wide">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <History className="w-10 h-10 text-primary" />
            My Bookings
          </h1>
          <p className="text-lg text-muted-foreground">
            View the history and track the status of your resort bookings.
          </p>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border shadow-sm">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-lg text-muted-foreground">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border shadow-sm">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-2xl font-semibold mb-2 text-foreground">No bookings found</h3>
            <p className="text-muted-foreground">You haven't made any bookings yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow border-2">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        {booking.accommodation_name || `Accommodation ID: ${booking.accommodation_id}`}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Placed on {format(new Date(booking.created_at), 'MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge className={`px-3 py-1 text-sm font-medium border uppercase ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {booking.is_event ? 'Event Date' : 'Check In'}
                      </p>
                      <p className="font-semibold">{format(new Date(booking.check_in_date), 'MMMM d, yyyy')}</p>
                      {booking.check_out_date && booking.check_out_date !== booking.check_in_date && (
                        <p className="text-sm text-muted-foreground mt-1">
                          to {format(new Date(booking.check_out_date), 'MMMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time Slot</p>
                      <p className="font-semibold">{getTimeSlotLabel(booking.time_slot, booking.is_event)}</p>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2 pt-4 border-t mt-2 flex justify-between items-end">
                    <p className="text-sm font-medium text-muted-foreground">Total Price</p>
                    <p className="text-2xl font-bold text-primary">₱{Number(booking.total_price).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
