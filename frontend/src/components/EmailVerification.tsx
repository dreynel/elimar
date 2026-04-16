"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CheckCircle, Mail, RefreshCw, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface EmailVerificationProps {
  email: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export default function EmailVerification({
  email,
  name,
  isOpen,
  onClose,
  onVerified,
}: EmailVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, timeLeft]);

  useEffect(() => {
    if (isOpen) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

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
        // Close modal and redirect after a brief success message
        setTimeout(() => {
          setSuccess(false);
          onVerified();
        }, 1500);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="w-6 h-6 text-primary" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Email Verified!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your email has been successfully verified.
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div>
              <Label className="text-sm font-semibold mb-3 block">
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
                  <>Code expires in: <strong>{formatTime(timeLeft)}</strong></>
                ) : (
                  <span className="text-destructive">Code expired</span>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
