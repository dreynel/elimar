"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Loader2, Turtle, ArrowLeft } from 'lucide-react';
import { API_URL } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import LegalModal from '@/components/LegalModal';
import AuthCarousel from '@/components/AuthCarousel';

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    acceptTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setError('');
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Accept formats:
    // 09078845654 (11 digits starting with 0)
    // 639078845654 (12 digits starting with 63)
    // +639078845654 (with + prefix)
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      return true;
    }
    if (digitsOnly.length === 12 && digitsOnly.startsWith('63')) {
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(formData.contactNumber)) {
      setError('Please enter a valid Philippine phone number (e.g., 09078845654 or +639078845654)');
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Philippine phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // Register the user - this will create the user and send verification email
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: formData.email,
          contact_number: formData.contactNumber,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to register');
      }

      toast({
        title: "Registration Successful! ✓",
        description: "Please check your email to verify your account",
      });

      // Redirect to verification page
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(fullName)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
      toast({
        title: "Registration Failed",
        description: err.message || 'Failed to register. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 h-full bg-background">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2">
            <Link 
              href="/" 
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors w-fit mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link href="/" className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity w-fit">
              <Turtle className="h-6 w-6 text-primary" />
              <span className="font-semibold text-primary">Elimar Spring Garden Resort</span>
            </Link>
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="text-balance text-muted-foreground">
              Sign up to get started!
            </p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="First Name" 
                  required 
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Last Name" 
                  required 
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                type="tel"
                placeholder="+639123456789"
                required
                value={formData.contactNumber}
                onChange={handleInputChange}
                disabled={isLoading}
                maxLength={15}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Enter your 11-digit Philippine mobile number
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  placeholder="Create a password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-accent/40"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a19.87 19.87 0 014.127-6.02M6.6 6.6A9.956 9.956 0 0112 5c5 0 9.27 3.11 11 7.5a19.85 19.85 0 01-1.66 3.01M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Checkbox 
                id="acceptTerms" 
                required 
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                }
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="acceptTerms"
                  className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setIsLegalModalOpen(true)}
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                    disabled={isLoading}
                  >
                    Terms & Conditions and Privacy Policy
                  </button>
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Login
            </Link>
          </div>
        </div>

        {/* Legal Modal */}
        <LegalModal 
          isOpen={isLegalModalOpen} 
          onClose={() => setIsLegalModalOpen(false)} 
        />
      </div>
      <div className="hidden lg:block h-full w-full p-4">
        <div className="h-full w-full rounded-[32px] overflow-hidden">
            <AuthCarousel />
        </div>
      </div>
    </div>
  );
}
