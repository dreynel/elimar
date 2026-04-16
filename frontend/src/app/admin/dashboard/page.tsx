'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/utils';
import {
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Monthly Reservations',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

interface Booking {
  id: number;
  user_id: number;
  accommodation_id?: number;
  check_in: string;
  check_out?: string;
  guests?: number;
  total_price: number;
  status: string;
  created_at: string;
  accommodation_name?: string;
  user_name?: string;
  user_email?: string;
  // Event booking fields
  booking_type?: 'regular' | 'event' | 'walk-in';
  event_type?: 'whole_day' | 'evening' | 'morning';
  booking_date?: string;
  check_in_date?: string;
}

interface WalkInLog {
  id: number;
  client_name: string;
  guest_names: string | null;
  address: string | null;
  accommodation_id: number | null;
  check_in_date: string;
  adults: number;
  kids: number;
  pwd: number;
  amount_paid: number;
  checked_out: boolean;
  checked_out_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  accommodation_name?: string;
  created_by_name?: string;
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchBookings();
    
    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchBookings();
    }, 30000);

    // Refresh when user returns to the page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBookings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchBookings = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Fetch regular bookings, event bookings, and walk-in logs in parallel
      const [regularResponse, eventResponse, walkInResponse] = await Promise.all([
        fetch(`${API_URL}/api/bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/api/event_bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/api/walk_in`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      if (!regularResponse.ok || !eventResponse.ok || !walkInResponse.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const regularData = await regularResponse.json();
      const eventData = await eventResponse.json();
      const walkInData = await walkInResponse.json();

      // Mark booking types and combine
      const regularBookings = (regularData.data || []).map((booking: any) => ({
        ...booking,
        booking_type: 'regular' as const,
        check_in: booking.check_in_date,
      }));

      const eventBookings = (eventData.data || []).map((booking: any) => ({
        ...booking,
        booking_type: 'event' as const,
        check_in: booking.booking_date, // Map booking_date to check_in for consistency
        accommodation_name: `Event: ${booking.event_type?.replace('_', ' ').toUpperCase()}`,
        guests: 0, // Events don't have individual guest counts
      }));

      const walkInBookings = (walkInData.data || []).map((log: WalkInLog) => ({
        id: log.id,
        user_id: 0,
        accommodation_id: log.accommodation_id,
        check_in: log.check_in_date,
        check_out: log.checked_out_at,
        guests: log.adults + log.kids,
        total_price: log.amount_paid,
        status: log.checked_out ? 'completed' : 'confirmed',
        created_at: log.created_at,
        accommodation_name: log.accommodation_name || `Accommodation #${log.accommodation_id}`,
        user_name: log.client_name,
        user_email: '',
        booking_type: 'walk-in' as const,
      }));

      // Combine and sort by creation date
      const allBookings = [...regularBookings, ...eventBookings, ...walkInBookings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setBookings(allBookings);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Calculate stats from bookings (regular, event, and walk-in bookings)
  const stats = {
    totalReservations: bookings.length,
    confirmedBookings: bookings.filter(b => 
      b.status === 'confirmed' || b.status === 'approved' || b.status === 'completed'
    ).length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
  };

  // Generate dynamic years starting from 2025 up to current year + 1
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = 2025; year <= Math.max(currentYear + 1, 2026); year++) {
      years.push(year);
    }
    return years;
  };
  const availableYears = generateYears();

  // Calculate monthly data for chart filtered by selected year
  const monthlyData = Array(12).fill(0);
  bookings.forEach(booking => {
    const checkInDate = new Date(booking.check_in);
    const bookingYear = checkInDate.getFullYear();
    if (bookingYear === selectedYear) {
      const month = checkInDate.getMonth();
      monthlyData[month]++;
    }
  });

  const monthlyReservationData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Reservations',
        data: monthlyData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(37, 99, 235)',
        borderWidth: 1,
      },
    ],
  };

  const statsCards = [
    {
      title: 'Total Reservations',
      value: stats.totalReservations.toString(),
      change: '+0%',
      trend: 'up',
      icon: Calendar,
      color: 'from-blue-600 to-sky-400',
    },
    {
      title: 'Confirmed Bookings',
      value: stats.confirmedBookings.toString(),
      change: '+0%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-600 to-sky-400',
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings.toString(),
      change: '0%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-blue-600 to-sky-400',
    },
  ];

  const recentBookings = bookings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

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
        <Button onClick={() => fetchBookings()}>Try Again</Button>
      </div>
    );
  }

  return (
    <>
      {/* Admin Title with Refresh Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold group-data-[collapsible=icon]:hidden">Admin</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBookings(true)}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;

          return (
            <Card
              key={index}
              className="overflow-hidden transition-all hover:shadow-lg duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon
                    className={`h-4 w-4 ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Monthly Reservations Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Monthly Reservations</CardTitle>
                <CardDescription>Reservation trends throughout the year</CardDescription>
              </div>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar options={chartOptions} data={monthlyReservationData} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings Table */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Bookings</CardTitle>
              <CardDescription className="mt-1">
                Latest reservations and their current status
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/bookings">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No bookings yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Bookings will appear here once customers make reservations
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow key={`${booking.booking_type}-${booking.id}`} className="hover:bg-muted/50">
                      <TableCell>{booking.user_name || booking.user_email || 'Unknown'}</TableCell>
                      <TableCell>{booking.accommodation_name || `Accommodation #${booking.accommodation_id}`}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === 'confirmed' || booking.status === 'approved'
                              ? 'default'
                              : booking.status === 'completed'
                              ? 'default'
                              : booking.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className={
                            booking.status === 'approved' || booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : booking.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                              : ''
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
