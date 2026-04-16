"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail, RefreshCw, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.push("/signup");
      return;
    }
  }, [email, router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (index === 5 && value) {
      const fullCode = [...newCode.slice(0, 5), value].join("");
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split("");
    while (newCode.length < 6) newCode.push("");
    setCode(newCode);

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join("");
    
    if (codeToVerify.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/verification/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeToVerify }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast({
          title: "Email Verified! ✓",
          description: "Your email has been successfully verified",
        });
        // Redirect to login after a brief success message
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 2000);
      } else {
        setError(data.message || "Invalid or expired verification code");
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid or expired verification code",
          variant: "destructive",
        });
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Failed to verify code. Please try again.");
      toast({
        title: "Verification Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/verification/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTimeLeft(900); // Reset timer to 15 minutes
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        toast({
          title: "Code Resent ✓",
          description: "A new verification code has been sent to your email",
        });
      } else {
        setError(data.message || "Failed to resend code");
        toast({
          title: "Resend Failed",
          description: data.message || "Failed to resend code",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
      toast({
        title: "Resend Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 h-full">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Verify Your Email</h1>
            </div>
            <p className="text-muted-foreground">
              We've sent a 6-digit verification code to{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          {success ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-600">
                  Email Verified!
                </h3>
                <p className="text-muted-foreground">
                  Your email has been successfully verified. Redirecting to login...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Enter Verification Code
                </Label>
                <div className="flex gap-2 justify-center">
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-12 h-14 text-center text-xl font-bold"
                      disabled={isVerifying}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {timeLeft > 0 ? (
                    <>
                      Code expires in: <strong className="text-foreground">{formatTime(timeLeft)}</strong>
                    </>
                  ) : (
                    <span className="text-destructive font-semibold">Code expired</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={isResending || timeLeft > 840} // Can resend after 1 minute
                  className="gap-2"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resend
                </Button>
              </div>

              <Button
                onClick={() => handleVerify()}
                disabled={isVerifying || code.join("").length !== 6}
                className="w-full gap-2"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={isResending || timeLeft > 840}
                  className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Send again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden bg-muted lg:flex items-center justify-center relative flex-col text-center grid-pattern">
        <div className="space-y-4 max-w-md px-6">
          <Mail className="w-16 h-16 text-primary mx-auto" />
          <div className="text-4xl font-bold font-headline tracking-tight">
            Almost There!
          </div>
          <p className="mt-2 text-lg text-muted-foreground">
            Just one more step to complete your registration. Check your email for the verification code.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
