'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, MoreVertical, UserCheck, X, Calendar, Eye, User, Home, MapPin, Sun, Moon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTimeSlotSettings } from '@/contexts/TimeSlotContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

type TimeSlotType = 'morning' | 'night' | 'whole_day';

interface Accommodation {
  id: number;
  name: string;
  type: 'room' | 'cottage';
  capacity: string;
  price: number;
  add_price: number | null;
}

interface Guest {
  id: string;
  name: string;
  address: string;
  type: 'adult' | 'kid' | 'senior' | 'pwd';
}

interface WalkInLog {
  id: number;
  client_name: string;
  guest_names: string | null;
  address: string | null;
  accommodation_id: number | null;
  accommodation_name?: string;
  check_in_date: string;
  time_slot?: TimeSlotType;
  adults: number;
  kids: number;
  pwd: number;
  amount_paid: number;
  checked_out: boolean;
  checked_out_at?: string | null;
  created_at: string;
  created_by_name?: string;
}

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WalkInPage() {
  const { getTimeSlotLabel, getTimeSlotDescription } = useTimeSlotSettings();
  const [logs, setLogs] = useState<WalkInLog[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WalkInLog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WalkInLog | null>(null);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutLogId, setCheckoutLogId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<number | null>(null);
  const [deleteLogName, setDeleteLogName] = useState<string>('');

  // Guest list state
  const [guests, setGuests] = useState<Guest[]>([
    { id: crypto.randomUUID(), name: '', address: '', type: 'adult' }
  ]);

  // Accommodation type state
  const [accommodationType, setAccommodationType] = useState<'room' | 'cottage' | ''>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotType>('morning');
  const [availableAccommodations, setAvailableAccommodations] = useState<number[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    address: '',
    accommodation_id: '',
    check_in_date: getLocalDateString(),
    amount_paid: '' as string | number,
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch available accommodations when date, time slot, or accommodation type changes
  useEffect(() => {
    const fetchAvailableAccommodations = async () => {
      if (!formData.check_in_date || !selectedTimeSlot || !accommodationType) {
        setAvailableAccommodations([]);
        return;
      }

      setLoadingAvailability(true);
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          date: formData.check_in_date,
          time_slot: selectedTimeSlot,
          accommodation_type: accommodationType,
        });

        console.log('Fetching availability with params:', {
          date: formData.check_in_date,
          time_slot: selectedTimeSlot,
          accommodation_type: accommodationType,
        });

        const response = await fetch(
          `${API_URL}/api/availability/available-accommodations?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Available accommodations response:', data);
          
          // Robustly extract availableAccommodationIds from response
          // Handle different response structures: data.data.availableAccommodationIds or data.availableAccommodationIds
          let ids: number[] = [];
          
          if (data?.data?.availableAccommodationIds && Array.isArray(data.data.availableAccommodationIds)) {
            ids = data.data.availableAccommodationIds;
          } else if (data?.availableAccommodationIds && Array.isArray(data.availableAccommodationIds)) {
            ids = data.availableAccommodationIds;
          }
          
          // Ensure all IDs are valid numbers and filter out any invalid values
          ids = ids.filter(id => typeof id === 'number' && id > 0 && Number.isInteger(id));
          
          console.log('Extracted and validated available IDs:', ids);
          setAvailableAccommodations(ids);
        } else {
          console.error('Failed to fetch available accommodations:', response.status);
          setAvailableAccommodations([]);
        }
      } catch (error) {
        console.error('Error fetching available accommodations:', error);
        setAvailableAccommodations([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailableAccommodations();
  }, [formData.check_in_date, selectedTimeSlot, accommodationType]);


  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [logsRes, accommodationsRes] = await Promise.all([
        fetch(`${API_URL}/api/walk_in`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/accommodations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.data || []);
      }

      if (accommodationsRes.ok) {
        const accommodationsData = await accommodationsRes.json();
        setAccommodations(accommodationsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingLog
        ? `${API_URL}/api/walk_in/${editingLog.id}`
        : `${API_URL}/api/walk_in`;
      const method = editingLog ? 'PUT' : 'POST';

      // Serialize guests to JSON string
      const guestNamesJson = JSON.stringify(guests);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          guest_names: guestNamesJson,
          accommodation_id: formData.accommodation_id ? parseInt(formData.accommodation_id) : null,
          time_slot: selectedTimeSlot,
          adults: 0,
          kids: 0,
          pwd: 0,
          amount_paid: formData.amount_paid === '' ? 0 : Number(formData.amount_paid),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save walk-in log');
      }

      toast({
        title: 'Success',
        description: `Walk-in log ${editingLog ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving walk-in log:', error);
      toast({
        title: 'Error',
        description: 'Failed to save walk-in log',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (log: WalkInLog) => {
    setEditingLog(log);
    setFormData({
      client_name: log.client_name,
      address: log.address || '',
      accommodation_id: log.accommodation_id?.toString() || '',
      check_in_date: log.check_in_date,
      amount_paid: log.amount_paid || '',
    });

    // Set time slot
    setSelectedTimeSlot(log.time_slot || 'morning');

    // Set accommodation type if accommodation is selected
    if (log.accommodation_id) {
      const acc = accommodations.find(a => a.id === log.accommodation_id);
      if (acc) {
        setAccommodationType(acc.type);
      }
    }

    // Parse guest_names JSON or create default guest
    try {
      if (log.guest_names) {
        const parsedGuests = JSON.parse(log.guest_names) as Guest[];
        // Ensure each guest has an address field (for backwards compatibility)
        const guestsWithAddress = parsedGuests.map(g => ({
          ...g,
          address: g.address || ''
        }));
        setGuests(guestsWithAddress.length > 0 ? guestsWithAddress : [{ id: crypto.randomUUID(), name: '', address: '', type: 'adult' }]);
      } else {
        setGuests([{ id: crypto.randomUUID(), name: '', address: '', type: 'adult' }]);
      }
    } catch {
      setGuests([{ id: crypto.randomUUID(), name: '', address: '', type: 'adult' }]);
    }

    setIsDialogOpen(true);
  };

  const handleView = (log: WalkInLog) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };

  const handleCheckOut = async (logId: number) => {
    setCheckoutLogId(logId);
    setIsCheckoutDialogOpen(true);
  };

  const confirmCheckOut = async () => {
    if (!checkoutLogId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/walk_in/${checkoutLogId}/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to check out walk-in log');
      }

      toast({
        title: 'Success',
        description: 'Guest checked out successfully',
      });

      fetchData();
    } catch (error) {
      console.error('Error checking out walk-in log:', error);
      toast({
        title: 'Error',
        description: 'Failed to check out walk-in log',
        variant: 'destructive',
      });
    } finally {
      setIsCheckoutDialogOpen(false);
      setCheckoutLogId(null);
    }
  };

  const openDeleteDialog = (logId: number, clientName: string) => {
    setDeleteLogId(logId);
    setDeleteLogName(clientName);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteLogId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/walk_in/${deleteLogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete walk-in log');
      }

      toast({
        title: 'Success',
        description: 'Walk-in log deleted successfully',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting walk-in log:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete walk-in log',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteLogId(null);
      setDeleteLogName('');
    }
  };

  const resetForm = () => {
    setEditingLog(null);
    setGuests([{ id: crypto.randomUUID(), name: '', address: '', type: 'adult' }]);
    setAccommodationType('');
    setSelectedTimeSlot('morning');
    setFormData({
      client_name: '',
      address: '',
      accommodation_id: '',
      check_in_date: getLocalDateString(),
      amount_paid: '',
    });
  };

  const addGuest = () => {
    setGuests([...guests, { id: crypto.randomUUID(), name: '', address: '', type: 'adult' }]);
  };

  const removeGuest = (id: string) => {
    if (guests.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'At least one guest is required',
        variant: 'destructive',
      });
      return;
    }
    setGuests(guests.filter(guest => guest.id !== id));
  };

  const updateGuest = (id: string, field: 'name' | 'address' | 'type', value: string) => {
    setGuests(guests.map(guest => 
      guest.id === id ? { ...guest, [field]: value } : guest
    ));
  };

  // Filter logs by tab
  const filteredLogs = logs.filter(log => 
    activeTab === 'ongoing' ? !log.checked_out : log.checked_out
  );

  // Calculate total guests from guest_names JSON
  const getTotalGuests = (log: WalkInLog): number => {
    try {
      if (log.guest_names) {
        const guests = JSON.parse(log.guest_names) as Guest[];
        // Add 1 for the client
        return guests.length + 1;
      }
    } catch {
      // Fallback to old calculation if JSON parsing fails
      return (log.adults || 0) + (log.kids || 0) + (log.pwd || 0) + 1;
    }
    // Default: client only
    return 1;
  };

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
          <h1 className="text-3xl font-bold">Walk-In Log Book</h1>
          <p className="text-muted-foreground mt-1">
            Manage walk-in guests and their accommodation details
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Walk-In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLog ? 'Edit Walk-In Log' : 'Add Walk-In Guest'}
              </DialogTitle>
              <DialogDescription>
                Enter the guest details and assign an available accommodation
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) =>
                      setFormData({ ...formData, client_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Guest Names & Addresses</Label>
                    <Button type="button" size="sm" className="text-primary" variant="outline" onClick={addGuest}>
                      <Plus className="w-4 h-4 mr-1 text-primary" />
                      Add Guest
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {guests.map((guest, index) => (
                      <div key={guest.id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground w-16">Guest {index + 1}</span>
                          <Input
                            placeholder="Guest name"
                            value={guest.name}
                            onChange={(e) => updateGuest(guest.id, 'name', e.target.value)}
                            className="flex-1"
                          />
                          <Select
                            value={guest.type}
                            onValueChange={(value) => updateGuest(guest.id, 'type', value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="adult">Adult</SelectItem>
                              <SelectItem value="kid">Kid</SelectItem>
                              <SelectItem value="senior">Senior</SelectItem>
                              <SelectItem value="pwd">PWD</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeGuest(guest.id)}
                            disabled={guests.length === 1}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 pl-16">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Address"
                            value={guest.address}
                            onChange={(e) => updateGuest(guest.id, 'address', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="accommodation_type">Accommodation Type</Label>
                  <Select
                    value={accommodationType}
                    onValueChange={(value: 'room' | 'cottage' | '') => {
                      setAccommodationType(value);
                      setFormData({ ...formData, accommodation_id: '' });
                      setSelectedTimeSlot('morning');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="cottage">Cottage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Slot Selection - Show after accommodation type is selected */}
                {accommodationType && (
                  <div className="col-span-2">
                    <Label className="mb-2 block">Time Slot</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTimeSlot('morning');
                          // Clear accommodation selection when changing time slot
                          setFormData(prev => ({ ...prev, accommodation_id: '' }));
                        }}
                        className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center gap-1 ${
                          selectedTimeSlot === 'morning' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <Sun className={`h-5 w-5 ${selectedTimeSlot === 'morning' ? 'text-primary' : 'text-amber-500'}`} />
                        <span className="text-sm font-medium">{getTimeSlotLabel('morning')}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeSlotDescription('morning', accommodationType)}
                        </span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTimeSlot('night');
                          setFormData(prev => ({ ...prev, accommodation_id: '' }));
                        }}
                        className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center gap-1 ${
                          selectedTimeSlot === 'night' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <Moon className={`h-5 w-5 ${selectedTimeSlot === 'night' ? 'text-primary' : 'text-indigo-500'}`} />
                        <span className="text-sm font-medium">{getTimeSlotLabel('night')}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeSlotDescription('night', accommodationType)}
                        </span>
                      </button>
                      
                      {/* Whole Day only for Rooms */}
                      {accommodationType === 'room' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTimeSlot('whole_day');
                            setFormData(prev => ({ ...prev, accommodation_id: '' }));
                          }}
                          className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center gap-1 ${
                            selectedTimeSlot === 'whole_day' 
                              ? 'border-primary bg-primary/10' 
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <div className="flex gap-0.5">
                            <Sun className={`h-4 w-4 ${selectedTimeSlot === 'whole_day' ? 'text-primary' : 'text-amber-500'}`} />
                            <Moon className={`h-4 w-4 ${selectedTimeSlot === 'whole_day' ? 'text-primary' : 'text-indigo-500'}`} />
                          </div>
                          <span className="text-sm font-medium">{getTimeSlotLabel('whole_day')}</span>
                          <span className="text-xs text-muted-foreground">{getTimeSlotDescription('whole_day', 'room')}</span>
                        </button>
                      )}
                    </div>
                    {accommodationType === 'cottage' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ℹ️ Cottages: Morning and Night slots are independent (no overnight stays)
                      </p>
                    )}
                  </div>
                )}

                {accommodationType && (
                  <div className="col-span-2">
                    <Label htmlFor="accommodation_id">
                      {accommodationType === 'room' ? 'Select Room' : 'Select Cottage'}
                    </Label>
                    <Select
                      value={formData.accommodation_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, accommodation_id: value });
                        // Auto-calculate amount based on selection and current time slot
                        const acc = accommodations.find(a => a.id.toString() === value);
                        if (acc) {
                          const price = (selectedTimeSlot === 'night' || selectedTimeSlot === 'whole_day') && acc.add_price ? acc.add_price : acc.price;
                          setFormData(prev => ({ ...prev, accommodation_id: value, amount_paid: price }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${accommodationType}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingAvailability ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading available accommodations...
                          </div>
                        ) : (
                          <>
                            {accommodations
                              .filter(acc => 
                                acc.type === accommodationType && 
                                availableAccommodations.includes(acc.id)
                              ).length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  No available {accommodationType}s for selected date and time slot
                                </div>
                              ) : (
                                accommodations
                                  .filter(acc => 
                                    acc.type === accommodationType && 
                                    availableAccommodations.includes(acc.id)
                                  )
                                  .map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id.toString()}>
                                      {acc.name} - ₱{acc.price.toLocaleString()}
                                      {acc.add_price && ` (Night/Whole Day: ₱${acc.add_price.toLocaleString()})`}
                                    </SelectItem>
                                  ))
                              )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="col-span-2">
                  <Label htmlFor="check_in_date">Check-In Date *</Label>
                  <Input
                    id="check_in_date"
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) =>
                      setFormData({ ...formData, check_in_date: e.target.value })
                    }
                    min={getLocalDateString()}
                    max={getLocalDateString()}
                    required
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ℹ️ Walk-ins can only be added for today&apos;s date
                  </p>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="amount_paid">Amount Paid (₱)</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount_paid}
                    onChange={(e) =>
                      setFormData({ ...formData, amount_paid: e.target.value === '' ? '' : parseFloat(e.target.value) })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingLog ? 'Update' : 'Add'} Walk-In</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ongoing' | 'completed')}>
        <TabsList className="mb-4">
          <TabsTrigger value="ongoing" className="gap-2">
            <Calendar className="w-4 h-4" />
            Ongoing ({logs.filter(log => !log.checked_out).length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <UserCheck className="w-4 h-4" />
            Completed ({logs.filter(log => log.checked_out).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Ongoing Walk-Ins
              </CardTitle>
              <CardDescription className="mt-1">Active walk-in guests currently at the resort</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No ongoing walk-ins. Click "Add Walk-In" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Accommodation</TableHead>
                        <TableHead>Check-In</TableHead>
                        <TableHead>Guests</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{log.client_name}</TableCell>
                          <TableCell>{log.accommodation_name || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(log.check_in_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getTotalGuests(log)} {getTotalGuests(log) === 1 ? 'guest' : 'guests'}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-green-600">
                              ₱{(log.amount_paid || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(log)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-blue-600"
                                  onClick={() => handleCheckOut(log.id)}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Check-out
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(log.id, log.client_name)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Completed Walk-Ins
              </CardTitle>
              <CardDescription className="mt-1">Checked-out walk-in guests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No completed walk-ins yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Accommodation</TableHead>
                        <TableHead>Check-In</TableHead>
                        <TableHead>Check-Out</TableHead>
                        <TableHead>Guests</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{log.client_name}</TableCell>
                          <TableCell>{log.accommodation_name || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(log.check_in_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {log.checked_out_at 
                              ? new Date(log.checked_out_at).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getTotalGuests(log)} {getTotalGuests(log) === 1 ? 'guest' : 'guests'}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-green-600">
                              ₱{(log.amount_paid || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(log)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(log.id, log.client_name)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Walk-In Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the walk-in log for <strong>{deleteLogName}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeleteLogId(null);
              setDeleteLogName('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Walk-In Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Walk-In Guest Details</DialogTitle>
            <DialogDescription>
              Walk-In ID: #{selectedLog?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
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
                    <p className="font-medium">{selectedLog.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={selectedLog.checked_out ? 'default' : 'outline'}
                      className={
                        selectedLog.checked_out
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }
                    >
                      {selectedLog.checked_out ? 'Checked Out' : 'Ongoing'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Accommodation Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  Accommodation Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedLog.accommodation_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Check-In/Out Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Check-In/Out Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in Date</p>
                    <p className="font-medium">{new Date(selectedLog.check_in_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  {selectedLog.checked_out && selectedLog.checked_out_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out Date</p>
                      <p className="font-medium">{new Date(selectedLog.checked_out_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">{new Date(selectedLog.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Guest Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total Guests</p>
                    <p className="font-medium text-lg">{getTotalGuests(selectedLog)} {getTotalGuests(selectedLog) === 1 ? 'guest' : 'guests'}</p>
                  </div>
                  {selectedLog.guest_names && (() => {
                    try {
                      const guests = JSON.parse(selectedLog.guest_names) as Guest[];
                      if (guests.length > 0) {
                        return (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">Guest List</p>
                            <div className="space-y-2">
                              {guests.map((guest, index) => (
                                <div key={index} className="p-2 bg-background rounded border space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{guest.name || `Guest ${index + 1}`}</span>
                                    <Badge variant="outline" className="capitalize">{guest.type}</Badge>
                                  </div>
                                  {guest.address && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      {guest.address}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch {
                      return null;
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Payment Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  Payment Information
                </h3>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="font-bold text-2xl text-green-600">
                    ₱{(selectedLog.amount_paid || 0).toLocaleString('en-PH')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Confirmation Dialog */}
      <AlertDialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out this guest? This action will mark the walk-in as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckOut}>
              Yes, Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
