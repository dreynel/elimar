'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

interface Client {
  id: number;
  name: string;
  email: string;
}

interface Booking {
  id: number;
  adults: number;
  kids: number;
  pwd: number;
  senior: number;
  check_in_date: string;
  accommodation_name?: string;
}

interface GuestEntry {
  name: string;
  address: string;
  type: 'adult' | 'kid' | 'pwd' | 'senior';
}

export default function ReportsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<string>('all-time');
  const [reportScope, setReportScope] = useState<string>('entire');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [guestEntries, setGuestEntries] = useState<GuestEntry[]>([]);
  const [savingLog, setSavingLog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/reports/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientBooking = async (clientId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter bookings by user_id
        const userBookings = data.data.filter((b: any) => b.user_id === parseInt(clientId));
        setClientBookings(userBookings);
        
        if (userBookings.length > 0) {
          // Auto-select first booking if only one exists
          if (userBookings.length === 1) {
            handleBookingSelect(userBookings[0]);
          } else {
            // Reset selection for multiple bookings
            setSelectedBooking(null);
            setSelectedBookingId('');
            setGuestEntries([]);
          }
        } else {
          setSelectedBooking(null);
          setSelectedBookingId('');
          setGuestEntries([]);
        }
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch booking details',
        variant: 'destructive',
      });
    }
  };

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedBookingId(booking.id.toString());
    
    // Initialize guest entries based on booking data
    const entries: GuestEntry[] = [];
    for (let i = 0; i < (booking.adults || 0); i++) {
      entries.push({ name: '', address: '', type: 'adult' });
    }
    for (let i = 0; i < (booking.kids || 0); i++) {
      entries.push({ name: '', address: '', type: 'kid' });
    }
    for (let i = 0; i < (booking.pwd || 0); i++) {
      entries.push({ name: '', address: '', type: 'pwd' });
    }
    for (let i = 0; i < (booking.senior || 0); i++) {
      entries.push({ name: '', address: '', type: 'senior' });
    }
    setGuestEntries(entries);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    setClientBookings([]);
    setSelectedBookingId('');
    if (clientId) {
      fetchClientBooking(clientId);
    } else {
      setSelectedBooking(null);
      setGuestEntries([]);
    }
  };

  const handleGuestNameChange = (index: number, name: string) => {
    const updated = [...guestEntries];
    updated[index].name = name;
    setGuestEntries(updated);
  };

  const handleGuestAddressChange = (index: number, address: string) => {
    const updated = [...guestEntries];
    updated[index].address = address;
    setGuestEntries(updated);
  };

  const handleSaveLogClick = () => {
    if (!selectedClient || !selectedBooking) {
      toast({
        title: 'Error',
        description: 'Please select a client first',
        variant: 'destructive',
      });
      return;
    }

    if (guestEntries.some(entry => !entry.name.trim())) {
      toast({
        title: 'Error',
        description: 'Please fill in all guest names',
        variant: 'destructive',
      });
      return;
    }

    if (guestEntries.some(entry => !entry.address.trim())) {
      toast({
        title: 'Error',
        description: 'Please fill in all guest addresses',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleSaveLog = async () => {
    if (!selectedBooking) {
      toast({
        title: 'Error',
        description: 'No booking selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingLog(true);
      setShowConfirmDialog(false);
      const token = localStorage.getItem('token');
      const guestNames = JSON.stringify(guestEntries);

      const response = await fetch(`${API_URL}/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          guest_names: guestNames
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Guest log saved successfully',
        });
        setSelectedClient('');
        setSelectedBooking(null);
        setGuestEntries([]);
      } else {
        throw new Error('Failed to save log');
      }
    } catch (error) {
      console.error('Error saving log:', error);
      toast({
        title: 'Error',
        description: 'Failed to save guest log',
        variant: 'destructive',
      });
    } finally {
      setSavingLog(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');

      let url = `${API_URL}/api/reports/generate?reportType=all-time&scope=${reportScope}`;
      
      if (reportPeriod !== 'all-time') {
        url = `${API_URL}/api/reports/generate?reportType=month&month=${reportPeriod.split('-')[1]}&year=${reportPeriod.split('-')[0]}&scope=${reportScope}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `logbook-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Report generated successfully',
      });
      setIsReportModalOpen(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs and Reports</h1>
          <p className="text-muted-foreground mt-1">
            Manage guest logs and generate comprehensive reports
          </p>
        </div>

        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Report</DialogTitle>
              <DialogDescription>
                Select a time period for your report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scope">Report Scope</Label>
                <Select value={reportScope} onValueChange={setReportScope}>
                  <SelectTrigger id="scope">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entire">Entire Report</SelectItem>
                    <SelectItem value="guest-list">Guest List Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Report Period</Label>
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all-time">All Time</SelectItem>
                    {months.map((month, index) => (
                      <SelectItem key={month} value={`${currentYear}-${String(index + 1).padStart(2, '0')}`}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Logbook UI */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side - Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Client</CardTitle>
            <CardDescription>
              Choose a client to view and log guest information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={selectedClient} onValueChange={handleClientSelect}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show booking dropdown if client has multiple bookings */}
            {clientBookings.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="booking">Select Booking</Label>
                <Select value={selectedBookingId} onValueChange={(id) => {
                  const booking = clientBookings.find(b => b.id.toString() === id);
                  if (booking) handleBookingSelect(booking);
                }}>
                  <SelectTrigger id="booking">
                    <SelectValue placeholder="Select a booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientBookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id.toString()}>
                        Booking #{booking.id} - {booking.accommodation_name || 'N/A'} ({new Date(booking.check_in_date).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedBooking && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Booking Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Adults:</span>
                    <span className="ml-2 font-medium">{selectedBooking.adults || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kids:</span>
                    <span className="ml-2 font-medium">{selectedBooking.kids || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PWD:</span>
                    <span className="ml-2 font-medium">{selectedBooking.pwd || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Senior:</span>
                    <span className="ml-2 font-medium">{selectedBooking.senior || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Side - Guest Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Names & Addresses</CardTitle>
            <CardDescription>
              Enter the names and addresses of all guests for this booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClient ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Select a client to begin logging guest names
              </div>
            ) : guestEntries.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No booking found for this client
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                  {guestEntries.map((entry, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder={`${entry.type.toUpperCase()} - Guest ${index + 1}`}
                            value={entry.name}
                            onChange={(e) => handleGuestNameChange(index, e.target.value)}
                          />
                        </div>
                        <div className="w-20 text-center">
                          <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                            {entry.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Address"
                          value={entry.address}
                          onChange={(e) => handleGuestAddressChange(index, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleSaveLogClick}
                  disabled={savingLog || guestEntries.some(e => !e.name.trim() || !e.address.trim())}
                  className="w-full"
                >
                  {savingLog ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Guest Log'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Guest Information</DialogTitle>
            <DialogDescription>
              Please verify that all guest information is correct before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm font-medium">Guest List:</p>
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/30">
              {guestEntries.map((entry, index) => (
                <div key={index} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {entry.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    📍 {entry.address}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure all the information provided is correct?
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLog}
              className="flex-1"
            >
              Continue & Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
