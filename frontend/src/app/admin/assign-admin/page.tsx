"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, CheckCircle, ShieldCheck, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AssignAdminPage() {
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete Admin states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/admin/list`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAdmins(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admins', error);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/admin/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Invitation Sent",
          description: "Verification code sent to the email.",
        });
        setStep('details');
      } else {
        toast({
          title: "Error",
          description: data.message || 'Failed to send invitation',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: 'Something went wrong. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: 'Passwords do not match',
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/admin/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email, 
          code, 
          name, 
          contact_number: contactNumber, 
          password 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Admin Assigned Successfully",
          description: `The new administrator account has been created for ${email}. They can now log in to the admin panel.`,
        });
        resetForm();
      } else {
        toast({
          title: "Error",
          description: data.message || 'Failed to create admin',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: 'Something went wrong. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    fetchAdmins();
    setShowDeleteModal(true);
  };

  const handleProceedToDelete = () => {
    if (!selectedAdminId) return;
    setShowDeleteModal(false);
    setShowConfirmDeleteModal(true);
    setDeleteConfirmationName('');
  };

  const handleConfirmDelete = async () => {
    const adminToDelete = admins.find(a => a.id.toString() === selectedAdminId);
    if (!adminToDelete) return;

    if (deleteConfirmationName !== adminToDelete.name) {
      toast({
        title: "Name Mismatch",
        description: "Please type the exact name to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/admin/${selectedAdminId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Admin Deleted",
          description: "The admin account has been permanently deleted.",
        });
        setShowConfirmDeleteModal(false);
        setSelectedAdminId('');
      } else {
        toast({
          title: "Deletion Failed",
          description: data.message || "Failed to delete admin.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setName('');
    setContactNumber('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assign New Admin</h1>
          <p className="text-muted-foreground mt-2">
            Invite a new administrator to the system. They will receive full access to the admin panel.
          </p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleDeleteClick}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Admin
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto border-t-4 border-t-primary shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>
              {step === 'email' ? 'Step 1: Invite Admin' : 'Step 2: Admin Details'}
            </CardTitle>
          </div>
          <CardDescription>
            {step === 'email' 
              ? 'Enter the details of the new administrator. A verification code will be sent to them.' 
              : 'Enter the verification code sent to the email and set up the admin profile.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleInviteSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="inviteName">Full Name</Label>
                <Input
                  id="inviteName"
                  placeholder="Admin"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@elimar.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium text-muted-foreground">Inviting:</p>
                <p className="text-lg font-semibold">{name} ({email})</p>
                <Button 
                  variant="link" 
                  className="px-0 h-auto text-xs text-primary mt-1" 
                  onClick={() => setStep('email')}
                  type="button"
                >
                  Change Details
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    placeholder="Enter 6-digit code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isLoading}
                    className="tracking-widest"
                    maxLength={6}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input
                      id="contact"
                      placeholder="09123456789"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 mt-6" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Admin...
                  </>
                ) : (
                  'Create Admin Account'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Delete Admin Selection Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Administrator
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select the administrator you want to remove from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="adminSelect" className="mb-2 block">Select Admin</Label>
            <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an admin..." />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id.toString()}>
                    {admin.name} ({admin.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleProceedToDelete}
              disabled={!selectedAdminId}
            >
              Proceed to Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Modal */}
      <AlertDialog open={showConfirmDeleteModal} onOpenChange={setShowConfirmDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              To confirm deletion, please type the name of the admin: 
              <span className="font-bold text-foreground block mt-1">
                {admins.find(a => a.id.toString() === selectedAdminId)?.name}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Type admin name here"
              value={deleteConfirmationName}
              onChange={(e) => setDeleteConfirmationName(e.target.value)}
              className="border-destructive/50 focus-visible:ring-destructive"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting || deleteConfirmationName !== admins.find(a => a.id.toString() === selectedAdminId)?.name}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

