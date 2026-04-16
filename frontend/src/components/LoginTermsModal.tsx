"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export function LoginTermsModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm text-muted-foreground hover:text-primary underline transition-colors">
          Terms and Conditions
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Terms and Conditions for Login
          </DialogTitle>
          <DialogDescription>
            Elimar Spring Garden Resort – Web-Based System
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(85vh-240px)] pr-4 mt-4">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Login Terms and Conditions
              </h2>
              <p className="text-base mb-4">
                By logging in, you agree to the following Terms and Conditions:
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">1. Authorized Users Only</h3>
                <p className="text-sm leading-relaxed">
                  This login system is intended only for registered users of Elimar Spring Garden Resort. Unauthorized access is strictly prohibited.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">2. Accuracy of Information</h3>
                <p className="text-sm leading-relaxed">
                  You agree to provide true and accurate login information. Any attempt to use false, incomplete, or unauthorized credentials is not allowed.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">3. Account Responsibility</h3>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                  <li>
                    You are responsible for maintaining the confidentiality of your username, password, and any verification codes (such as OTP).
                  </li>
                  <li>
                    Any actions performed under your account will be considered your responsibility.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">4. Verification Process</h3>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                  <li>
                    You acknowledge that during login, you may be required to submit your contact number, but the verification code (OTP) will be sent to your registered email address.
                  </li>
                  <li>
                    You are responsible for ensuring that your email is active and accessible.
                  </li>
                  <li>
                    Sharing or exposing your OTP to others is strictly prohibited.
                  </li>
                  <li>
                    Failed or repeated incorrect OTP attempts may temporarily block your access for security purposes.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">5. Security and Misuse</h3>
                <p className="text-sm leading-relaxed mb-2">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                  <li>Attempt to hack, disrupt, or bypass security features</li>
                  <li>Share your login credentials with others</li>
                  <li>Use automated scripts or tools to access the system</li>
                </ul>
                <p className="text-sm leading-relaxed mt-2">
                  Violations may result in account suspension or legal action.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">6. System Monitoring</h3>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                  <li>
                    All login activities may be monitored by the resort for security purposes.
                  </li>
                  <li>
                    Suspicious or unauthorized activities may be blocked or investigated.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">7. Data Protection</h3>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                  <li>
                    Your personal information is collected only for login, verification, and system access.
                  </li>
                  <li>
                    The resort will not share your data without consent unless required by law.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">8. Disclaimer of Liability</h3>
                <p className="text-sm leading-relaxed mb-2">The resort is not liable for:</p>
                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                  <li>Service interruptions</li>
                  <li>Incorrect login attempts</li>
                  <li>Damages caused by user negligence or misuse</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">9. Updates to Terms</h3>
                <p className="text-sm leading-relaxed">
                  Elimar Spring Garden Resort may update these login terms at any time. Continued use of the system signifies your acceptance of any changes.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
