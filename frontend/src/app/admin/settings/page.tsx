'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { 
  Loader2, 
  AlertCircle, 
  Edit, 
  Save, 
  X,
  Users,
  Waves,
  Calendar,
  Moon,
  QrCode,
  Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/utils';

interface PricingSetting {
  id: number;
  category: string;
  type: string;
  label: string;
  price: number;
  created_at: string;
  updated_at: string;
}

interface PricingData {
  entrance: {
    adult: number;
    kids_senior_pwd: number;
  };
  swimming: {
    adult: number;
    kids_senior_pwd: number;
  };
  event: {
    whole_day: number;
    evening: number;
    morning: number;
  };
  night_swimming: {
    per_head: number;
  };
}

export default function SettingsPage() {
  const [pricingSettings, setPricingSettings] = useState<PricingSetting[]>([]);
  const [editedPricing, setEditedPricing] = useState<PricingData>({
    entrance: { adult: 0, kids_senior_pwd: 0 },
    swimming: { adult: 0, kids_senior_pwd: 0 },
    event: { whole_day: 0, evening: 0, morning: 0 },
    night_swimming: { per_head: 0 },
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // QR Code management
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isEditingQR, setIsEditingQR] = useState(false);
  const [newQRFile, setNewQRFile] = useState<File | null>(null);
  const [savingQR, setSavingQR] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPricing();
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payment-settings`);
      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.data?.qr_code_url || null);
      }
    } catch (err) {
      console.error('Failed to fetch payment settings:', err);
    }
  };

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/pricing`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing settings');
      }

      const data = await response.json();
      const settings = data.data as PricingSetting[];
      setPricingSettings(settings);

      // Convert array to grouped object
      const grouped: PricingData = {
        entrance: { adult: 0, kids_senior_pwd: 0 },
        swimming: { adult: 0, kids_senior_pwd: 0 },
        event: { whole_day: 0, evening: 0, morning: 0 },
        night_swimming: { per_head: 0 },
      };

      settings.forEach((setting) => {
        if (setting.category === 'entrance') {
          grouped.entrance[setting.type as 'adult' | 'kids_senior_pwd'] = setting.price;
        } else if (setting.category === 'swimming') {
          grouped.swimming[setting.type as 'adult' | 'kids_senior_pwd'] = setting.price;
        } else if (setting.category === 'event') {
          grouped.event[setting.type as 'whole_day' | 'evening' | 'morning'] = setting.price;
        } else if (setting.category === 'night_swimming') {
          grouped.night_swimming.per_head = setting.price;
        }
      });

      setEditedPricing(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    fetchPricing();
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Build updates array
      const updates = [
        { category: 'entrance', type: 'adult', price: editedPricing.entrance.adult },
        { category: 'entrance', type: 'kids_senior_pwd', price: editedPricing.entrance.kids_senior_pwd },
        { category: 'swimming', type: 'adult', price: editedPricing.swimming.adult },
        { category: 'swimming', type: 'kids_senior_pwd', price: editedPricing.swimming.kids_senior_pwd },
        { category: 'event', type: 'whole_day', price: editedPricing.event.whole_day },
        { category: 'event', type: 'evening', price: editedPricing.event.evening },
        { category: 'event', type: 'morning', price: editedPricing.event.morning },
        { category: 'night_swimming', type: 'per_head', price: editedPricing.night_swimming.per_head },
      ];

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update pricing');
      }

      toast({
        title: 'Success',
        description: 'Pricing updated successfully',
      });

      setIsEditing(false);
      await fetchPricing();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update pricing',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (category: keyof PricingData, type: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setEditedPricing((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: numValue,
      },
    }));
  };

  const handleQRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewQRFile(e.target.files[0]);
      setIsEditingQR(true); // Show editing UI with preview and save button
    }
  };

  const handleSaveQR = async () => {
    if (!newQRFile) {
      toast({
        title: 'Error',
        description: 'Please select a QR code image',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingQR(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to continue.',
          variant: 'destructive',
        });
        return;
      }

      const formData = new FormData();
      formData.append('qrCode', newQRFile);

      const response = await fetch(`${API_URL}/api/payment-settings/qr-code`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update QR code');
      }

      toast({
        title: 'Success',
        description: 'QR code updated successfully',
      });

      setIsEditingQR(false);
      setNewQRFile(null);
      await fetchPaymentSettings();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update QR code',
        variant: 'destructive',
      });
    } finally {
      setSavingQR(false);
    }
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
        <Button onClick={fetchPricing}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Payment & Pricing Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage payment QR code, entrance fees, swimming fees, event rates, and night swimming prices
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditingQR && (
            <Button onClick={() => qrFileInputRef.current?.click()} variant="outline" className="gap-2">
              <QrCode className="w-4 h-4" />
              Edit QR Code
            </Button>
          )}
          {!isEditing ? (
            <Button onClick={handleEdit} className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Pricing
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* QR Code Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Payment QR Code
          </CardTitle>
          <CardDescription>Manage the QR code displayed for GCash/PayMaya payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            ref={qrFileInputRef}
            onChange={handleQRFileChange}
            accept="image/*"
            className="hidden"
            aria-label="Upload QR code image"
          />
          {isEditingQR ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {qrCodeUrl && (
                  <div className="relative w-48 h-48 border-2 border-muted rounded-lg overflow-hidden">
                    <Image
                      src={qrCodeUrl.startsWith('http') ? qrCodeUrl : `${API_URL}${qrCodeUrl}`}
                      alt="Current QR Code"
                      fill
                      style={{ objectFit: 'contain' }}
                      className="p-2"
                    />
                  </div>
                )}
                {newQRFile && (
                  <div className="relative w-48 h-48 border-2 border-primary rounded-lg overflow-hidden">
                    <Image
                      src={URL.createObjectURL(newQRFile)}
                      alt="New QR Code"
                      fill
                      style={{ objectFit: 'contain' }}
                      className="p-2"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => qrFileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {newQRFile ? 'Change Image' : 'Upload QR Code'}
                </Button>
                <Button onClick={handleSaveQR} disabled={savingQR || !newQRFile} className="gap-2">
                  {savingQR ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save QR Code
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditingQR(false);
                    setNewQRFile(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {qrCodeUrl ? (
                <div className="relative w-48 h-48 border-2 border-muted rounded-lg overflow-hidden">
                  <Image
                    src={qrCodeUrl.startsWith('http') ? qrCodeUrl : `${API_URL}${qrCodeUrl}`}
                    alt="Payment QR Code"
                    fill
                    style={{ objectFit: 'contain' }}
                    className="p-2"
                  />
                </div>
              ) : (
                <div 
                  className="w-48 h-48 border-2 border-dashed border-muted rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                  onClick={() => qrFileInputRef.current?.click()}
                >
                  <div className="text-center text-muted-foreground">
                    <QrCode className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No QR code uploaded</p>
                    <p className="text-xs mt-1">Click to upload</p>
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                <p>This QR code will be displayed to customers during the payment process.</p>
                <p className="mt-2">{qrCodeUrl ? 'Click "Edit QR Code" to update it.' : 'Click to upload a QR code.'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entrance Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Entrance Fees
          </CardTitle>
          <CardDescription>Fees charged for entering the resort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entrance-adult">Adult Entrance Fee</Label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    id="entrance-adult"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedPricing.entrance.adult}
                    onChange={(e) => handlePriceChange('entrance', 'adult', e.target.value)}
                    className="pl-7"
                  />
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  ₱{Number(editedPricing.entrance.adult).toFixed(2)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entrance-kids">Kids/Senior/PWD Entrance Fee</Label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    id="entrance-kids"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedPricing.entrance.kids_senior_pwd}
                    onChange={(e) => handlePriceChange('entrance', 'kids_senior_pwd', e.target.value)}
                    className="pl-7"
                  />
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  ₱{Number(editedPricing.entrance.kids_senior_pwd).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swimming Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            Swimming Fees
          </CardTitle>
          <CardDescription>Additional fees for swimming access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="swimming-adult">Adult Swimming Fee</Label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    id="swimming-adult"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedPricing.swimming.adult}
                    onChange={(e) => handlePriceChange('swimming', 'adult', e.target.value)}
                    className="pl-7"
                  />
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  ₱{Number(editedPricing.swimming.adult).toFixed(2)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="swimming-kids">Kids/Senior/PWD Swimming Fee</Label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    id="swimming-kids"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedPricing.swimming.kids_senior_pwd}
                    onChange={(e) => handlePriceChange('swimming', 'kids_senior_pwd', e.target.value)}
                    className="pl-7"
                  />
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  ₱{Number(editedPricing.swimming.kids_senior_pwd).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Private Event Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Private Event Rates
          </CardTitle>
          <CardDescription>Reserve the entire resort for private events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-whole-day">Whole Day (9 AM - 5 PM)</Label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    id="event-whole-day"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedPricing.event.whole_day}
                    onChange={(e) => handlePriceChange('event', 'whole_day', e.target.value)}
                    className="pl-7"
                  />
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  ₱{Number(editedPricing.event.whole_day).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-evening">Evening (5:30 PM - 10 PM)</Label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    id="event-evening"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedPricing.event.evening}
                    onChange={(e) => handlePriceChange('event', 'evening', e.target.value)}
                    className="pl-7"
                  />
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  ₱{Number(editedPricing.event.evening).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-morning">Morning (9 AM - 5 PM)</Label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input
                    id="event-morning"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedPricing.event.morning}
                    onChange={(e) => handlePriceChange('event', 'morning', e.target.value)}
                    className="pl-7"
                  />
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  ₱{Number(editedPricing.event.morning).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Night Swimming */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            Night Swimming
          </CardTitle>
          <CardDescription>Per head rate for night swimming (includes free entrance and swimming)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="night-swimming">Night Swimming (Per Head)</Label>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                <Input
                  id="night-swimming"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedPricing.night_swimming.per_head}
                  onChange={(e) => handlePriceChange('night_swimming', 'per_head', e.target.value)}
                  className="pl-7"
                />
              </div>
            ) : (
              <div className="text-2xl font-bold text-primary">
                ₱{Number(editedPricing.night_swimming.per_head).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">per person</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
