'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Home, Users, Mail, TrendingUp, CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { API_URL } from '@/lib/utils';

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
  booking_time?: string;
  time_slot?: TimeSlotType;
  check_out_date?: string;
  adults?: number;
  kids?: number;
  pwd?: number;
  total_price: number;
  status: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  accommodation_name?: string;
  // Event booking fields
  booking_type?: 'regular' | 'event';
  event_type?: 'whole_day' | 'evening' | 'morning';
  booking_date?: string;
}

export default function AdminCalendarPage() {
  const todayDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(todayDate);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(todayDate);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Booking | undefined>();
  const [currentBookingIndex, setCurrentBookingIndex] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Helper function to get time slot key (defined here for use in useEffect)
  const getBookingTimeSlotKey = (booking: Booking): string => {
    if (booking.booking_type === 'event') {
      return booking.event_type || 'whole_day';
    }
    return booking.time_slot || 'morning';
  };

  // Helper function to filter bookings for a date (defined here for use in useEffect)
  const filterBookingsForDate = (date: Date, allBookings: Booking[]): Booking[] => {
    const dateBookings = allBookings.filter(b => isSameDay(new Date(b.check_in_date), date));
    
    if (dateBookings.length === 0) return [];

    // Group bookings by accommodation + time slot
    const groupedBookings = new Map<string, Booking[]>();
    
    dateBookings.forEach(booking => {
      const accommodationKey = booking.booking_type === 'event' 
        ? `event_${booking.event_type}` 
        : `${booking.accommodation_id}_${getBookingTimeSlotKey(booking)}`;
      
      if (!groupedBookings.has(accommodationKey)) {
        groupedBookings.set(accommodationKey, []);
      }
      groupedBookings.get(accommodationKey)!.push(booking);
    });

    // For each group, apply visibility rules
    const filteredBookings: Booking[] = [];
    
    groupedBookings.forEach((groupBookings) => {
      // Check if there's an approved booking in this group
      const approvedBooking = groupBookings.find(b => b.status === 'approved');
      
      if (approvedBooking) {
        // If approved booking exists, show only the approved one
        filteredBookings.push(approvedBooking);
      } else {
        // No approved booking, show all pending bookings
        const pendingBookings = groupBookings.filter(b => b.status === 'pending');
        filteredBookings.push(...pendingBookings);
      }
    });

    return filteredBookings;
  };

  useEffect(() => {
    if (selectedDate && bookings.length > 0) {
      const filteredBookings = filterBookingsForDate(selectedDate, bookings);
      if (filteredBookings.length > 0) {
        setSelectedReservation(filteredBookings[currentBookingIndex] || filteredBookings[0]);
      } else {
        setSelectedReservation(undefined);
        setCurrentBookingIndex(0);
      }
    }
  }, [selectedDate, bookings, currentBookingIndex]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Fetch both regular bookings and event bookings in parallel
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
      }));

      const eventBookings = (eventData.data || []).map((booking: any) => ({
        ...booking,
        booking_type: 'event' as const,
        check_in_date: booking.booking_date, // Map booking_date to check_in_date for consistency
        accommodation_name: `Event: ${booking.event_type?.replace('_', ' ').toUpperCase()}`,
        adults: 0,
        kids: 0,
        pwd: 0,
      }));

      // Combine and sort by creation date
      const allBookings = [...regularBookings, ...eventBookings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Filter out rejected and cancelled bookings - they should not appear on calendar
      const visibleBookings = allBookings.filter(
        (b: Booking) => b.status !== 'rejected' && b.status !== 'cancelled'
      );

      setBookings(visibleBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevMonthDay = new Date(year, month, -i);
      days.unshift({
        date: prevMonthDay,
        isCurrentMonth: false,
        hasBooking: hasBookingOnDate(prevMonthDay)
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        hasBooking: hasBookingOnDate(currentDate)
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        hasBooking: hasBookingOnDate(nextMonthDay)
      });
    }
    
    return days;
  };

  const hasBookingOnDate = (date: Date) => {
    return filterBookingsForDate(date, bookings).length > 0;
  };

  const getBookingCountForDate = (date: Date) => {
    return filterBookingsForDate(date, bookings).length;
  };

  // Wrapper function for convenience
  const getFilteredBookingsForDate = (date: Date): Booking[] => {
    return filterBookingsForDate(date, bookings);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(todayDate);
    setSelectedDate(todayDate);
    const filteredBookings = getFilteredBookingsForDate(todayDate);
    setSelectedReservation(filteredBookings[0]);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentBookingIndex(0);
    const filteredBookings = getFilteredBookingsForDate(date);
    setSelectedReservation(filteredBookings[0]);
  };

  const handlePreviousBooking = () => {
    if (!selectedDate) return;
    const filteredBookings = getFilteredBookingsForDate(selectedDate);
    if (filteredBookings.length > 0) {
      setCurrentBookingIndex(prev => 
        prev > 0 ? prev - 1 : filteredBookings.length - 1
      );
    }
  };

  const handleNextBooking = () => {
    if (!selectedDate) return;
    const filteredBookings = getFilteredBookingsForDate(selectedDate);
    if (filteredBookings.length > 0) {
      setCurrentBookingIndex(prev => 
        prev < filteredBookings.length - 1 ? prev + 1 : 0
      );
    }
  };

  const days = getDaysInMonth(currentMonth);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthlyBookings = useMemo(() => 
    bookings.filter(b => isSameMonth(new Date(b.check_in_date), currentMonth)), 
    [bookings, currentMonth]
  );

  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    return filterBookingsForDate(selectedDate, bookings);
  }, [bookings, selectedDate]);

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

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        <div className="lg:col-span-2 flex flex-col">
          <Card className="shadow-lg border-2 flex-1 flex flex-col hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-4 flex-shrink-0 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {monthlyBookings.length} total bookings this month
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={goToToday} className="hidden sm:flex">Today</Button>
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map(day => (
                  <div key={day} className="text-center py-3 text-sm font-semibold text-muted-foreground border-b-2">{day}</div>
                ))}
                {days.map((day, index) => {
                  const isTodayDate = isSameDay(day.date, todayDate);
                  const bookingCount = getBookingCountForDate(day.date);
                  const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                  return (
                    <div 
                      key={index}
                      className={`h-20 p-2 relative border rounded-lg cursor-pointer transition-all duration-200 ${day.isCurrentMonth ? 'bg-background hover:bg-accent/50' : 'bg-muted/30 text-muted-foreground'} ${isSelected ? 'bg-primary/10 font-bold shadow-[inset_0_0_0_2px_hsl(var(--primary))] border-transparent' : ''} ${day.hasBooking && day.isCurrentMonth && !isSelected && !isTodayDate ? 'border-primary/50' : !isSelected && !isTodayDate ? 'border-border' : ''} ${isTodayDate && day.isCurrentMonth && !isSelected ? 'bg-primary/10 font-bold shadow-[inset_0_0_0_2px_hsl(var(--primary))] border-transparent' : ''} hover:shadow-sm`}
                      onClick={() => handleDateSelect(day.date)}
                    >
                      <div className={`text-sm font-medium ${(isTodayDate || isSelected) ? 'text-primary' : ''} flex items-center justify-between`}>
                        <span>{day.date.getDate()}</span>
                        {isTodayDate && day.isCurrentMonth && !isSelected && (<div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>)}
                      </div>
                      {bookingCount > 0 && day.isCurrentMonth && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center justify-center gap-1">
                            <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                            {bookingCount > 1 && (<span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 rounded-full">{bookingCount}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow h-full flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                </CardTitle>
                {selectedDateBookings.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handlePreviousBooking}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                      {currentBookingIndex + 1} / {selectedDateBookings.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleNextBooking}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-auto">{selectedReservation ? (
                <div className="space-y-5">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-primary">{selectedReservation.user_name || selectedReservation.user_email || 'Unknown Client'}</h3>
                      <Badge 
                        variant={
                          selectedReservation.status === 'approved' ? 'default' 
                          : selectedReservation.status === 'completed' ? 'default' 
                          : selectedReservation.status === 'pending' ? 'outline'
                          : 'destructive'
                        } 
                        className={`ml-2 ${
                          selectedReservation.status === 'approved' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : selectedReservation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : selectedReservation.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : ''
                        }`}
                      >
                        {selectedReservation.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {selectedReservation.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {selectedReservation.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {selectedReservation.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                        {selectedReservation.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {selectedReservation.status.charAt(0).toUpperCase() + selectedReservation.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                      <CalendarIcon className="w-4 h-4" />
                      {format(new Date(selectedReservation.check_in_date), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time Slot: {selectedReservation.time_slot 
                        ? TIME_SLOT_LABELS[selectedReservation.time_slot]
                        : selectedReservation.booking_time 
                          ? new Date(`2000-01-01T${selectedReservation.booking_time}`).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })
                          : selectedReservation.booking_type === 'event'
                            ? (selectedReservation.event_type === 'whole_day' 
                                ? 'Whole Day (9 AM - 10 PM)' 
                                : selectedReservation.event_type === 'morning' 
                                  ? 'Morning (9 AM - 12 PM)' 
                                  : 'Evening (5 PM - 10 PM)')
                            : '9:00 AM'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Home className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Accommodation</p>
                        <p className="font-semibold">{selectedReservation.accommodation_name || `Accommodation #${selectedReservation.accommodation_id}`}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Users className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Guests</p>
                        <p className="font-semibold">
                          {selectedReservation.booking_type === 'event' 
                            ? 'Event Booking' 
                            : `${(selectedReservation.adults || 0) + (selectedReservation.kids || 0) + (selectedReservation.pwd || 0)} people`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Contact Information</p>
                        <div className="space-y-1.5">
                          <p className="text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{selectedReservation.user_email || 'No email'}</p>
                        </div>
                      </div>
                    </div>
                    {selectedReservation.status !== 'cancelled' && selectedReservation.total_price > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                          <p className="font-bold text-lg text-green-600 dark:text-green-400">₱{selectedReservation.total_price.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No booking for this date.</p>
                  <p className="text-sm text-muted-foreground mt-1">Select a date with bookings to view details.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
