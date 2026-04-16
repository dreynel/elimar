"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { ScrollArea } from "./ui/scroll-area"
import { FileText, Shield } from "lucide-react"

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "terms" | "privacy"
}

export default function LegalModal({ isOpen, onClose, defaultTab = "terms" }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Legal Information
          </DialogTitle>
          <DialogDescription>
            Please read our Terms & Conditions and Privacy Policy
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="terms" className="text-base font-semibold">
              Terms and Conditions
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-base font-semibold">
              Privacy Policy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="mt-4">
            <ScrollArea className="h-[calc(85vh-240px)] pr-4">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Elimar Spring Garden Resort – Web-Based System
                  </h2>
                  <p className="text-base mb-4">
                    By signing up, you agree to the following Terms and Conditions:
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">1. Authorized Users Only</h3>
                    <p className="text-sm leading-relaxed">
                      This login system is intended only for registered users of Elimar Spring Garden Resort. 
                      Unauthorized access is strictly prohibited.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">2. Accuracy of Information</h3>
                    <p className="text-sm leading-relaxed">
                      You agree to provide true and accurate login information. Any attempt to use false, 
                      incomplete, or unauthorized credentials is not allowed.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">3. Account Responsibility</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                      <li>
                        You are responsible for maintaining the confidentiality of your username, password, 
                        and any verification codes (such as OTP).
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
                        You acknowledge that during login, you may be required to submit your contact number, 
                        but the verification code (OTP) will be sent to your registered email address.
                      </li>
                      <li>
                        You are responsible for ensuring that your email is active and accessible.
                      </li>
                      <li>
                        Sharing or exposing your OTP to others is strictly prohibited.
                      </li>
                      <li>
                        Failed or repeated incorrect OTP attempts may temporarily block your access for 
                        security purposes.
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
                      Elimar Spring Garden Resort may update these login terms at any time. 
                      Continued use of the system signifies your acceptance of any changes.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="privacy" className="mt-4">
            <ScrollArea className="h-[calc(85vh-240px)] pr-4">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Privacy Policy
                  </h2>
                  <p className="text-base mb-4">
                    Elimar Spring Garden Resort is committed to protecting your privacy and personal information.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">1. Information We Collect</h3>
                    <p className="text-sm leading-relaxed mb-2">
                      We collect the following information when you register and use our system:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                      <li>Name (First and Last)</li>
                      <li>Email address</li>
                      <li>Contact number</li>
                      <li>Login credentials (username and encrypted password)</li>
                      <li>Verification codes (OTP) sent to your email</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">2. How We Use Your Information</h3>
                    <p className="text-sm leading-relaxed mb-2">
                      Your personal information is used for the following purposes:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                      <li>Account creation and authentication</li>
                      <li>Email verification and OTP delivery</li>
                      <li>Booking management and confirmation</li>
                      <li>Communication regarding your reservations</li>
                      <li>System security and monitoring</li>
                      <li>Improving our services</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">3. Data Security</h3>
                    <p className="text-sm leading-relaxed mb-2">
                      We implement industry-standard security measures to protect your data:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                      <li>Encrypted password storage</li>
                      <li>Secure communication protocols (HTTPS)</li>
                      <li>Regular security audits and monitoring</li>
                      <li>Limited access to personal information by authorized personnel only</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">4. Information Sharing</h3>
                    <p className="text-sm leading-relaxed mb-2">
                      We do not sell, trade, or share your personal information with third parties, except:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                      <li>When required by law or legal processes</li>
                      <li>To protect the rights and safety of Elimar Spring Garden Resort and its guests</li>
                      <li>With your explicit consent</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">5. Email Communications</h3>
                    <p className="text-sm leading-relaxed">
                      By registering, you consent to receiving emails from us, including:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                      <li>Account verification emails</li>
                      <li>OTP codes for login authentication</li>
                      <li>Booking confirmations and updates</li>
                      <li>Important system notifications</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">6. Data Retention</h3>
                    <p className="text-sm leading-relaxed">
                      We retain your personal information for as long as your account is active or as needed 
                      to provide services. You may request account deletion by contacting us directly.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">7. Your Rights</h3>
                    <p className="text-sm leading-relaxed mb-2">You have the right to:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                      <li>Access your personal information</li>
                      <li>Request corrections to inaccurate data</li>
                      <li>Request deletion of your account and data</li>
                      <li>Opt-out of non-essential communications</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">8. Cookies and Tracking</h3>
                    <p className="text-sm leading-relaxed">
                      Our system may use cookies and local storage to maintain your session and improve 
                      user experience. These are essential for the system to function properly.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">9. Updates to Privacy Policy</h3>
                    <p className="text-sm leading-relaxed">
                      We may update this Privacy Policy from time to time. Any changes will be posted on 
                      this page, and continued use of the system constitutes acceptance of the updated policy.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">10. Contact Us</h3>
                    <p className="text-sm leading-relaxed">
                      If you have any questions or concerns about our Privacy Policy, please contact 
                      Elimar Spring Garden Resort through our official channels.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
