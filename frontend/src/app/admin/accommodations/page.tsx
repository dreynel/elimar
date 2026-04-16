"use client"

import React, {useState, useRef, useEffect} from "react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import Accommodation3D from "../../../components/Accommodation3D"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../../components/ui/carousel";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Home,
  Users,
  Edit,
  Save,
  Plus,
  Upload,
  Image as ImageIcon,
  Scan,
  CheckCircle,
  MousePointer,
  MousePointerClick,
  Maximize,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Sun,
  Moon,
  Calendar,
} from "lucide-react";
import { API_URL } from '@/lib/utils';

interface Accommodation {
  id: number;
  name: string;
  type: string;
  description: string;
  capacity: string;
  price: string;
  add_price?: string | null;
  image_url: string | null;
  panoramic_url?: string | null;
  inclusions?: string | null;
  supports_morning?: boolean;
  supports_night?: boolean;
  supports_whole_day?: boolean;
  created_at: string;
}

// Time slot configuration type
type TimeSlotType = 'morning' | 'night' | 'whole_day';

interface TimeSlotConfig {
  morning: { enabled: boolean; start: string; end: string };
  night_cottage: { enabled: boolean; start: string; end: string; is_overnight: boolean };
  night_room: { enabled: boolean; start: string; end: string; is_overnight: boolean };
  whole_day: { enabled: boolean; start: string; end: string; is_overnight: boolean };
}

export default function AdminRoomsPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selected, setSelected] = useState<Accommodation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedAddPrice, setEditedAddPrice] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedCapacity, setEditedCapacity] = useState("");
  const [editedInclusions, setEditedInclusions] = useState<string[]>([]);
  const [editedImageUrls, setEditedImageUrls] = useState<string[]>([]);
  const [newEditImages, setNewEditImages] = useState<File[]>([]);
  const [editPanoramicFile, setEditPanoramicFile] = useState<File | null>(null);
  const [removedImageIndices, setRemovedImageIndices] = useState<number[]>([]);
  const [replacePanoramic, setReplacePanoramic] = useState(false);
  const editMainImageInputRef = useRef<HTMLInputElement>(null);
  const editPanoramicImageInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("still");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccommodation, setNewAccommodation] = useState({
    type: "cottage",
    name: "",
    price: "",
    add_price: "",
    description: "",
    capacity: "",
    inclusions: "",
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImageFiles, setMainImageFiles] = useState<File[]>([]);
  const [panoramicImageFile, setPanoramicImageFile] = useState<File | null>(
    null
  );
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const panoramicImageInputRef = useRef<HTMLInputElement>(null)
  
  // Global time settings modal state
  const [showTimeSettingsModal, setShowTimeSettingsModal] = useState(false);
  const [globalTimeSettings, setGlobalTimeSettings] = useState<TimeSlotConfig>({
    morning: { enabled: true, start: '09:00', end: '17:00' },
    night_cottage: { enabled: true, start: '17:30', end: '22:00', is_overnight: false },
    night_room: { enabled: true, start: '17:30', end: '08:00', is_overnight: true },
    whole_day: { enabled: true, start: '09:00', end: '08:00', is_overnight: true },
  });
  const [savingTimeSettings, setSavingTimeSettings] = useState(false);
  const [loadingTimeSettings, setLoadingTimeSettings] = useState(true);

  // Fetch time settings from the database
  const fetchTimeSettings = async () => {
    try {
      setLoadingTimeSettings(true);
      const response = await fetch(`${API_URL}/api/time-settings`);
      const data = await response.json();
      
      if (response.ok && data.data) {
        setGlobalTimeSettings({
          morning: {
            enabled: data.data.morning?.enabled ?? true,
            start: data.data.morning?.start || '09:00',
            end: data.data.morning?.end || '17:00',
          },
          night_cottage: {
            enabled: data.data.night_cottage?.enabled ?? true,
            start: data.data.night_cottage?.start || '17:30',
            end: data.data.night_cottage?.end || '22:00',
            is_overnight: data.data.night_cottage?.is_overnight ?? false,
          },
          night_room: {
            enabled: data.data.night_room?.enabled ?? true,
            start: data.data.night_room?.start || '17:30',
            end: data.data.night_room?.end || '08:00',
            is_overnight: data.data.night_room?.is_overnight ?? true,
          },
          whole_day: {
            enabled: data.data.whole_day?.enabled ?? true,
            start: data.data.whole_day?.start || '09:00',
            end: data.data.whole_day?.end || '08:00',
            is_overnight: data.data.whole_day?.is_overnight ?? true,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching time settings:', error);
    } finally {
      setLoadingTimeSettings(false);
    }
  };

  useEffect(() => {
    fetchAccommodations();
    fetchTimeSettings();
  }, []);

  // Save global time settings to database
  const handleSaveTimeSettings = async () => {
    try {
      setSavingTimeSettings(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to continue.',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/time-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          morning: {
            start: globalTimeSettings.morning.start,
            end: globalTimeSettings.morning.end,
          },
          night_cottage: {
            start: globalTimeSettings.night_cottage.start,
            end: globalTimeSettings.night_cottage.end,
          },
          night_room: {
            start: globalTimeSettings.night_room.start,
            end: globalTimeSettings.night_room.end,
          },
          whole_day: {
            start: globalTimeSettings.whole_day.start,
            end: globalTimeSettings.whole_day.end,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save time settings');
      }
      
      toast({
        title: 'Success!',
        description: 'Time slot settings saved successfully!',
      });
      setShowTimeSettingsModal(false);
    } catch (error) {
      console.error('Error saving time settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save time settings',
        variant: 'destructive'
      });
    } finally {
      setSavingTimeSettings(false);
    }
  };

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/accommodations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accommodations');
      }

      const data = await response.json();
      setAccommodations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accommodations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (isEditing && selected) {
      try {
        // Create FormData for update
        const formData = new FormData();
        formData.append('name', editedName);
        formData.append('price', editedPrice);
        formData.append('description', editedDescription);
        formData.append('capacity', editedCapacity);
        
        // Only add inclusions and add_price for rooms
        if (selected.type === 'room') {
          formData.append('inclusions', editedInclusions.join('\n'));
          if (editedAddPrice) {
            formData.append('add_price', editedAddPrice);
          }
        }

        // Add new images if any
        newEditImages.forEach((file) => {
          formData.append('mainImages', file);
        });

        // Add panoramic image if being replaced
        if (replacePanoramic && editPanoramicFile) {
          formData.append('panoramicImage', editPanoramicFile);
        }

        // Send indices of images to remove
        if (removedImageIndices.length > 0) {
          formData.append('removedImageIndices', JSON.stringify(removedImageIndices));
        }

        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: 'Authentication Required',
            description: 'Please login to continue.',
            variant: 'destructive'
          });
          return;
        }

        const response = await fetch(`${API_URL}/api/accommodations/${selected.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update accommodation');
        }

        toast({
          title: 'Success!',
          description: 'Accommodation updated successfully!',
        });
        
        // Refresh accommodations list
        await fetchAccommodations();
        
        // Close the modal
        handleDialogClose();
      } catch (error) {
        console.error('Error updating accommodation:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update accommodation',
          variant: 'destructive'
        });
      }
    } else if (selected) {
      // Enter edit mode
      setEditedName(selected.name);
      setEditedPrice(selected.price);
      setEditedAddPrice(selected.add_price || "");
      setEditedDescription(selected.description);
      setEditedCapacity(selected.capacity);
      setEditedInclusions(selected.inclusions ? selected.inclusions.split('\n') : []);
      
      // Parse existing images
      try {
        if (selected.image_url) {
          const parsedImages = JSON.parse(selected.image_url);
          if (Array.isArray(parsedImages)) {
            setEditedImageUrls(parsedImages);
          } else {
            setEditedImageUrls([selected.image_url]);
          }
        } else {
          setEditedImageUrls([]);
        }
      } catch {
        setEditedImageUrls(selected.image_url ? [selected.image_url] : []);
      }
      
      setIsEditing(true);
    }
  };

  const handleDialogClose = () => {
    setIsEditing(false);
    setSelected(null);
    setActiveTab("still");
    setEditedName("");
    setEditedPrice("");
    setEditedAddPrice("");
    setEditedDescription("");
    setEditedCapacity("");
    setEditedInclusions([]);
    setEditedImageUrls([]);
    setNewEditImages([]);
    setEditPanoramicFile(null);
    setRemovedImageIndices([]);
    setReplacePanoramic(false);
  };

  const handleRemoveImage = (index: number) => {
    setRemovedImageIndices([...removedImageIndices, index]);
  };

  const handleAddEditImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setNewEditImages([...newEditImages, ...fileArray]);
    }
  };

  const handleRemoveNewEditImage = (index: number) => {
    setNewEditImages(newEditImages.filter((_, i) => i !== index));
  };

  const handleDeleteAccommodation = async () => {
    if (!selected) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${selected.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to continue.',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/accommodations/${selected.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete accommodation');
      }

      toast({
        title: 'Deleted!',
        description: 'Accommodation deleted successfully!',
      });
      setSelected(null);
      setIsEditing(false);
      
      // Refresh accommodations list
      await fetchAccommodations();
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete accommodation',
        variant: 'destructive'
      });
    }
  };

  const handleAddAccommodation = async () => {
    try {
      // Validate required fields
      if (!newAccommodation.name || !newAccommodation.type || !newAccommodation.capacity || !newAccommodation.price) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      if (mainImageFiles.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please upload at least one main image',
          variant: 'destructive'
        });
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('name', newAccommodation.name);
      formData.append('type', newAccommodation.type);
      formData.append('capacity', newAccommodation.capacity);
      formData.append('price', newAccommodation.price);
      
      // Add whole day price for rooms
      if (newAccommodation.type === 'room' && newAccommodation.add_price) {
        formData.append('add_price', newAccommodation.add_price);
      }
      
      if (newAccommodation.description) {
        formData.append('description', newAccommodation.description);
      }
      
      // Only add inclusions for rooms
      if (newAccommodation.type === 'room' && newAccommodation.inclusions) {
        formData.append('inclusions', newAccommodation.inclusions);
      }

      // Append all main images
      mainImageFiles.forEach((file) => {
        formData.append('mainImages', file);
      });

      // Append panoramic image if exists
      if (panoramicImageFile) {
        formData.append('panoramicImage', panoramicImageFile);
      }

      // Get token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to continue.',
          variant: 'destructive'
        });
        return;
      }

      // Send request
      const response = await fetch(`${API_URL}/api/accommodations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add accommodation');
      }

      // Success!
      toast({
        title: 'Success!',
        description: 'Accommodation added successfully!',
      });
      setShowAddModal(false);
      
      // Reset form
      setNewAccommodation({
        type: "cottage",
        name: "",
        price: "",
        add_price: "",
        description: "",
        capacity: "",
        inclusions: "",
      });
      setMainImageFiles([]);
      setPanoramicImageFile(null);

      // Refresh accommodations list
      await fetchAccommodations();
    } catch (error) {
      console.error('Error adding accommodation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add accommodation',
        variant: 'destructive'
      });
    }
  };

  const handleMainImageClick = () => {
    mainImageInputRef.current?.click();
  };

  const handlePanoramicImageClick = () => {
    panoramicImageInputRef.current?.click();
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to Array
      const fileArray = Array.from(files);
      setMainImageFiles(fileArray);
    }
  };

  const handlePanoramicImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setPanoramicImageFile(file);
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
        <Button onClick={fetchAccommodations}>Try Again</Button>
      </div>
    );
  }

  // Note: Panoramic view is now handled by the Accommodation3D component
  // This useEffect is no longer needed as we're using the component in the TabsContent

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Accommodations Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage cottages and rooms, edit details, and view panoramic tours
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTimeSettingsModal(true)} variant="outline" className="gap-2">
            <Clock className="w-4 h-4" />
            Time Settings
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Accommodation
          </Button>
        </div>
      </div>

      {accommodations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-lg">
          <Home className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Accommodations Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start by adding your first cottage or room to the resort. Click the button above to get started.
          </p>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Accommodation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accommodations.map((accommodation) => {
            // Handle multiple images stored as JSON array or single image string
            let imageUrl = '/placeholder-room.svg';
            try {
              if (accommodation.image_url) {
                // Try to parse as JSON array
                const parsedImages = JSON.parse(accommodation.image_url);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  imageUrl = parsedImages[0].startsWith('http') 
                    ? parsedImages[0] 
                    : `${API_URL}${parsedImages[0]}`;
                } else {
                  throw new Error('Not an array');
                }
              }
            } catch {
              // If not JSON, treat as single image path
              if (accommodation.image_url) {
                imageUrl = accommodation.image_url.startsWith('http') 
                  ? accommodation.image_url 
                  : `${API_URL}${accommodation.image_url}`;
              }
            }
            
            return (
              <div key={accommodation.id} className="group relative">
                <button
                  onClick={() => setSelected(accommodation)}
                  className="w-full rounded-lg overflow-hidden shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-card border-2 border-border hover:border-primary"
                  aria-label={`Open ${accommodation.name}`}
                >
                  <div className="w-full bg-muted relative aspect-[4/3]">
                    <Image
                      src={imageUrl || '/placeholder-room.svg'}
                      alt={accommodation.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
                      className="hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-room.svg';
                      }}
                    />

                  </div>
                  <div className="p-4 bg-card">
                    <div className="font-semibold text-base mb-1 line-clamp-1">
                      {accommodation.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-primary font-bold">
                        ₱{accommodation.price}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {accommodation.capacity}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* View/Edit Accommodation Dialog */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && handleDialogClose()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selected && (() => {
            // Handle multiple images stored as JSON array or single image string
            let imageUrls: string[] = [];
            try {
              if (selected.image_url) {
                // Try to parse as JSON array
                const parsedImages = JSON.parse(selected.image_url);
                if (Array.isArray(parsedImages)) {
                  imageUrls = parsedImages.map(img => 
                    img.startsWith('http') ? img : `${API_URL}${img}`
                  );
                } else {
                  throw new Error('Not an array');
                }
              }
            } catch {
              // If not JSON, treat as single image path
              if (selected.image_url) {
                const singleUrl = selected.image_url.startsWith('http') 
                  ? selected.image_url 
                  : `${API_URL}${selected.image_url}`;
                imageUrls = [singleUrl];
              }
            }

            const panoramicUrl = selected.panoramic_url?.startsWith('http')
              ? selected.panoramic_url
              : selected.panoramic_url ? `${API_URL}${selected.panoramic_url}` : undefined;

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Home className="w-5 h-5 text-primary" />
                    {selected.name}
                  </DialogTitle>
                  <DialogDescription>
                    {selected.type === "room" ? "Room" : "Cottage"} Details and
                    Management
                  </DialogDescription>
                </DialogHeader>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                className="mt-4"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="still" className="gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Details & Images
                  </TabsTrigger>
                  <TabsTrigger value="panoramic" className="gap-2">
                    <Scan className="w-4 h-4" />
                    360° View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="still" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side - Details */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Name
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="w-full mt-1"
                            placeholder="Enter accommodation name..."
                          />
                        ) : (
                          <div className="text-lg font-bold mt-1">
                            {selected.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Description
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={editedDescription}
                            onChange={(e) =>
                              setEditedDescription(e.target.value)
                            }
                            className="w-full min-h-[100px] resize-none mt-1"
                            placeholder="Enter description..."
                          />
                        ) : (
                          <div className="text-sm leading-relaxed mt-1">
                            {selected.description}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground">
                            Capacity
                          </Label>
                          {isEditing ? (
                            <Input
                              value={editedCapacity}
                              onChange={(e) => setEditedCapacity(e.target.value)}
                              className="w-full mt-1"
                              placeholder="e.g., 5-10 persons"
                            />
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {selected.capacity}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground">
                            {selected.type === 'room' ? 'Day/Morning Price' : 'Price'}
                          </Label>
                          {isEditing ? (
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                ₱
                              </span>
                              <Input
                                value={editedPrice}
                                onChange={(e) => setEditedPrice(e.target.value)}
                                className="w-full pl-7"
                                placeholder="Enter price..."
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-base font-bold text-primary">
                                ₱{selected.price}
                              </span>
                            </div>
                          )}
                        </div>

                        {selected.type === 'room' && (
                          <div>
                            <Label className="text-sm font-semibold text-muted-foreground">
                              Night & Whole Day Price
                            </Label>
                            {isEditing ? (
                              <div>
                                <div className="relative mt-1">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                    ₱
                                  </span>
                                  <Input
                                    value={editedAddPrice}
                                    onChange={(e) => setEditedAddPrice(e.target.value)}
                                    className="w-full pl-7"
                                    placeholder="Enter night & whole day price..."
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">This price applies to both Night and Whole Day slots</p>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-base font-bold text-primary">
                                    ₱{selected.add_price || 'Not set'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Applies to both Night and Whole Day</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {selected.type === 'room' && selected.inclusions && (
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground mb-2">
                            Inclusions
                          </Label>
                          {isEditing ? (
                            <Textarea
                              value={editedInclusions.join('\n')}
                              onChange={(e) => setEditedInclusions(e.target.value.split('\n'))}
                              className="w-full min-h-[120px] resize-none mt-2"
                              placeholder="Enter inclusions, one per line&#10;e.g.,&#10;Pool access&#10;Tables and chairs"
                            />
                          ) : (
                            <ul className="space-y-1.5 mt-2">
                              {selected.inclusions.split('\n').filter(i => i.trim()).map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start text-sm"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 text-primary mt-0.5 shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      <Button onClick={handleEdit} className="w-full gap-2">
                        {isEditing ? (
                          <>
                            <Save className="w-4 h-4" /> Save Changes
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4" /> Edit Details
                          </>
                        )}
                      </Button>

                      {!isEditing && (
                        <Button 
                          onClick={handleDeleteAccommodation} 
                          variant="destructive" 
                          className="w-full gap-2"
                        >
                          <X className="w-4 h-4" /> Delete Accommodation
                        </Button>
                      )}
                    </div>

                    {/* Right side - Images */}
                    <div className="space-y-3">
                      {isEditing ? (
                        // Edit mode - show image management
                        <div className="space-y-4">
                          <Label className="text-sm font-semibold">Manage Images</Label>
                          
                          {/* Existing Images */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Current Images:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {editedImageUrls.map((url, idx) => (
                                !removedImageIndices.includes(idx) && (
                                  <div key={idx} className="relative group">
                                    <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden border-2">
                                      <Image
                                        src={url.startsWith('http') ? url : `${API_URL}${url}`}
                                        alt={`Image ${idx + 1}`}
                                        fill
                                        sizes="200px"
                                        style={{ objectFit: "cover" }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder-room.svg';
                                        }}
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleRemoveImage(idx)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>

                          {/* New Images to Add */}
                          {newEditImages.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">New Images to Add:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {newEditImages.map((file, idx) => (
                                  <div key={idx} className="relative group">
                                    <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden border-2 border-primary">
                                      <Image
                                        src={URL.createObjectURL(file)}
                                        alt={`New ${idx + 1}`}
                                        fill
                                        sizes="200px"
                                        style={{ objectFit: "cover" }}
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleRemoveNewEditImage(idx)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add Images Button */}
                          <input
                            type="file"
                            ref={editMainImageInputRef}
                            onChange={handleAddEditImages}
                            accept="image/*"
                            multiple
                            className="hidden"
                            aria-label="Add more images"
                          />
                          <Button
                            variant="outline"
                            onClick={() => editMainImageInputRef.current?.click()}
                            className="w-full gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Add More Images
                          </Button>
                        </div>
                      ) : (
                        // View mode - show carousel/images
                        <>
                          {imageUrls.length > 0 ? (
                            <>
                              {imageUrls.length === 1 ? (
                                // Single image display
                                <div className="w-full rounded-lg overflow-hidden shadow-lg bg-muted border-2">
                                  <div className="relative w-full aspect-[4/3]">
                                    <Image
                                      src={imageUrls[0] || '/placeholder-room.svg'}
                                      alt={selected.name}
                                      fill
                                      sizes="(max-width: 768px) 100vw, 50vw"
                                      style={{ objectFit: "cover" }}
                                      priority
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-room.svg';
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                // Multiple images carousel
                                <Carousel className="w-full">
                                  <CarouselContent>
                                    {imageUrls.map((url, idx) => (
                                      <CarouselItem key={idx}>
                                        <div className="w-full rounded-lg overflow-hidden shadow-lg bg-muted border-2">
                                          <div className="relative w-full aspect-[4/3]">
                                            <Image
                                              src={url}
                                              alt={`${selected.name} - ${idx + 1}`}
                                              fill
                                              sizes="(max-width: 768px) 100vw, 50vw"
                                              style={{ objectFit: "cover" }}
                                              priority={idx === 0}
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-room.svg';
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </CarouselItem>
                                    ))}
                                  </CarouselContent>
                                  <CarouselPrevious className="left-2" />
                                  <CarouselNext className="right-2" />
                                </Carousel>
                              )}
                            </>
                          ) : (
                            <div className="w-full rounded-lg overflow-hidden shadow-lg bg-muted border-2">
                              <div className="relative w-full aspect-[4/3]">
                                <Image
                                  src="/placeholder-room.svg"
                                  alt={selected.name}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  style={{ objectFit: "cover" }}
                                  priority
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>
                              {imageUrls.length > 1 
                                ? `${imageUrls.length} images` 
                                : 'Main display image'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="panoramic" className="mt-4">
                  {isEditing ? (
                    // Edit mode - panoramic image replacement
                    <div className="space-y-4">
                      <Label className="text-sm font-semibold">360° Panoramic Image</Label>
                      
                      {selected.panoramic_url && !replacePanoramic ? (
                        <div className="space-y-3">
                          <div className="w-full rounded-lg overflow-hidden shadow-2xl border-2 border-primary/20">
                            <Accommodation3D
                              imageUrl={panoramicUrl || ''}
                              height="400px"
                              autoPlay={false}
                              visible={activeTab === "panoramic"}
                              className="rounded-lg"
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setReplacePanoramic(true)}
                            className="w-full gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Replace Panoramic Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editPanoramicFile && (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary">
                              <Image
                                src={URL.createObjectURL(editPanoramicFile)}
                                alt="New panoramic"
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          )}
                          
                          <input
                            type="file"
                            ref={editPanoramicImageInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditPanoramicFile(file);
                                setReplacePanoramic(true);
                              }
                            }}
                            accept="image/*"
                            className="hidden"
                            aria-label="Upload panoramic image"
                          />
                          
                          <Button
                            variant="outline"
                            onClick={() => editPanoramicImageInputRef.current?.click()}
                            className="w-full gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {editPanoramicFile ? 'Change' : 'Upload'} Panoramic Image
                          </Button>
                          
                          {replacePanoramic && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setReplacePanoramic(false);
                                setEditPanoramicFile(null);
                              }}
                              className="w-full"
                            >
                              Cancel Replacement
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // View mode
                    <>
                      {panoramicUrl ? (
                        <div className="space-y-3">
                          <div className="w-full rounded-lg overflow-hidden shadow-2xl border-2 border-primary/20">
                            <Accommodation3D
                              imageUrl={panoramicUrl}
                              height="500px"
                              autoPlay={false}
                              visible={activeTab === "panoramic"}
                              className="rounded-lg"
                            />
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 border">
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <MousePointer className="w-4 h-4 text-primary" />
                              Interactive Controls
                            </p>
                            <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <MousePointerClick className="w-3.5 h-3.5" />
                                <span>Drag to rotate</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Maximize className="w-3.5 h-3.5" />
                                <span>Scroll to zoom</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Scan className="w-3.5 h-3.5" />
                                <span>360° panorama</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full rounded-lg bg-muted p-12 text-center border-2 border-dashed">
                          <Scan className="w-16 h-16 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-lg font-semibold text-muted-foreground">
                            No panoramic view available
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Upload a 360° image to enable this feature
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Accommodation Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-5 h-5 text-primary" />
              Add New Accommodation
            </DialogTitle>
            <DialogDescription>
              Fill in the details to add a new cottage or room to your resort
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="type" className="text-sm font-semibold">
                Type
              </Label>
              <Select
                value={newAccommodation.type}
                onValueChange={(value) =>
                  setNewAccommodation({ ...newAccommodation, type: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cottage">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Cottage
                    </div>
                  </SelectItem>
                  <SelectItem value="room">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Room
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name" className="text-sm font-semibold">
                Name
              </Label>
              <Input
                id="name"
                value={newAccommodation.name}
                onChange={(e) =>
                  setNewAccommodation({
                    ...newAccommodation,
                    name: e.target.value,
                  })
                }
                placeholder="e.g., Garden Villa, Lakeside Cottage"
                className="mt-1"
              />
            </div>

            <div className={`grid gap-4 ${newAccommodation.type === 'room' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div>
                <Label htmlFor="price" className="text-sm font-semibold">
                  {newAccommodation.type === 'room' ? 'Day/Morning Price' : 'Price'}
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    ₱
                  </span>
                  <Input
                    id="price"
                    value={newAccommodation.price}
                    onChange={(e) =>
                      setNewAccommodation({
                        ...newAccommodation,
                        price: e.target.value,
                      })
                    }
                    placeholder="2500"
                    className="pl-7"
                  />
                </div>
              </div>

              {newAccommodation.type === 'room' && (
                <div>
                  <Label htmlFor="add_price" className="text-sm font-semibold">
                    Night & Whole Day Price
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ₱
                    </span>
                    <Input
                      id="add_price"
                      value={newAccommodation.add_price}
                      onChange={(e) =>
                        setNewAccommodation({
                          ...newAccommodation,
                          add_price: e.target.value,
                        })
                      }
                      placeholder="4000"
                      className="pl-7"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="capacity" className="text-sm font-semibold">
                  Capacity
                </Label>
                <div className="relative mt-1">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="capacity"
                    value={newAccommodation.capacity}
                    onChange={(e) =>
                      setNewAccommodation({
                        ...newAccommodation,
                        capacity: e.target.value,
                      })
                    }
                    placeholder="5-10 persons"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                value={newAccommodation.description}
                onChange={(e) =>
                  setNewAccommodation({
                    ...newAccommodation,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the accommodation features and amenities..."
                className="min-h-[100px] resize-none mt-1"
              />
            </div>

            {newAccommodation.type === 'room' && (
              <div>
                <Label htmlFor="inclusions" className="text-sm font-semibold">
                  Inclusions
                </Label>
                <Textarea
                  id="inclusions"
                  value={newAccommodation.inclusions}
                  onChange={(e) =>
                    setNewAccommodation({
                      ...newAccommodation,
                      inclusions: e.target.value,
                    })
                  }
                  placeholder="Enter inclusions, one per line&#10;e.g.,&#10;Pool access&#10;Tables and chairs&#10;Shaded area"
                  className="min-h-[100px] resize-none mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter each inclusion on a new line
                </p>
              </div>
            )}

            <div className="space-y-3">
            <div>
                <Label className="text-sm font-semibold">Main Images (Multiple)</Label>
                <input
                type="file"
                ref={mainImageInputRef}
                onChange={handleMainImageChange}
                accept="image/*"
                multiple
                className="hidden"
                aria-label="Upload main images"
                />
                <div
                onClick={handleMainImageClick}
                className="mt-1 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {mainImageFiles.length > 0 ? (
                    <>
                    <p className="text-sm text-primary font-medium">
                        {mainImageFiles.length} image{mainImageFiles.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {mainImageFiles.map((file, idx) => (
                        <div key={idx}>{file.name}</div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Click to change images
                    </p>
                    </>
                ) : (
                    <>
                    <p className="text-sm text-muted-foreground">
                        Click to upload main images (multiple)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 4:3 aspect ratio
                    </p>
                    </>
                )}
                </div>
            </div>

            <div>
                <Label className="text-sm font-semibold">
                Panoramic Image (360°)
                </Label>
                <input
                type="file"
                ref={panoramicImageInputRef}
                onChange={handlePanoramicImageChange}
                accept="image/*"
                className="hidden"
                aria-label="Upload panoramic image"
            />
            <div
                onClick={handlePanoramicImageClick}
                className="mt-1 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                >
                  <Scan className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  {panoramicImageFile ? (
                    <>
                      <p className="text-sm text-primary font-medium">
                        {panoramicImageFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to change image
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Click to upload panoramic image
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: 360° panoramic photo
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowAddModal(false)}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleAddAccommodation} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Accommodation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Time Settings Modal */}
      <Dialog open={showTimeSettingsModal} onOpenChange={setShowTimeSettingsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Global Time Slot Settings
            </DialogTitle>
            <DialogDescription>
              Configure the time ranges for Morning, Night, and Whole Day bookings. These settings are stored in the database and apply globally.
            </DialogDescription>
          </DialogHeader>

          {loadingTimeSettings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Morning Slot */}
              <div className="p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                    <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Morning Slot</h4>
                    <p className="text-sm text-muted-foreground">
                      Day-time booking (applies to both cottages and rooms)
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="morning-start" className="text-sm font-semibold">Start Time</Label>
                    <Input
                      id="morning-start"
                      type="time"
                      value={globalTimeSettings.morning.start}
                      onChange={(e) => setGlobalTimeSettings(prev => ({
                        ...prev,
                        morning: { ...prev.morning, start: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="morning-end" className="text-sm font-semibold">End Time</Label>
                    <Input
                      id="morning-end"
                      type="time"
                      value={globalTimeSettings.morning.end}
                      onChange={(e) => setGlobalTimeSettings(prev => ({
                        ...prev,
                        morning: { ...prev.morning, end: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Current: {globalTimeSettings.morning.start} - {globalTimeSettings.morning.end}
                </p>
              </div>

              {/* Night Slot - Cottage */}
              <div className="p-4 border rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Night Slot (Cottages)</h4>
                    <p className="text-sm text-muted-foreground">
                      Evening booking for cottages - same day only
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="night-cottage-start" className="text-sm font-semibold">Start Time</Label>
                    <Input
                      id="night-cottage-start"
                      type="time"
                      value={globalTimeSettings.night_cottage.start}
                      onChange={(e) => setGlobalTimeSettings(prev => ({
                        ...prev,
                        night_cottage: { ...prev.night_cottage, start: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="night-cottage-end" className="text-sm font-semibold">End Time (Same Day)</Label>
                    <Input
                      id="night-cottage-end"
                      type="time"
                      value={globalTimeSettings.night_cottage.end}
                      onChange={(e) => setGlobalTimeSettings(prev => ({
                        ...prev,
                        night_cottage: { ...prev.night_cottage, end: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Current: {globalTimeSettings.night_cottage.start} - {globalTimeSettings.night_cottage.end} (same day)
                </p>
              </div>

              {/* Night Slot - Room */}
              <div className="p-4 border rounded-lg bg-violet-50/50 dark:bg-violet-950/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900">
                    <Moon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Night Slot (Rooms)</h4>
                    <p className="text-sm text-muted-foreground">
                      Overnight booking for rooms - ends next day
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="night-room-start" className="text-sm font-semibold">Start Time</Label>
                    <Input
                      id="night-room-start"
                      type="time"
                      value={globalTimeSettings.night_room.start}
                      onChange={(e) => setGlobalTimeSettings(prev => ({
                        ...prev,
                        night_room: { ...prev.night_room, start: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="night-room-end" className="text-sm font-semibold">End Time (Next Day)</Label>
                    <Input
                      id="night-room-end"
                      type="time"
                      value={globalTimeSettings.night_room.end}
                      onChange={(e) => setGlobalTimeSettings(prev => ({
                        ...prev,
                        night_room: { ...prev.night_room, end: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Current: {globalTimeSettings.night_room.start} - {globalTimeSettings.night_room.end} (overnight)
                </p>
              </div>

              {/* Whole Day Slot */}
              <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Whole Day Slot (Rooms Only)</h4>
                    <p className="text-sm text-muted-foreground">
                      24-hour booking with overnight stay
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wholeday-start" className="text-sm font-semibold">Start Time</Label>
                    <Input
                      id="wholeday-start"
                      type="time"
                      value={globalTimeSettings.whole_day.start}
                      onChange={(e) => setGlobalTimeSettings(prev => ({
                        ...prev,
                        whole_day: { ...prev.whole_day, start: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wholeday-end" className="text-sm font-semibold">End Time (Next Day)</Label>
                    <Input
                      id="wholeday-end"
                      type="time"
                      value={globalTimeSettings.whole_day.end}
                      onChange={(e) => setGlobalTimeSettings(prev => ({
                        ...prev,
                        whole_day: { ...prev.whole_day, end: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Current: {globalTimeSettings.whole_day.start} - {globalTimeSettings.whole_day.end} (overnight)
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2">Important Notes:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>Cottages:</strong> Can only be booked for Morning or Night slots (not Whole Day)</li>
                  <li>• <strong>Rooms:</strong> Support all three time slots with overnight capabilities</li>
                  <li>• <strong>Blocking Rules:</strong> Whole Day bookings block Morning and Night. Morning bookings block Whole Day (but not Night), and vice versa.</li>
                  <li>• These settings are stored in the database and apply to all bookings</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTimeSettingsModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTimeSettings}
              disabled={savingTimeSettings || loadingTimeSettings}
              className="gap-2"
            >
              {savingTimeSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
